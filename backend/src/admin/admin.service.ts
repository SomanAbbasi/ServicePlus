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
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 864e5);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
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
          take: 500,
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
          take: 20,
          include: {
            service: { select: { name: true } },
          },
        }),
        this.prisma.booking.findMany({
          where: { scheduledDate: { startsWith: todayStr } },
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

    const byStatusRaw: Record<string, number> = {};
    let revenueMonth = 0;
    let revenueTotal = 0;

    let todayBookingsCount = 0;
    let yesterdayBookingsCount = 0;
    let monthBookingsCount = 0;
    let lastMonthBookingsCount = 0;

    // Build last 30 days map
    const trendsMap: Record<string, { bookings: number; revenue: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 864e5);
      const key = d.toISOString().slice(0, 10);
      trendsMap[key] = { bookings: 0, revenue: 0 };
    }

    for (const b of bookings) {
      byStatusRaw[b.status] = (byStatusRaw[b.status] ?? 0) + 1;
      const amount = Number(b.total) || 0;
      const paidish = b.status === 'COMPLETED' || b.status === 'CONFIRMED';
      if (paidish) {
        revenueTotal += amount;
        if (b.createdAt >= monthStart) revenueMonth += amount;
      }

      const dayCreated = b.createdAt.toISOString().slice(0, 10);
      if (dayCreated === todayStr) todayBookingsCount++;
      if (dayCreated === yesterdayStr) yesterdayBookingsCount++;

      if (b.createdAt >= monthStart) monthBookingsCount++;
      else if (b.createdAt >= lastMonthStart && b.createdAt <= lastMonthEnd) lastMonthBookingsCount++;

      if (trendsMap[dayCreated]) {
        trendsMap[dayCreated].bookings += 1;
        if (paidish) trendsMap[dayCreated].revenue += amount;
      }
    }

    const todayVsYesterdayPct = yesterdayBookingsCount > 0
      ? Math.round(((todayBookingsCount - yesterdayBookingsCount) / yesterdayBookingsCount) * 100)
      : todayBookingsCount > 0 ? 100 : 0;

    const monthVsLastMonthPct = lastMonthBookingsCount > 0
      ? Math.round(((monthBookingsCount - lastMonthBookingsCount) / lastMonthBookingsCount) * 100)
      : monthBookingsCount > 0 ? 100 : 0;

    const avgRating = reviews.length > 0
      ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(2))
      : 0;

    // Friendly status distribution
    const statusMapping: Record<string, string> = {
      CONFIRMED: 'Confirmed',
      COMPLETED: 'Completed',
      IN_PROGRESS: 'In Progress',
      CANCELLED: 'Cancelled',
      PENDING: 'Pending',
      DRAFT: 'Draft',
    };

    const friendlyByStatus: Record<string, number> = {};
    const friendlyStatusCounts: Record<string, number> = {};
    const totalCount = bookings.length;

    for (const [st, count] of Object.entries(byStatusRaw)) {
      const friendlyName = statusMapping[st] || st;
      friendlyStatusCounts[friendlyName] = (friendlyStatusCounts[friendlyName] || 0) + count;
      if (totalCount > 0) {
        friendlyByStatus[friendlyName] = Number(((count / totalCount) * 100).toFixed(1));
      }
    }

    const bookingTrends30Days = Object.entries(trendsMap).map(([dateStr, val]) => {
      const d = new Date(dateStr);
      const formattedDate = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
      return {
        date: formattedDate,
        bookings: val.bookings,
        revenue: val.revenue,
      };
    });

    return {
      kpis: {
        total_customers: profiles.length,
        total_companies: 0,
        total_professionals: professionals.length,
        total_bookings: bookings.length,
        total_revenue: Number(revenueTotal.toFixed(2)),
        average_rating: avgRating,
        pending_material_requests: 0,
        documents_expiring_30_days: 0,
        today_bookings: todayBookingsCount,
        yesterday_bookings: yesterdayBookingsCount,
        today_vs_yesterday_pct: todayVsYesterdayPct,
        month_bookings: monthBookingsCount,
        last_month_bookings: lastMonthBookingsCount,
        month_vs_last_month_pct: monthVsLastMonthPct,
        activeProfessionals: professionals.filter((p) => p.isActive).length,
        revenueMonth,
        revenueTotal,
        customers: profiles.length,
        totalBookings: bookings.length,
      },
      by_status: friendlyByStatus,
      status_counts: friendlyStatusCounts,
      booking_trends_30_days: bookingTrends30Days,
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
          nameAr: true,
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

    return {
      services: services.map((s) => ({
        ...s,
        category_id: s.categoryId,
        image_url: s.imageUrl,
        is_active: s.isActive,
        is_featured: s.isFeatured,
        base_price: s.basePrice,
        original_price: s.originalPrice,
        hourly_rate: s.hourlyRate,
        materials_price: s.materialsPrice,
        short_description: s.shortDescription,
        duration_minutes: s.durationMinutes,
        booking_type: s.bookingType,
        sort_order: s.sortOrder,
      })),
      categories: categories.map((c) => ({
        ...c,
        image_url: c.imageUrl,
        is_active: c.isActive,
        name_ar: c.nameAr,
        description_ar: c.descriptionAr,
        intro_ar: c.introAr,
        sections_ar: c.sectionsAr,
        faqs_ar: c.faqsAr,
        seo_title: c.seoTitle,
        seo_description: c.seoDescription,
        sort_order: c.sortOrder,
      })),
      listings: listings.map((l) => ({
        ...l,
        category_id: l.categoryId,
        service_id: l.serviceId,
        sort_order: l.sortOrder,
      })),
    };
  }

  async updateService(id: string, data: Record<string, any>) {
    const patch = sanitizeInput(data);
    if (data.slug) patch.slug = slugify(data.slug);
    if (patch.isActive === true) {
      const existing = await this.prisma.service.findUnique({
        where: { id },
        select: { categoryId: true },
      });
      const targetCatId = patch.categoryId || existing?.categoryId;
      if (targetCatId) {
        const cat = await this.prisma.serviceCategory.findUnique({
          where: { id: targetCatId },
          select: { isActive: true },
        });
        if (cat && !cat.isActive) {
          throw new BadRequestException(
            'Cannot activate service because its category is disabled.',
          );
        }
      }
    }
    return this.prisma.service.update({ where: { id }, data: patch });
  }

  async createService(data: Record<string, any>) {
    if (!data.name) throw new BadRequestException('Name is required');
    if (!data.category_id && !data.categoryId)
      throw new BadRequestException('Category is required');
    const payload = sanitizeInput(data);
    payload.slug = slugify(data.slug || data.name);
    if (payload.isActive && payload.categoryId) {
      const cat = await this.prisma.serviceCategory.findUnique({
        where: { id: payload.categoryId },
        select: { isActive: true },
      });
      if (cat && !cat.isActive) {
        payload.isActive = false;
      }
    }
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
    const result = await this.prisma.serviceCategory.update({
      where: { id },
      data: patch,
    });
    if (typeof patch.isActive === 'boolean') {
      await this.prisma.service.updateMany({
        where: { categoryId: id },
        data: { isActive: patch.isActive },
      });
    }
    return result;
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

    return {
      addons: addons.map((a) => ({
        ...a,
        image_url: a.imageUrl,
        is_active: a.isActive,
        min_quantity: a.minQuantity,
        max_quantity: a.maxQuantity,
        duration_minutes: a.durationMinutes,
        original_price: a.originalPrice,
        sort_order: a.sortOrder,
      })),
      links: links.map((l) => ({
        ...l,
        addon_id: l.addonId,
        service_id: l.serviceId,
      })),
    };
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

  async deleteCoupon(id: string) {
    await this.prisma.couponRedemption.deleteMany({ where: { couponId: id } });
    await this.prisma.booking.updateMany({ where: { couponId: id }, data: { couponId: null } });
    return this.prisma.coupon.delete({ where: { id } });
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
    try {
      return await this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 300,
      });
    } catch (err) {
      console.warn('Could not fetch notifications from DB:', err);
      return [];
    }
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

  /* ============================================================ ENTERPRISE ADMIN METHODS */

  async getUsers() {
    const profiles = await this.prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: true,
        addresses: { where: { isDefault: true } },
      },
    });

    return profiles.map((p) => ({
      id: p.id,
      fullName: p.fullName || 'User',
      email: p.email || '',
      phone: p.phone || '',
      walletBalance: 0,
      status: 'Activated',
      role: p.userRoles?.[0]?.role || 'customer',
      avatarUrl: p.avatarUrl,
      registeredOn: p.createdAt.toISOString().slice(0, 10),
      createdAt: p.createdAt.toISOString(),
      address: p.addresses?.[0]?.street || '',
    }));
  }

  async createUser(data: Record<string, any>) {
    const payload = sanitizeInput(data);
    return this.prisma.profile.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        avatarUrl: payload.avatarUrl,
      },
    });
  }

  async updateUser(id: string, data: Record<string, any>) {
    const payload = sanitizeInput(data);
    return this.prisma.profile.update({
      where: { id },
      data: {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
      },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.profile.delete({ where: { id } });
  }

  // Roles
  async getRoles() {
    return [
      {
        id: 'role-super-admin',
        name: 'Super Administrator',
        status: 'Activated',
        registeredOn: '2026-01-01',
        permissions: {
          dashboard: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
          users: { view: true, create: true, edit: true, delete: true, export: true },
          staff: { view: true, create: true, edit: true, delete: true },
          roles: { view: true, create: true, edit: true, delete: true },
          professionals: { view: true, create: true, edit: true, delete: true },
          team_leads: { view: true, create: true, edit: true, delete: true },
          companies: { view: true, create: true, edit: true, delete: true },
          supervisors: { view: true, create: true, edit: true, delete: true },
          categories: { view: true, create: true, edit: true, delete: true },
          services: { view: true, create: true, edit: true, delete: true },
          service_grouping: { view: true, create: true, edit: true, delete: true },
          plans: { view: true, create: true, edit: true, delete: true },
          coupons: { view: true, create: true, edit: true, delete: true },
          bookings: { view: true, create: true, edit: true, delete: true, approve: true },
          calendar: { view: true, create: true, edit: true, delete: true },
          reviews: { view: true, create: true, edit: true, delete: true },
          payments: { view: true, create: true, edit: true, delete: true, export: true },
          expired_documents: { view: true, create: true, edit: true, delete: true, approve: true },
          materials: { view: true, create: true, edit: true, delete: true },
          material_requests: { view: true, create: true, edit: true, delete: true, approve: true },
          settings: { view: true, create: true, edit: true, delete: true },
        },
      },
      {
        id: 'role-operations',
        name: 'Operations Manager',
        status: 'Activated',
        registeredOn: '2026-01-01',
        permissions: {
          dashboard: { view: true, create: false, edit: false, delete: false, export: true },
          users: { view: true, create: true, edit: true, delete: false },
          professionals: { view: true, create: true, edit: true, delete: false },
          team_leads: { view: true, create: true, edit: true, delete: false },
          companies: { view: true, create: true, edit: true, delete: false },
          supervisors: { view: true, create: true, edit: true, delete: false },
          bookings: { view: true, create: true, edit: true, delete: false, approve: true },
          calendar: { view: true, create: true, edit: true, delete: false },
          expired_documents: { view: true, create: true, edit: true, delete: false, approve: true },
          materials: { view: true, create: true, edit: true, delete: false },
          material_requests: { view: true, create: true, edit: true, delete: false, approve: true },
        },
      },
    ];
  }

  async createRole(data: any) {
    return { ok: true, id: `role-${Date.now()}`, ...sanitizeInput(data) };
  }

  async updateRole(id: string, data: any) {
    return { ok: true, id, ...sanitizeInput(data) };
  }

  async deleteRole(id: string) {
    return { ok: true, id };
  }

  // Staff
  async getStaff() {
    return [];
  }

  async createStaff(data: any) {
    return { ok: true, id: `staff-${Date.now()}`, ...sanitizeInput(data) };
  }

  async updateStaff(id: string, data: any) {
    return { ok: true, id, ...sanitizeInput(data) };
  }

  async deleteStaff(id: string) {
    return { ok: true, id };
  }

  // Companies
  async getCompanies() {
    return [];
  }

  async createCompany(data: any) {
    return { ok: true, id: `comp-${Date.now()}`, ...sanitizeInput(data) };
  }

  async updateCompany(id: string, data: any) {
    return { ok: true, id, ...sanitizeInput(data) };
  }

  async deleteCompany(id: string) {
    return { ok: true, id };
  }

  // Team Leads
  async getTeamLeads() {
    return [];
  }

  async createTeamLead(data: any) {
    return { ok: true, id: `tl-${Date.now()}`, ...sanitizeInput(data) };
  }

  async updateTeamLead(id: string, data: any) {
    return { ok: true, id, ...sanitizeInput(data) };
  }

  async deleteTeamLead(id: string) {
    return { ok: true, id };
  }

  // Supervisors
  async getSupervisors() {
    return [];
  }

  async createSupervisor(data: any) {
    return { ok: true, id: `sup-${Date.now()}`, ...sanitizeInput(data) };
  }

  async updateSupervisor(id: string, data: any) {
    return { ok: true, id, ...sanitizeInput(data) };
  }

  async deleteSupervisor(id: string) {
    return { ok: true, id };
  }

  // Materials & Requests
  async getMaterials() {
    return [];
  }

  async createMaterial(data: any) {
    return { ok: true, id: `mat-${Date.now()}`, ...sanitizeInput(data) };
  }

  async updateMaterial(id: string, data: any) {
    return { ok: true, id, ...sanitizeInput(data) };
  }

  async deleteMaterial(id: string) {
    return { ok: true, id };
  }

  async getMaterialRequests() {
    return [];
  }

  async createMaterialRequest(data: any) {
    return { ok: true, id: `req-${Date.now()}`, ...sanitizeInput(data) };
  }

  async updateMaterialRequest(id: string, data: any) {
    return { ok: true, id, ...sanitizeInput(data) };
  }

  // Plans
  async getPlans() {
    return [];
  }

  async createPlan(data: any) {
    return { ok: true, id: `plan-${Date.now()}`, ...sanitizeInput(data) };
  }

  async updatePlan(id: string, data: any) {
    return { ok: true, id, ...sanitizeInput(data) };
  }

  async deletePlan(id: string) {
    return { ok: true, id };
  }
}


