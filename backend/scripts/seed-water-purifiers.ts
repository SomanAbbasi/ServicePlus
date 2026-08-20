import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWaterPurifiers() {
  console.log('💧 Starting Water Purifiers seeding...');

  // 1. Upsert Category "Water Purifiers"
  const categoryData = {
    name: 'Water Purifiers',
    nameAr: 'أجهزة تنقية المياه',
    slug: 'water-purifiers',
    icon: 'Droplet',
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&q=80',
    description: 'Premium countertop & floor-standing UV & RO water purification systems and hassle-free subscriptions.',
    descriptionAr: 'أنظمة تنقية المياه المنزلية المتطورة بالفلترة النانوية والأشعة فوق البنفسجية واشتراكات ميسرة.',
    sortOrder: 5,
    isActive: true,
  };

  const category = await prisma.serviceCategory.upsert({
    where: { slug: categoryData.slug },
    update: categoryData,
    create: categoryData,
  });

  console.log(`✅ Category upserted: ${category.name} (${category.id})`);

  // 2. Service "Wisewell Water Purifiers"
  const serviceData = {
    name: 'Wisewell Water Purifiers',
    nameAr: 'أجهزة وايزويل لتنقية المياه',
    slug: 'wisewell-water-purifiers',
    imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=800&q=80',
    shortDescription: 'Nano-filtered, mineralized & UV drinking water purification systems with full maintenance included.',
    shortDescriptionAr: 'مياه شرب نقية ومعدنية بفلترة نانوية وتقنية UV مع صيانة دورية شاملة.',
    basePrice: 99,
    originalPrice: 150,
    rating: 4.9,
    reviewCount: 3240,
    sortOrder: 1,
    isFeatured: true,
    bookingType: 'options',
    optionGroups: [
      {
        name: 'Wisewell Subscription',
        imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&q=80',
        sortOrder: 1,
        variants: [
          {
            name: 'Wisewell Nano+',
            price: 99,
            originalPrice: 149,
            description: 'Nano-filtered, ultra-pure water on demand in a sleek countertop design.',
            imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&q=80',
            sortOrder: 1,
          },
          {
            name: 'Wisewell Model 1',
            price: 150,
            originalPrice: 199,
            description: 'Great-tasting purified water in a higher capacity, floor-standing system.',
            imageUrl: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?w=400&q=80',
            sortOrder: 2,
          },
        ],
      },
      {
        name: 'Consultation',
        imageUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=400&q=80',
        sortOrder: 2,
        variants: [
          {
            name: 'Free Consultation',
            price: 0,
            originalPrice: 99,
            description: 'Not sure which Wisewell to pick? Book a free expert consultation.',
            imageUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=400&q=80',
            sortOrder: 1,
          },
        ],
      },
    ],
  };

  const service = await prisma.service.upsert({
    where: { slug: serviceData.slug },
    update: {
      name: serviceData.name,
      nameAr: serviceData.nameAr,
      categoryId: category.id,
      imageUrl: serviceData.imageUrl,
      shortDescription: serviceData.shortDescription,
      shortDescriptionAr: serviceData.shortDescriptionAr,
      basePrice: serviceData.basePrice,
      originalPrice: serviceData.originalPrice,
      rating: serviceData.rating,
      reviewCount: serviceData.reviewCount,
      sortOrder: serviceData.sortOrder,
      isFeatured: serviceData.isFeatured,
      bookingType: serviceData.bookingType,
      isActive: true,
    },
    create: {
      name: serviceData.name,
      nameAr: serviceData.nameAr,
      slug: serviceData.slug,
      categoryId: category.id,
      imageUrl: serviceData.imageUrl,
      shortDescription: serviceData.shortDescription,
      shortDescriptionAr: serviceData.shortDescriptionAr,
      basePrice: serviceData.basePrice,
      originalPrice: serviceData.originalPrice,
      rating: serviceData.rating,
      reviewCount: serviceData.reviewCount,
      sortOrder: serviceData.sortOrder,
      isFeatured: serviceData.isFeatured,
      bookingType: serviceData.bookingType,
      isActive: true,
    },
  });

  console.log(`\n🔹 Service upserted: ${service.name} (${service.id})`);

  // Upsert Category Listing
  await prisma.serviceListing.upsert({
    where: {
      categoryId_serviceId: {
        categoryId: category.id,
        serviceId: service.id,
      },
    },
    update: { sortOrder: serviceData.sortOrder },
    create: {
      categoryId: category.id,
      serviceId: service.id,
      sortOrder: serviceData.sortOrder,
    },
  });

  // Upsert Option Groups and Variants
  for (const gData of serviceData.optionGroups) {
    let group = await prisma.serviceOptionGroup.findFirst({
      where: { serviceId: service.id, name: gData.name },
    });

    if (!group) {
      group = await prisma.serviceOptionGroup.create({
        data: {
          serviceId: service.id,
          name: gData.name,
          imageUrl: gData.imageUrl,
          sortOrder: gData.sortOrder,
          isActive: true,
        },
      });
    } else {
      group = await prisma.serviceOptionGroup.update({
        where: { id: group.id },
        data: {
          imageUrl: gData.imageUrl,
          sortOrder: gData.sortOrder,
          isActive: true,
        },
      });
    }

    for (const vData of gData.variants) {
      const existingVariant = await prisma.serviceVariant.findFirst({
        where: { serviceId: service.id, groupId: group.id, name: vData.name },
      });

      if (!existingVariant) {
        await prisma.serviceVariant.create({
          data: {
            serviceId: service.id,
            groupId: group.id,
            name: vData.name,
            price: vData.price,
            originalPrice: vData.originalPrice,
            description: vData.description,
            imageUrl: vData.imageUrl,
            sortOrder: vData.sortOrder,
            isActive: true,
          },
        });
      } else {
        await prisma.serviceVariant.update({
          where: { id: existingVariant.id },
          data: {
            price: vData.price,
            originalPrice: vData.originalPrice,
            description: vData.description,
            imageUrl: vData.imageUrl,
            sortOrder: vData.sortOrder,
            isActive: true,
          },
        });
      }
    }
    console.log(`  🔸 Option Group seeded: "${gData.name}" with ${gData.variants.length} items`);
  }

  // 3. Upsert Coupon 200PURE
  const coupon = await prisma.coupon.upsert({
    where: { code: '200PURE' },
    update: {
      discountType: 'fixed',
      discountValue: 200,
      minAmount: 200,
      isActive: true,
    },
    create: {
      code: '200PURE',
      description: 'AED 200 OFF on Wisewell Water Purifier subscriptions',
      discountType: 'fixed',
      discountValue: 200,
      minAmount: 200,
      maxDiscount: 200,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxRedemptions: 10000,
      redemptionCount: 0,
      isActive: true,
    },
  });

  console.log(`🎟️ Coupon upserted: ${coupon.code} (AED 200 OFF)`);

  console.log('\n🎉 Successfully seeded "Water Purifiers" category and Wisewell Purifiers service!');
}

seedWaterPurifiers()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
