import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async getAllServices() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        nameAr: true,
        shortDescription: true,
        imageUrl: true,
        basePrice: true,
        originalPrice: true,
        bookingType: true,
        rating: true,
        reviewCount: true,
        categoryId: true,
      },
    });
  }

  async getServiceBySlug(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, isActive: true },
      include: { category: { select: { id: true, slug: true, name: true } } },
    });
    if (!service) return null;

    const [variants, optionGroups, relations, addonLinks] = await Promise.all([
      this.prisma.serviceVariant.findMany({
        where: { serviceId: service.id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          nameAr: true,
          description: true,
          descriptionAr: true,
          imageUrl: true,
          groupId: true,
          price: true,
          originalPrice: true,
          durationMinutes: true,
          maxQuantity: true,
        },
      }),
      this.prisma.serviceOptionGroup.findMany({
        where: { serviceId: service.id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          nameAr: true,
          imageUrl: true,
          sortOrder: true,
        },
      }),
      this.prisma.serviceRelation.findMany({
        where: { serviceId: service.id },
        orderBy: { sortOrder: 'asc' },
        select: { relatedServiceId: true, sortOrder: true },
      }),
      this.prisma.addonService.findMany({
        where: { serviceId: service.id },
        select: {
          addon: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              imageUrl: true,
              price: true,
              originalPrice: true,
              maxQuantity: true,
            },
          },
        },
      }),
    ]);

    const relatedIds = relations.map((r) => r.relatedServiceId);
    const related = relatedIds.length
      ? this.prisma.service.findMany({
          where: { id: { in: relatedIds }, isActive: true },
          select: {
            id: true,
            slug: true,
            name: true,
            shortDescription: true,
            imageUrl: true,
            basePrice: true,
            originalPrice: true,
            bookingType: true,
            rating: true,
            reviewCount: true,
            categoryId: true,
          },
        })
      : [];

    return {
      service,
      variants,
      optionGroups: optionGroups.map((g) => ({
        ...g,
        options: variants.filter((v) => v.groupId === g.id),
      })),
      related: await related,
      addons: addonLinks.map((row) => row.addon).filter(Boolean),
    };
  }

  async getHomeCatalog() {
    const [categories, services, listings, featuredCoupon] = await Promise.all([
      this.prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          nameAr: true,
          description: true,
          descriptionAr: true,
          icon: true,
          imageUrl: true,
        },
      }),
      this.prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          nameAr: true,
          shortDescription: true,
          imageUrl: true,
          basePrice: true,
          originalPrice: true,
          bookingType: true,
          rating: true,
          reviewCount: true,
          categoryId: true,
        },
      }),
      this.prisma.serviceListing.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { categoryId: true, serviceId: true, sortOrder: true },
      }),
      this.prisma.coupon.findFirst({
        where: { isFeatured: true, isActive: true },
        select: {
          code: true,
          description: true,
          discountType: true,
          discountValue: true,
        },
      }),
    ]);

    return { categories, services, listings, featuredCoupon };
  }

  async searchServices(q: string) {
    const term = q.trim();
    if (term.length < 2) return { services: [], categories: [] };

    const [services, categories] = await Promise.all([
      this.prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { shortDescription: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 12,
        select: {
          id: true,
          slug: true,
          name: true,
          nameAr: true,
          shortDescription: true,
          imageUrl: true,
          basePrice: true,
          originalPrice: true,
          bookingType: true,
          rating: true,
          reviewCount: true,
          categoryId: true,
        },
      }),
      this.prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          nameAr: true,
          description: true,
          icon: true,
          imageUrl: true,
        },
      }),
    ]);

    return { services, categories };
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        nameAr: true,
        description: true,
        descriptionAr: true,
        icon: true,
        imageUrl: true,
        intro: true,
        introAr: true,
        sections: true,
        sectionsAr: true,
        faqs: true,
        faqsAr: true,
        seoTitle: true,
        seoDescription: true,
      },
    });
    if (!category) return null;

    const serviceSelect = {
      id: true,
      slug: true,
      name: true,
      nameAr: true,
      shortDescription: true,
      imageUrl: true,
      basePrice: true,
      originalPrice: true,
      bookingType: true,
      rating: true,
      reviewCount: true,
      categoryId: true,
    } as const;

    const listings = await this.prisma.serviceListing.findMany({
      where: { categoryId: category.id },
      orderBy: { sortOrder: 'asc' },
      select: {
        sortOrder: true,
        service: { select: serviceSelect },
      },
    });

    let services = listings.map((row) => row.service).filter((s: any) => s?.isActive) as any[];
    if (!services.length) {
      services = await this.prisma.service.findMany({
        where: { categoryId: category.id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: serviceSelect,
      });
    }

    return { category, services };
  }

  async getCities() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        surchargePct: true,
        country: {
          select: {
            name: true,
            currencySymbol: true,
            dialCode: true,
          },
        },
      },
    });
  }

  async getBundles() {
    return this.prisma.bundle.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        originalPrice: true,
        purchaseLimit: true,
        items: { select: { label: true, quantity: true } },
      },
    });
  }
}
