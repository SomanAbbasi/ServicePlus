import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedJustlifeCatalog() {
  console.log('🌱 Starting Justlife-inspired catalog seed...');

  // 1. Categories
  const categoriesData = [
    {
      name: 'General Cleaning',
      slug: 'general-cleaning',
      icon: 'Sparkles',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
      description: 'Home cleaning, maid service, sofa, carpet & upholstery',
      sortOrder: 1,
    },
    {
      name: 'Home Deep Cleaning',
      slug: 'home-deep-cleaning',
      icon: 'Home',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
      description: 'Intensive deep cleaning for kitchen, furnished & unfurnished apartments',
      sortOrder: 2,
    },
    {
      name: "Men's Spa & Salon",
      slug: 'mens-spa',
      icon: 'UserCheck',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
      description: 'Haircut, shave, massage and grooming at home',
      sortOrder: 3,
    },
    {
      name: "Women's Salon & Spa",
      slug: 'beauty-salon',
      icon: 'Heart',
      imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80',
      description: 'Pedicure, manicure, hair styling, facial & waxing',
      sortOrder: 4,
    },
    {
      name: 'Handyman & Maintenance',
      slug: 'handyman-maintenance',
      icon: 'Wrench',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
      description: 'Electrical, plumbing, AC maintenance & painting',
      sortOrder: 5,
    },
    {
      name: 'Car Wash & Care',
      slug: 'car-wash',
      icon: 'Car',
      imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
      description: 'Doorstep mobile car wash & interior detailing',
      sortOrder: 6,
    },
    {
      name: 'Pest Control & Disinfection',
      slug: 'pest-control',
      icon: 'Shield',
      imageUrl: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=600&q=80',
      description: 'Cockroach, bed bug, pest management & sanitization',
      sortOrder: 7,
    },
    {
      name: 'Laundry & Dry Cleaning',
      slug: 'laundry-dry-cleaning',
      icon: 'Shirt',
      imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=600&q=80',
      description: 'Wash & fold, ironing, suit & dress dry cleaning',
      sortOrder: 8,
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (const catData of categoriesData) {
    const cat = await prisma.serviceCategory.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        icon: catData.icon,
        imageUrl: catData.imageUrl,
        description: catData.description,
        sortOrder: catData.sortOrder,
        isActive: true,
      },
      create: {
        name: catData.name,
        slug: catData.slug,
        icon: catData.icon,
        imageUrl: catData.imageUrl,
        description: catData.description,
        sortOrder: catData.sortOrder,
        isActive: true,
      },
    });
    categoryMap[catData.slug] = cat.id;
    console.log(`✅ Category upserted: ${cat.name} (${cat.id})`);
  }

  // 2. Services
  const servicesData = [
    {
      slug: 'home-cleaning',
      name: 'Home Cleaning',
      categorySlug: 'general-cleaning',
      basePrice: 39,
      originalPrice: 50,
      hourlyRate: 35,
      materialsPrice: 20,
      shortDescription: 'Professional home cleaning by trained, background-checked cleaners.',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
      rating: 4.85,
      reviewCount: 18450,
      isFeatured: true,
      minHours: 2,
      maxHours: 8,
      maxProfessionals: 4,
    },
    {
      slug: 'sofa-upholstery-cleaning',
      name: 'Sofa & Upholstery Cleaning',
      categorySlug: 'general-cleaning',
      basePrice: 129,
      originalPrice: 160,
      shortDescription: 'Deep steam cleaning and stain extraction for all sofa fabrics.',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
      rating: 4.9,
      reviewCount: 6200,
      isFeatured: false,
    },
    {
      slug: 'mattress-cleaning',
      name: 'Mattress Cleaning',
      categorySlug: 'general-cleaning',
      basePrice: 99,
      originalPrice: 130,
      shortDescription: 'UV sanitizing and dust-mite extraction for fresh sleep.',
      imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
      rating: 4.8,
      reviewCount: 3100,
      isFeatured: false,
    },
    {
      slug: 'carpet-cleaning',
      name: 'Carpet & Rug Cleaning',
      categorySlug: 'general-cleaning',
      basePrice: 89,
      originalPrice: 120,
      shortDescription: 'Deep shampooing and vacuum extraction for residential carpets.',
      imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80',
      rating: 4.75,
      reviewCount: 2400,
      isFeatured: false,
    },
    {
      slug: 'home-deep-cleaning',
      name: 'Home Deep Cleaning',
      categorySlug: 'home-deep-cleaning',
      basePrice: 299,
      originalPrice: 350,
      shortDescription: 'Heavy duty deep cleaning using industrial grade equipment and degreasers.',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
      rating: 4.85,
      reviewCount: 28557,
      isFeatured: true,
      minHours: 3,
      maxHours: 10,
      maxProfessionals: 6,
    },
    {
      slug: 'salon-at-home',
      name: 'Salon at Home',
      categorySlug: 'beauty-salon',
      basePrice: 99,
      originalPrice: 140,
      shortDescription: 'Manicure, pedicure, hair blow dry and waxing in comfort of your home.',
      imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80',
      rating: 4.9,
      reviewCount: 9400,
      isFeatured: true,
    },
    {
      slug: 'mens-haircut-massage',
      name: "Men's Haircut & Massage",
      categorySlug: 'mens-spa',
      basePrice: 79,
      originalPrice: 100,
      shortDescription: 'Precision haircut, beard styling and relaxing head/shoulder massage.',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
      rating: 4.8,
      reviewCount: 4200,
      isFeatured: true,
    },
    {
      slug: 'ac-cleaning-maintenance',
      name: 'AC Cleaning & Duct Repair',
      categorySlug: 'handyman-maintenance',
      basePrice: 149,
      originalPrice: 199,
      shortDescription: 'Pressure washing coils, filter cleaning and gas pressure check.',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
      rating: 4.9,
      reviewCount: 11200,
      isFeatured: true,
    },
    {
      slug: 'car-wash-full',
      name: 'Mobile Car Wash & Detailing',
      categorySlug: 'car-wash',
      basePrice: 59,
      originalPrice: 80,
      shortDescription: 'Waterless eco exterior wash, interior vacuuming and tire shine at your parking.',
      imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
      rating: 4.75,
      reviewCount: 5100,
      isFeatured: true,
    },
    {
      slug: 'pest-control-home',
      name: 'Full Home Pest Control',
      categorySlug: 'pest-control',
      basePrice: 149,
      originalPrice: 200,
      shortDescription: 'Eco-friendly spray treatment for cockroaches, ants and general pests.',
      imageUrl: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=600&q=80',
      rating: 4.85,
      reviewCount: 7800,
      isFeatured: false,
    },
    {
      slug: 'laundry-wash-fold',
      name: 'Wash, Iron & Fold Bag',
      categorySlug: 'laundry-dry-cleaning',
      basePrice: 49,
      originalPrice: 65,
      shortDescription: 'Doorstep laundry collection, wash, press and neat bag delivery.',
      imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=600&q=80',
      rating: 4.8,
      reviewCount: 8900,
      isFeatured: false,
    },
  ];

  const serviceMap: Record<string, string> = {};

  for (const sData of servicesData) {
    const categoryId = categoryMap[sData.categorySlug];
    if (!categoryId) continue;

    const s = await prisma.service.upsert({
      where: { slug: sData.slug },
      update: {
        name: sData.name,
        categoryId,
        basePrice: sData.basePrice,
        originalPrice: sData.originalPrice,
        hourlyRate: sData.hourlyRate || null,
        materialsPrice: sData.materialsPrice || 0,
        shortDescription: sData.shortDescription,
        imageUrl: sData.imageUrl,
        rating: sData.rating,
        reviewCount: sData.reviewCount,
        isFeatured: sData.isFeatured,
        minHours: sData.minHours || 1,
        maxHours: sData.maxHours || 8,
        maxProfessionals: sData.maxProfessionals || 4,
        isActive: true,
      },
      create: {
        name: sData.name,
        slug: sData.slug,
        categoryId,
        basePrice: sData.basePrice,
        originalPrice: sData.originalPrice,
        hourlyRate: sData.hourlyRate || null,
        materialsPrice: sData.materialsPrice || 0,
        shortDescription: sData.shortDescription,
        imageUrl: sData.imageUrl,
        rating: sData.rating,
        reviewCount: sData.reviewCount,
        isFeatured: sData.isFeatured,
        minHours: sData.minHours || 1,
        maxHours: sData.maxHours || 8,
        maxProfessionals: sData.maxProfessionals || 4,
        isActive: true,
      },
    });

    serviceMap[sData.slug] = s.id;
    console.log(`✅ Service upserted: ${s.name} (${s.id})`);
  }

  // 3. Option Groups & Variants for Home Deep Cleaning (matching Image 5!)
  const deepCleaningId = serviceMap['home-deep-cleaning'];
  if (deepCleaningId) {
    const optionGroupsData = [
      {
        name: 'Kitchen Cleaning',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
        sortOrder: 1,
        variants: [
          {
            name: 'Without Appliance Cleaning',
            price: 299,
            originalPrice: 350,
            description: 'Deep kitchen clean to remove oil, dirt & buildup from hard-to-reach spots.',
            imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
            sortOrder: 1,
          },
          {
            name: 'With Appliance Cleaning',
            price: 349,
            originalPrice: 420,
            description: 'Deep kitchen clean including internal oven, fridge & stove hood degreasing.',
            imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',
            sortOrder: 2,
          },
        ],
      },
      {
        name: 'Furnished Apartment',
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
        sortOrder: 2,
        variants: [
          {
            name: 'Studio / 1 BR Deep Clean',
            price: 499,
            originalPrice: 600,
            description: 'Complete deep cleaning of studio or 1 bedroom furnished unit.',
            imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
            sortOrder: 1,
          },
          {
            name: '2 BR Deep Clean',
            price: 699,
            originalPrice: 850,
            description: 'Complete deep cleaning of 2 bedroom furnished unit.',
            imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
            sortOrder: 2,
          },
        ],
      },
      {
        name: 'Unfurnished Apartment',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
        sortOrder: 3,
        variants: [
          {
            name: '1 BR Move-in Clean',
            price: 449,
            originalPrice: 550,
            description: 'Move-in / Move-out deep cleaning for 1 BR unfurnished apartment.',
            imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
            sortOrder: 1,
          },
          {
            name: '2 BR Move-in Clean',
            price: 649,
            originalPrice: 780,
            description: 'Move-in / Move-out deep cleaning for 2 BR unfurnished apartment.',
            imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80',
            sortOrder: 2,
          },
        ],
      },
      {
        name: 'Balcony & Terrace',
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
        sortOrder: 4,
        variants: [
          {
            name: 'Balcony Pressure Wash',
            price: 149,
            originalPrice: 199,
            description: 'High pressure floor jet washing and railing sanitization.',
            imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
            sortOrder: 1,
          },
        ],
      },
      {
        name: 'Bathroom Cleaning',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',
        sortOrder: 5,
        variants: [
          {
            name: 'Bathroom Deep Clean & Grout Scrubber',
            price: 129,
            originalPrice: 179,
            description: 'Tile grout scrubbing, lime scale removal & glass polishing.',
            imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',
            sortOrder: 1,
          },
        ],
      },
    ];

    for (const groupData of optionGroupsData) {
      let og = await prisma.serviceOptionGroup.findFirst({
        where: { serviceId: deepCleaningId, name: groupData.name },
      });

      if (!og) {
        og = await prisma.serviceOptionGroup.create({
          data: {
            serviceId: deepCleaningId,
            name: groupData.name,
            imageUrl: groupData.imageUrl,
            sortOrder: groupData.sortOrder,
            isActive: true,
          },
        });
      } else {
        await prisma.serviceOptionGroup.update({
          where: { id: og.id },
          data: {
            imageUrl: groupData.imageUrl,
            sortOrder: groupData.sortOrder,
          },
        });
      }

      for (const varData of groupData.variants) {
        let v = await prisma.serviceVariant.findFirst({
          where: { serviceId: deepCleaningId, groupId: og.id, name: varData.name },
        });

        if (!v) {
          await prisma.serviceVariant.create({
            data: {
              serviceId: deepCleaningId,
              groupId: og.id,
              name: varData.name,
              price: varData.price,
              originalPrice: varData.originalPrice,
              description: varData.description,
              imageUrl: varData.imageUrl,
              sortOrder: varData.sortOrder,
              isActive: true,
            },
          });
        } else {
          await prisma.serviceVariant.update({
            where: { id: v.id },
            data: {
              price: varData.price,
              originalPrice: varData.originalPrice,
              description: varData.description,
              imageUrl: varData.imageUrl,
              sortOrder: varData.sortOrder,
            },
          });
        }
      }
      console.log(`✅ Option Group upserted for Deep Cleaning: ${groupData.name}`);
    }
  }

  // 4. Add-ons (matching Image 4!)
  const addonsData = [
    {
      name: 'Balcony Cleaning',
      slug: 'balcony-cleaning',
      price: 19,
      originalPrice: 25,
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
      description: 'Thorough washing and sweeping of balcony space.',
      sortOrder: 1,
    },
    {
      name: 'Ironing and Folding',
      slug: 'ironing-folding',
      price: 25,
      originalPrice: 30,
      imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=600&q=80',
      description: 'Ironing up to 10 garments and neat folding.',
      sortOrder: 2,
    },
    {
      name: 'Fridge Cleaning',
      slug: 'fridge-cleaning',
      price: 19,
      originalPrice: 25,
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',
      description: 'Interior defrost, shelf wipe and sanitization.',
      sortOrder: 3,
    },
    {
      name: 'Wardrobe Cleaning',
      slug: 'wardrobe-cleaning',
      price: 29,
      originalPrice: 39,
      imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80',
      description: 'Re-organizing and dusting inside wardrobes.',
      sortOrder: 4,
    },
    {
      name: 'Cupboard Cleaning',
      slug: 'cupboard-cleaning',
      price: 25,
      originalPrice: 35,
      imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
      description: 'Internal cabinet wiping and sorting.',
      sortOrder: 5,
    },
    {
      name: 'Party Cleaning',
      slug: 'party-cleaning',
      price: 49,
      originalPrice: 65,
      imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
      description: 'Post party cleanup, dish washing & trash removal.',
      sortOrder: 6,
    },
  ];

  const addonMap: Record<string, string> = {};

  for (const aData of addonsData) {
    const addon = await prisma.addon.upsert({
      where: { slug: aData.slug },
      update: {
        name: aData.name,
        price: aData.price,
        originalPrice: aData.originalPrice,
        imageUrl: aData.imageUrl,
        description: aData.description,
        sortOrder: aData.sortOrder,
        isActive: true,
      },
      create: {
        name: aData.name,
        slug: aData.slug,
        price: aData.price,
        originalPrice: aData.originalPrice,
        imageUrl: aData.imageUrl,
        description: aData.description,
        sortOrder: aData.sortOrder,
        isActive: true,
      },
    });

    addonMap[aData.slug] = addon.id;
    console.log(`✅ Addon upserted: ${addon.name} (${addon.id})`);
  }

  // 5. Link Add-ons to Services
  const targetServices = [serviceMap['home-cleaning'], serviceMap['home-deep-cleaning']].filter(Boolean);

  for (const addonId of Object.values(addonMap)) {
    for (const serviceId of targetServices) {
      await prisma.addonService.upsert({
        where: { addonId_serviceId: { addonId, serviceId: serviceId! } },
        update: {},
        create: { addonId, serviceId: serviceId! },
      });
    }
  }

  console.log('🎉 Justlife-inspired catalog seed completed successfully!');
}

seedJustlifeCatalog()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
