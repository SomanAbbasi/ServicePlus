import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeInput } from '../common/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InputJsonValue = string | number | boolean | Record<string, any> | InputJsonValue[];

function slugify(value: string): string {
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearAgo = new Date(now.getTime() - 365 * 864e5);

    const [bookings, professionals, profiles, reviews, upcoming, recent] =
      await Promise.all([
        this.prisma.booking.findMany({
          where: { createdAt: { gte: yearAgo } },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            scheduledDate: true,
          },
        }),
        this.prisma.professional.findMany({
          select: { id: true, status: true, isActive: true },
        }),
        this.prisma.profile.findMany({
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            createdAt: true,
          },
        }),
        this.prisma.review.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            service: { select: { name: true } },
          },
        }),
        this.prisma.booking.findMany({
          where: { scheduledDate: { startsWith: today } },
          orderBy: { scheduledDate: 'asc' },
          take: 8,
          include: {
            service: { select: { name: true } },
          },
        }),
        this.prisma.booking.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: {
            service: { select: { name: true } },
          },
        }),
      ]);

    const byStatus: Record<string, number> = {};
    let revenueMonth = 0;
    let revenueTotal = 0;
    const series: Record<string, number> = {};

    for (const b of bookings) {
      byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
      const amount = Number(b.total) || 0;
      const paidish =
        b.status === 'COMPLETED' || b.status === 'CONFIRMED';
      if (paidish) {
        revenueTotal += amount;
        if (b.createdAt >= monthStart) revenueMonth += amount;
        const day = b.createdAt.toISOString().slice(0, 10);
        series[day] = (series[day] ?? 0) + amount;
      }
    }

    const newCustomers = profiles.filter(
      (c) => c.createdAt >= monthStart,
    ).length;
    const completed = byStatus['COMPLETED'] ?? 0;
    const cancelled = byStatus['CANCELLED'] ?? 0;
    const pending = (byStatus['PENDING'] ?? 0) + (byStatus['DRAFT'] ?? 0);

    return {
      kpis: {
        todayBookings: upcoming.length,
        totalBookings: bookings.length,
        revenueMonth,
        revenueTotal,
        activeProfessionals: professionals.filter((p) => p.isActive).length,
        professionals: professionals.length,
        newCustomers,
        customers: profiles.length,
        completed,
        cancelled,
        pending,
        aov: completed ? revenueTotal / completed : 0,
      },
      byStatus,
      revenueSeries: Object.entries(series)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      upcoming,
      recentBookings: recent,
      recentCustomers: profiles.slice(0, 6),
      recentReviews: reviews,
    };
  }

  async getCatalog() {
    const [services, categories, listings] = await Promise.all([
      this.prisma.service.findMany({
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          basePrice: true,
          originalPrice: true,
          hourlyRate: true,
          materialsPrice: true,
          bookingType: true,
          durationMinutes: true,
          isActive: true,
          isFeatured: true,
          sortOrder: true,
          categoryId: true,
          imageUrl: true,
        },
      }),
      this.prisma.serviceCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          nameAr: true,
          slug: true,
          icon: true,
          imageUrl: true,
          description: true,
          descriptionAr: true,
          intro: true,
          introAr: true,
          sections: true,
          sectionsAr: true,
          faqs: true,
          faqsAr: true,
          seoTitle: true,
          seoDescription: true,
          isActive: true,
          sortOrder: true,
        },
      }),
      this.prisma.serviceListing.findMany({
        select: { id: true, categoryId: true, serviceId: true, sortOrder: true },
      }),
    ]);
    return { services, categories, listings };
  }

  async updateService(id: string, data: Record<string, any>) {
    const patch = sanitizeInput(data);
    if (data.slug) patch.slug = slugify(data.slug);
    return this.prisma.service.update({ where: { id }, data: patch });
  }

  async createService(data: Record<string, any>) {
    if (!data.name) throw new BadRequestException('Name is required');
    if (!data.category_id && !data.categoryId)
      throw new BadRequestException('Category is required');
    const payload = sanitizeInput(data);
    payload.slug = slugify(data.slug || data.name);
    return this.prisma.service.create({ data: payload as any, select: { id: true } });
  }

  async deleteService(id: string) {
    const count = await this.prisma.booking.count({ where: { serviceId: id } });
    if (count)
      throw new BadRequestException(
        `This service has ${count} booking(s). Disable it instead.`,
      );
    await this.prisma.serviceListing.deleteMany({ where: { serviceId: id } });
    await this.prisma.serviceRelation.deleteMany({ where: { serviceId: id } });
    await this.prisma.addonService.deleteMany({ where: { serviceId: id } });
    await this.prisma.serviceVariant.deleteMany({ where: { serviceId: id } });
    await this.prisma.serviceOptionGroup.deleteMany({
      where: { serviceId: id },
    });
    return this.prisma.service.delete({ where: { id } });
  }

  async duplicateService(id: string) {
    const src = await this.prisma.service.findUnique({ where: { id } });
    if (!src) throw new NotFoundException('Service not found');
    const patch: any = {
      name: `${src.name} (copy)`,
      slug: `${src.slug}-copy-${Date.now().toString(36)}`,
      isActive: false,
      categoryId: src.categoryId,
      bookingType: src.bookingType,
      basePrice: src.basePrice,
      materialsPrice: src.materialsPrice,
    };
    return this.prisma.service.create({ data: patch, select: { id: true } });
  }

  async updateCategory(id: string, data: Record<string, any>) {
    const patch = sanitizeInput(data);
    if (data.slug) patch.slug = slugify(data.slug);
    return this.prisma.serviceCategory.update({
      where: { id },
      data: patch,
    });
  }

  async createCategory(data: Record<string, any>) {
    if (!data.name) throw new BadRequestException('Name is required');
    const payload = sanitizeInput(data);
    payload.slug = slugify(data.slug || data.name);
    if (!payload.icon) payload.icon = 'Sparkles';
    return this.prisma.serviceCategory.create({
      data: payload as any,
      select: { id: true },
    });
  }

  async deleteCategory(id: string) {
    const count = await this.prisma.service.count({
      where: { categoryId: id },
    });
    if (count)
      throw new BadRequestException(
        `${count} service(s) belong to this category. Move them first.`,
      );
    await this.prisma.serviceListing.deleteMany({ where: { categoryId: id } });
    await this.prisma.professionalSkill.deleteMany({
      where: { categoryId: id },
    });
    return this.prisma.serviceCategory.delete({ where: { id } });
  }

  async setServiceListing(
    categoryId: string,
    serviceId: string,
    listed: boolean,
  ) {
    if (listed) {
      return this.prisma.serviceListing.upsert({
        where: { categoryId_serviceId: { categoryId, serviceId } },
        create: { categoryId, serviceId },
        update: {},
      });
    }
    return this.prisma.serviceListing.deleteMany({
      where: { categoryId, serviceId },
    });
  }

  async getAddons() {
    const [addons, links] = await Promise.all([
      this.prisma.addon.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.addonService.findMany({
        select: { addonId: true, serviceId: true },
      }),
    ]);
    return { addons, links };
  }

  async updateAddon(id: string, data: Record<string, any>) {
    const patch = sanitizeInput(data);
    return this.prisma.addon.update({ where: { id }, data: patch });
  }

  async createAddon(data: Record<string, any>) {
    if (!data.name) throw new BadRequestException('Name is required');
    const payload = sanitizeInput(data);
    payload.slug = slugify(data.slug || data.name);
    return this.prisma.addon.create({ data: payload as any, select: { id: true } });
  }

  async deleteAddon(id: string) {
    const count = await this.prisma.bookingAddon.count({
      where: { addonId: id },
    });
    if (count)
      throw new BadRequestException(
        `This add-on is used in ${count} booking(s). Disable it instead.`,
      );
    await this.prisma.addonService.deleteMany({ where: { addonId: id } });
    return this.prisma.addon.delete({ where: { id } });
  }

  async setAddonService(
    addonId: string,
    serviceId: string,
    linked: boolean,
  ) {
    if (linked) {
      try {
        return await this.prisma.addonService.create({
          data: { addonId, serviceId },
        });
      } catch {
        return null;
      }
    }
    return this.prisma.addonService.deleteMany({
      where: { addonId, serviceId },
    });
  }

  async getBundles() {
    return this.prisma.bundle.findMany({
      orderBy: { name: 'asc' },
      include: { items: { select: { id: true, label: true, quantity: true } } },
    });
  }

  async updateBundle(id: string, data: Record<string, any>) {
    const patch = sanitizeInput(data);
    return this.prisma.bundle.update({ where: { id }, data: patch });
  }

  async createBundle(data: Record<string, any>) {
    if (!data.name) throw new BadRequestException('Name is required');
    const payload = sanitizeInput(data);
    payload.slug = slugify(data.slug || data.name);
    return this.prisma.bundle.create({ data: payload as any, select: { id: true } });
  }

  async deleteBundle(id: string) {
    await this.prisma.bundleItem.deleteMany({ where: { bundleId: id } });
    return this.prisma.bundle.delete({ where: { id } });
  }

  async addBundleItem(
    bundleId: string,
    label: string,
    quantity: number,
    serviceId?: string | null,
  ) {
    return this.prisma.bundleItem.create({
      data: {
        bundleId,
        label,
        quantity,
        serviceId: serviceId ?? null,
      },
    });
  }

  async deleteBundleItem(id: string) {
    return this.prisma.bundleItem.delete({ where: { id } });
  }

  async getCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertCoupon(data: Record<string, any>) {
    if (!data.code) throw new BadRequestException('Code is required');
    const payload: any = {
      code: data.code.trim().toUpperCase(),
      description: data.description ?? null,
      discountType: data.discount_type ?? data.discountType ?? 'percentage',
      discountValue: data.discount_value ?? data.discountValue ?? 0,
      maxDiscount: data.max_discount ?? data.maxDiscount ?? null,
      minAmount: data.min_amount ?? data.minAmount ?? 0,
      firstBookingOnly: data.first_booking_only ?? data.firstBookingOnly ?? false,
      maxRedemptions: data.max_redemptions ?? data.maxRedemptions ?? null,
      perUserLimit: data.per_user_limit ?? data.perUserLimit ?? 1,
      expiresAt: data.expires_at ?? data.expiresAt ?? null,
      isFeatured: data.is_featured ?? data.isFeatured ?? false,
      isActive: data.is_active ?? data.isActive ?? true,
    };
    if (data.id) {
      return this.prisma.coupon.update({
        where: { id: data.id },
        data: payload,
      });
    }
    return this.prisma.coupon.create({ data: payload });
  }

  async setCouponActive(id: string, isActive: boolean) {
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive },
    });
  }

  async getLocations() {
    const [countries, cities] = await Promise.all([
      this.prisma.country.findMany(),
      this.prisma.city.findMany({ orderBy: { name: 'asc' } }),
    ]);
    return { countries, cities };
  }

  async updateCity(id: string, data: Record<string, any>) {
    const patch = sanitizeInput(data);
    return this.prisma.city.update({ where: { id }, data: patch });
  }

  async getPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { booking: { select: { bookingNumber: true } } },
    });
  }

  async getRefunds() {
    return this.prisma.refund.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { booking: { select: { bookingNumber: true } } },
    });
  }

  async getReviews() {
    return this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        service: { select: { name: true } },
        professional: { select: { fullName: true } },
      },
    });
  }

  async getNotifications() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async getSupportTickets() {
    return this.prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const messages = await this.prisma.supportMessage.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'asc' },
    });
    return { ticket, messages };
  }

  async replyToTicket(id: string, body: string) {
    return this.prisma.supportMessage.create({
      data: { ticketId: id, sender: 'agent', body },
    });
  }

  async setTicketStatus(id: string, status: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status },
    });
  }

  async getSettings() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async updateSetting(key: string, value: InputJsonValue) {
    return this.prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async logAudit(
    actorId: string,
    actorLabel: string,
    action: string,
    entity: string,
    entityId: string | null,
    after: unknown,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          actorLabel,
          action,
          entity,
          entityId,
          after: after as InputJsonValue,
        },
      });
    } catch {
      /* ignore */
    }
  }

  async getReports() {
    const [bookings, services, cities, professionals] = await Promise.all([
      this.prisma.booking.findMany({
        take: 5000,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          serviceId: true,
          cityId: true,
          professionalId: true,
          userId: true,
        },
      }),
      this.prisma.service.findMany({
        select: { id: true, name: true },
      }),
      this.prisma.city.findMany({
        select: { id: true, name: true },
      }),
      this.prisma.professional.findMany({
        select: { id: true, fullName: true },
      }),
    ]);
    return { bookings, services, cities, professionals };
  }

  async getProfessionals() {
    return this.prisma.professional.findMany({
      orderBy: { fullName: 'asc' },
      include: { city: { select: { name: true } } },
    });
  }

  async getProfessionalDetail(id: string) {
    const [professional, skills, availability, bookings] = await Promise.all([
      this.prisma.professional.findUnique({
        where: { id },
        include: { city: { select: { name: true } } },
      }),
      this.prisma.professionalSkill.findMany({
        where: { professionalId: id },
        include: { category: { select: { name: true } } },
      }),
      this.prisma.professionalAvailability.findMany({
        where: { professionalId: id },
        orderBy: { dayOfWeek: 'asc' },
      }),
      this.prisma.booking.findMany({
        where: { professionalId: id },
        orderBy: { scheduledDate: 'desc' },
        take: 50,
        include: { service: { select: { name: true } } },
      }),
    ]);
    return { professional, skills, availability, bookings };
  }

  async setProfessionalStatus(
    id: string,
    data: { status?: string; isActive?: boolean },
  ) {
    const patch: any = {};
    if (data.status) patch.status = data.status;
    if (typeof data.isActive === 'boolean') patch.isActive = data.isActive;
    return this.prisma.professional.update({ where: { id }, data: patch });
  }

  async createProfessional(data: Record<string, any>) {
    if (!data.full_name && !data.fullName)
      throw new BadRequestException('Name is required');
    const payload = sanitizeInput(data);
    return this.prisma.professional.create({
      data: payload as any,
      select: { id: true },
    });
  }

  async updateProfessional(id: string, data: Record<string, any>) {
    const payload = sanitizeInput(data);
    return this.prisma.professional.update({ where: { id }, data: payload });
  }

  async deleteProfessional(id: string) {
    const count = await this.prisma.booking.count({
      where: { professionalId: id },
    });
    if (count)
      throw new BadRequestException(
        `This professional has ${count} booking(s). Suspend them instead.`,
      );
    await this.prisma.professionalSkill.deleteMany({
      where: { professionalId: id },
    });
    await this.prisma.professionalAvailability.deleteMany({
      where: { professionalId: id },
    });
    return this.prisma.professional.delete({ where: { id } });
  }

  async setProfessionalSkill(
    professionalId: string,
    categoryId: string,
    enabled: boolean,
  ) {
    if (enabled) {
      try {
        return await this.prisma.professionalSkill.create({
          data: { professionalId, categoryId },
        });
      } catch {
        return null;
      }
    }
    return this.prisma.professionalSkill.deleteMany({
      where: { professionalId, categoryId },
    });
  }

  async getCustomers() {
    const [profiles, bookings] = await Promise.all([
      this.prisma.profile.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      this.prisma.booking.findMany({
        take: 5000,
        select: { userId: true, total: true, status: true },
      }),
    ]);
    const stats = new Map<string, { count: number; spend: number }>();
    for (const b of bookings) {
      if (!b.userId) continue;
      const s = stats.get(b.userId) ?? { count: 0, spend: 0 };
      s.count += 1;
      if (b.status === 'COMPLETED') s.spend += Number(b.total) || 0;
      stats.set(b.userId, s);
    }
    return profiles.map((p) => ({
      ...p,
      bookings: stats.get(p.id)?.count ?? 0,
      spend: stats.get(p.id)?.spend ?? 0,
    }));
  }

  async getCustomerDetail(id: string) {
    const [profile, addresses, bookings, reviews, tickets] = await Promise.all([
      this.prisma.profile.findUnique({ where: { id } }),
      this.prisma.address.findMany({
        where: { userId: id },
        select: { id: true, label: true, street: true, building: true, isDefault: true },
      }),
      this.prisma.booking.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: { service: { select: { name: true } } },
      }),
      this.prisma.review.findMany({
        where: { userId: id },
        include: { service: { select: { name: true } } },
      }),
      this.prisma.supportTicket.findMany({
        where: { userId: id },
        select: { id: true, subject: true, status: true, createdAt: true },
      }),
    ]);
    return { profile, addresses, bookings, reviews, tickets };
  }

  async getBookings() {
    return this.prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        service: { select: { name: true } },
        professional: { select: { fullName: true } },
        city: { select: { name: true } },
        profile: { select: { fullName: true, phone: true } },
      },
    });
  }

  async getBookingDetail(id: string) {
    const [booking, items, addons, history, payments] = await Promise.all([
      this.prisma.booking.findUnique({
        where: { id },
        include: {
          service: { select: { name: true, imageUrl: true } },
          professional: { select: { fullName: true } },
          city: { select: { name: true } },
          profile: { select: { fullName: true, phone: true } },
          address: {
            select: {
              id: true,
              label: true,
              street: true,
              building: true,
              unit: true,
              instructions: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      }),
      this.prisma.bookingItem.findMany({
        where: { bookingId: id },
        include: {
          variant: { select: { id: true, name: true, imageUrl: true } },
        },
      }),
      this.prisma.bookingAddon.findMany({
        where: { bookingId: id },
        include: {
          addon: { select: { id: true, name: true, imageUrl: true } },
        },
      }),
      this.prisma.bookingStatusHistory.findMany({
        where: { bookingId: id },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: { bookingId: id },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return { booking, items, addons, history, payments };
  }


  async setBookingStatus(
    id: string,
    status: string,
    note?: string,
    actorLabel = 'admin',
  ) {
    const current = await this.prisma.booking.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new NotFoundException('Booking not found');
    await this.prisma.booking.update({
      where: { id },
      data: { status: status as any },
    });
    await this.prisma.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: current.status,
        toStatus: status as any,
        note: note ?? null,
        actor: actorLabel,
      },
    });
    return { ok: true };
  }

  async assignProfessional(
    id: string,
    professionalId: string | null,
  ) {
    const update: any = { professionalId };
    if (professionalId) update.status = 'ASSIGNED';
    return this.prisma.booking.update({ where: { id }, data: update });
  }

  async getAvailability() {
    return this.prisma.professionalAvailability.findMany({
      orderBy: { dayOfWeek: 'asc' },
      include: { professional: { select: { fullName: true } } },
    });
  }

  async getServiceVariants(serviceId: string) {
    return this.prisma.serviceVariant.findMany({
      where: { serviceId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getServiceOptionGroups(serviceId: string) {
    return this.prisma.serviceOptionGroup.findMany({
      where: { serviceId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async upsertOptionGroup(data: Record<string, any>) {
    if (data.id) {
      const patch = sanitizeInput(data);
      return this.prisma.serviceOptionGroup.update({
        where: { id: data.id },
        data: patch,
      });
    }
    const payload = sanitizeInput(data);
    return this.prisma.serviceOptionGroup.create({
      data: payload as any,
      select: { id: true },
    });
  }

  async deleteOptionGroup(id: string) {
    await this.prisma.serviceVariant.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });
    return this.prisma.serviceOptionGroup.delete({ where: { id } });
  }

  async upsertVariant(data: Record<string, any>) {
    if (data.id) {
      const patch = sanitizeInput(data);
      return this.prisma.serviceVariant.update({
        where: { id: data.id },
        data: patch,
      });
    }
    const payload = sanitizeInput(data);
    return this.prisma.serviceVariant.create({ data: payload as any });
  }

  async deleteVariant(id: string) {
    return this.prisma.serviceVariant.delete({ where: { id } });
  }
}
