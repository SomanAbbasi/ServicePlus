import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PricingServiceEngine,
  PricingLine,
  frequencyDiscountPct,
} from '../pricing/pricing.service';
import {
  AvailabilityService,
  toMinutes,
  toTime,
  SLOT_HOLD_MINUTES,
} from '../availability/availability.service';
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
} from '../common/providers/payment.provider';
import {
  NOTIFICATION_PROVIDER,
  NotificationProvider,
} from '../common/providers/notification.provider';

const BOOKING_CANCEL_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'ASSIGNING',
  'ASSIGNED',
  'RESCHEDULED',
];

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private pricingEngine: PricingServiceEngine,
    private availabilityService: AvailabilityService,
    @Inject(PAYMENT_PROVIDER) private paymentProvider: PaymentProvider,
    @Inject(NOTIFICATION_PROVIDER)
    private notificationProvider: NotificationProvider,
  ) {}

  async getQuote(input: {
    serviceSlug: string;
    hours: number;
    professionals: number;
    materials: boolean;
    variantIds: { id: string; quantity: number }[];
    addonIds: { id: string; quantity: number }[];
    couponCode?: string | null;
    citySlug?: string | null;
    frequency?: string | null;
  }) {
    const service = await this.prisma.service.findFirst({
      where: { slug: input.serviceSlug, isActive: true, category: { isActive: true } },
      select: {
        id: true,
        name: true,
        slug: true,
        bookingType: true,
        basePrice: true,
        hourlyRate: true,
        materialsPrice: true,
        extraProfessionalPct: true,
        durationMinutes: true,
      },
    });
    if (!service) throw new BadRequestException('That service is not available.');

    const variantIds = input.variantIds.map((v) => v.id);
    const addonIds = input.addonIds.map((a) => a.id);

    const [allServiceVariants, addons, city, coupon] = await Promise.all([
      variantIds.length
        ? this.prisma.serviceVariant.findMany({
            where: {
              serviceId: service.id,
              isActive: true,
            },
            select: { id: true, name: true, price: true, durationMinutes: true, description: true },
          })
        : [] as { id: string; name: string; price: number; durationMinutes: number; description?: string | null }[],
      addonIds.length
        ? this.prisma.addon.findMany({
            where: { id: { in: addonIds }, isActive: true },
            select: { id: true, name: true, price: true },
          })
        : [] as { id: string; name: string; price: number }[],
      input.citySlug
        ? this.prisma.city.findFirst({
            where: { slug: input.citySlug, isActive: true },
            select: { id: true, surchargePct: true },
          })
        : null,
      input.couponCode
        ? this.prisma.coupon.findFirst({
            where: { code: input.couponCode.toUpperCase() },
          })
        : null,
    ]);

    const resolvedVariants: { id: string; name: string; price: number; durationMinutes: number }[] = [];
    for (const v of allServiceVariants) {
      if (variantIds.includes(v.id)) {
        resolvedVariants.push({
          id: v.id,
          name: v.name,
          price: Number(v.price),
          durationMinutes: v.durationMinutes ?? 0,
        });
      }
      if (v.description && v.description.includes('sub_options')) {
        try {
          const parsed = JSON.parse(v.description);
          if (Array.isArray(parsed.sub_options)) {
            for (const sub of parsed.sub_options) {
              if (variantIds.includes(sub.id)) {
                resolvedVariants.push({
                  id: sub.id,
                  name: sub.name || v.name,
                  price: Number(sub.price || 0),
                  durationMinutes: Number(sub.durationMinutes || 0),
                });
              }
            }
          }
        } catch {}
      }
    }

    const variantLines: PricingLine[] = resolvedVariants.map((v) => ({
      label: v.name,
      unit_price: Number(v.price),
      quantity: input.variantIds.find((x) => x.id === v.id)?.quantity ?? 1,
    }));
    const addonLines: PricingLine[] = addons.map((a) => ({
      label: a.name,
      unit_price: Number(a.price),
      quantity: input.addonIds.find((x) => x.id === a.id)?.quantity ?? 1,
    }));

    let couponError: string | null = null;
    let usableCoupon: {
      code: string;
      discount_type: string;
      discount_value: number;
      max_discount: number | null;
      min_amount: number;
    } | null = null;
    if (input.couponCode) {
      const now = Date.now();
      if (!coupon || !coupon.isActive)
        couponError = 'That coupon code is not valid.';
      else if (coupon.expiresAt && coupon.expiresAt.getTime() < now)
        couponError = 'That coupon has expired.';
      else if (coupon.startsAt && coupon.startsAt.getTime() > now)
        couponError = 'That coupon is not active yet.';
      else if (
        coupon.maxRedemptions != null &&
        coupon.redemptionCount >= coupon.maxRedemptions
      )
        couponError = 'That coupon has been fully redeemed.';
      else
        usableCoupon = {
          code: coupon.code,
          discount_type: coupon.discountType,
          discount_value: Number(coupon.discountValue),
          max_discount:
            coupon.maxDiscount == null ? null : Number(coupon.maxDiscount),
          min_amount: Number(coupon.minAmount),
        };
    }

    const breakdown = this.pricingEngine.calculateBookingPrice({
      service: {
        booking_type: service.bookingType,
        base_price: Number(service.basePrice),
        hourly_rate: service.hourlyRate == null ? null : Number(service.hourlyRate),
        materials_price: Number(service.materialsPrice),
        extra_professional_pct: Number(service.extraProfessionalPct),
      },
      hours: input.hours,
      professionals: input.professionals,
      materials: input.materials,
      items: variantLines,
      addons: addonLines,
      coupon: usableCoupon,
      citySurchargePct: city ? Number(city.surchargePct) : 0,
      frequencyDiscountPct: frequencyDiscountPct(input.frequency),
    });

    const variantMinutes = resolvedVariants.reduce(
      (sum, v) =>
        sum +
        (v.durationMinutes ?? 0) *
          (input.variantIds.find((x) => x.id === v.id)?.quantity ?? 1),
      0,
    );
    const durationMinutes =
      service.bookingType === 'hourly'
        ? Math.ceil((input.hours * 60) / Math.max(1, input.professionals))
        : variantMinutes > 0
        ? variantMinutes
        : (service.durationMinutes ?? 60);

    return {
      breakdown,
      couponError,
      durationMinutes,
      lines: { variants: variantLines, addons: addonLines },
    };
  }

  async getAvailability(input: {
    date: string;
    durationMinutes: number;
    citySlug?: string | null;
  }) {
    const [professionalCount, holds] = await Promise.all([
      this.prisma.professional.count({
        where: { isActive: true, status: { in: ['AVAILABLE', 'BUSY'] } },
      }),
      this.prisma.slotHold.findMany({
        where: {
          slotDate: input.date,
          expiresAt: { gt: new Date() },
        },
        select: { slotStart: true, slotEnd: true },
      }),
    ]);

    const occupied = holds.map((h) => ({ start: h.slotStart, end: h.slotEnd }));
    const capacity = Math.max(1, Math.min(12, professionalCount || 4));

    return {
      slots: this.availabilityService.generateSlots({
        date: input.date,
        durationMinutes: input.durationMinutes,
        capacity,
        occupied,
      }),
      capacity,
    };
  }

  async createBooking(
    userId: string | undefined | null,
    input: {
      serviceSlug: string;
      hours: number;
      professionals: number;
      materials: boolean;
      variantIds: { id: string; quantity: number }[];
      addonIds: { id: string; quantity: number }[];
      couponCode?: string | null;
      citySlug?: string | null;
      frequency?: string | null;
      addressId: string;
      scheduledDate: string;
      scheduledStart: string;
      instructions?: string | null;
      paymentMethod: string;
      idempotencyKey: string;
    },
  ) {
    const existing = await this.prisma.booking.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, bookingNumber: true },
    });
    if (existing) return existing;

    const finalUserId = await this.resolveValidUserId(userId);

    let finalAddressId = input.addressId;
    let addr = await this.prisma.address.findUnique({
      where: { id: finalAddressId },
      select: { id: true },
    });
    if (!addr) {
      const newAddr = await this.prisma.address.create({
        data: {
          userId: finalUserId,
          label: 'Home',
          street: 'Dubai, United Arab Emirates',
        },
        select: { id: true },
      });
      finalAddressId = newAddr.id;
    }

    const quote = await this.getQuote(input);
    const end = toTime(toMinutes(input.scheduledStart) + quote.durationMinutes);
    const bookingNumber = `SP-${Date.now().toString(36).toUpperCase()}`;

    const cityId = await this.getCityId(input.citySlug);
    const couponId = await this.getCouponId(input.couponCode);
    const serviceId = await this.getServiceId(input.serviceSlug);

    const booking = await this.prisma.booking.create({
      data: {
        bookingNumber,
        userId: finalUserId,
        serviceId,
        addressId: finalAddressId,
        cityId,
        couponId,
        hours: input.hours,
        professionalsCount: input.professionals,
        materials: input.materials,
        instructions: input.instructions,
        scheduledDate: input.scheduledDate,
        scheduledStart: input.scheduledStart,
        scheduledEnd: end,
        subtotal: quote.breakdown.subtotal + quote.breakdown.items,
        addonsTotal: quote.breakdown.addons,
        materialsTotal: quote.breakdown.materials,
        discount: quote.breakdown.discount + quote.breakdown.frequencyDiscount,
        fees: quote.breakdown.fees,
        tax: quote.breakdown.tax,
        total: quote.breakdown.total,
        paymentMethod: input.paymentMethod,
        status: 'PENDING',
        idempotencyKey: input.idempotencyKey,
      },
      select: { id: true, bookingNumber: true },
    });

    const bookingItems = [
      ...quote.lines.variants.map((line) => ({
        bookingId: booking.id,
        label: line.label,
        unitPrice: line.unit_price,
        quantity: line.quantity,
      })),
      ...quote.lines.addons.map((line) => ({
        bookingId: booking.id,
        label: `Add-on: ${line.label}`,
        unitPrice: line.unit_price,
        quantity: line.quantity,
      })),
    ];
    if (bookingItems.length) {
      await this.prisma.bookingItem.createMany({ data: bookingItems });
    }

    await this.prisma.slotHold.create({
      data: {
        bookingId: booking.id,
        cityId,
        slotDate: input.scheduledDate,
        slotStart: input.scheduledStart,
        slotEnd: end,
        expiresAt: new Date(Date.now() + SLOT_HOLD_MINUTES * 60_000),
      },
    });

    const charge = await this.paymentProvider.charge({
      amount: quote.breakdown.total,
      method: input.paymentMethod,
      bookingNumber,
    });

    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: quote.breakdown.total,
        method: input.paymentMethod,
        status: charge.status,
        providerReference: charge.reference,
      },
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: charge.status === 'PAID' ? 'CONFIRMED' : 'PAYMENT_FAILED',
        paymentStatus: charge.status === 'PAID' ? 'PAID' : 'FAILED',
      },
    });

    await this.prisma.jobQueue.createMany({
      data: [
        { jobType: 'assign_professional', payload: { booking_id: booking.id } },
        {
          jobType: 'notify',
          payload: { booking_id: booking.id, event: 'booking_confirmed', channel: 'sms' },
        },
      ],
    });

    // Fetch detailed records for rich Admin notification email
    const [userProfile, fullAddress, fullService, adminEmailSetting] = await Promise.all([
      this.prisma.profile.findUnique({ where: { id: finalUserId }, select: { phone: true, fullName: true, email: true } }),
      this.prisma.address.findUnique({ where: { id: finalAddressId }, select: { street: true, building: true, label: true } }),
      this.prisma.service.findUnique({ where: { id: serviceId }, select: { name: true } }),
      this.prisma.setting.findFirst({ where: { key: 'admin_email' } }),
    ]);

    const targetAdminEmail = String(adminEmailSetting?.value || 'somanabbasi305@gmail.com');
    const serviceName = fullService?.name || input.serviceSlug;
    const customerPhone = userProfile?.phone || userProfile?.fullName || 'Customer';
    const addressStr = fullAddress ? `${fullAddress.street}${fullAddress.building ? ', ' + fullAddress.building : ''} (${fullAddress.label})` : 'Address provided';

    const itemsSummaryList = [
      ...quote.lines.variants.map((v) => `• ${v.label} (x${v.quantity}) — AED ${(v.unit_price * v.quantity).toFixed(2)}`),
      ...quote.lines.addons.map((a) => `• Add-on: ${a.label} (x${a.quantity}) — AED ${(a.unit_price * a.quantity).toFixed(2)}`),
    ];
    const itemsFormattedText = itemsSummaryList.length ? itemsSummaryList.join('\n') : '• Standard Service';

    const emailBody = `
========================================================
🎉 NEW ORDER PLACED — BOOKING #${bookingNumber}
========================================================

Customer Contact: ${customerPhone}
Service: ${serviceName}
Scheduled Date: ${input.scheduledDate}
Time Slot: ${input.scheduledStart} - ${end}

Delivery Address:
${addressStr}

Selected Package Options & Items:
${itemsFormattedText}

Payment Summary:
Method: ${input.paymentMethod.toUpperCase()}
Total Amount: AED ${quote.breakdown.total.toFixed(2)}
========================================================
`;

    // Customer Notification
    await this.prisma.notification.create({
      data: {
        userId: finalUserId,
        bookingId: booking.id,
        title: 'Booking confirmed',
        body: `Booking #${bookingNumber} on ${input.scheduledDate} at ${input.scheduledStart}.`,
        event: 'booking_confirmed',
      },
    });


    // Admin System Notification (for real-time dashboard updates)
    await this.prisma.notification.create({
      data: {
        userId: null,
        bookingId: booking.id,
        title: `New Order #${bookingNumber}`,
        body: `${serviceName} for ${customerPhone} on ${input.scheduledDate} at ${input.scheduledStart}. Total: AED ${quote.breakdown.total.toFixed(2)} (${input.paymentMethod.toUpperCase()}).`,
        event: 'new_booking_alert',
      },
    });

    // Send Admin Notification Email
    try {
      await this.notificationProvider.send({
        channel: 'email',
        to: targetAdminEmail,
        event: 'new_booking_alert',
        title: `[New Order Alert] Booking #${bookingNumber} — ${serviceName} (AED ${quote.breakdown.total.toFixed(2)})`,
        body: emailBody,
      });
    } catch (e) {
      console.error('Error sending admin notification email:', e);
    }

    return booking;
  }

  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        paymentStatus: true,
        scheduledDate: true,
        scheduledStart: true,
        scheduledEnd: true,
        hours: true,
        professionalsCount: true,
        materials: true,
        instructions: true,
        paymentMethod: true,
        createdAt: true,
        total: true,
        address: { select: { street: true, building: true, label: true } },
        service: { select: { name: true, slug: true, imageUrl: true } },
        items: { select: { label: true, quantity: true, unitPrice: true } },
      },
    });
  }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, userId: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.userId !== userId)
      throw new BadRequestException('Not your booking.');

    if (!BOOKING_CANCEL_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        'This booking can no longer be cancelled online.',
      );
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.slotHold.deleteMany({ where: { bookingId } });

    return { ok: true };
  }

  private async resolveValidUserId(userId?: string | null): Promise<string> {
    if (userId && userId !== 'admin-local') {
      try {
        const exists = await this.prisma.profile.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (exists) return exists.id;
      } catch {}
    }
    return this.getOrCreateGuestUser();
  }

  async createAddress(
    userId: string | undefined | null,
    data: { label?: string; street: string; building?: string | null },
  ) {
    if (!data.street?.trim())
      throw new BadRequestException('Enter your street address.');
    const finalUserId = await this.resolveValidUserId(userId);
    return this.prisma.address.create({
      data: {
        userId: finalUserId,
        label: data.label || 'Home',
        street: data.street,
        building: data.building ?? null,
      },
      select: { id: true, label: true, street: true, building: true, isDefault: true },
    });
  }

  private async getOrCreateGuestUser(): Promise<string> {
    let guest = await this.prisma.profile.findFirst({
      where: { email: 'guest@serviceplus.ae' },
      select: { id: true },
    });
    if (!guest) {
      guest = await this.prisma.profile.create({
        data: {
          fullName: 'Guest Customer',
          email: 'guest@serviceplus.ae',
          phone: '+971500000000',
        },
        select: { id: true },
      });
    }
    return guest.id;
  }


  async getMyAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, label: true, street: true, building: true, isDefault: true },
    });
  }

  private async getServiceId(slug: string) {
    const s = await this.prisma.service.findFirst({
      where: { slug, isActive: true, category: { isActive: true } },
      select: { id: true },
    });
    if (!s) throw new BadRequestException('Service not found.');
    return s.id;
  }

  private async getCityId(slug?: string | null) {
    if (!slug) return null;
    const c = await this.prisma.city.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });
    return c?.id ?? null;
  }

  private async getCouponId(code?: string | null) {
    if (!code) return null;
    const c = await this.prisma.coupon.findFirst({
      where: { code: code.toUpperCase() },
      select: { id: true },
    });
    return c?.id ?? null;
  }
}
