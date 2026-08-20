import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCarServices() {
  console.log('🚗 Starting Car Services image fix & seeding...');

  // 1. Upsert Category "Car Services"
  const categoryData = {
    name: 'Car Services',
    nameAr: 'خدمات السيارات',
    slug: 'car-services',
    icon: 'Car',
    imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80',
    description: 'Doorstep car service, periodic 10K maintenance, oil changes, detailing & eco-friendly car wash at home.',
    descriptionAr: 'خدمات صيانة وتغيير زيت السيارات عند البيت، غسيل وتلميع متنقل وتنظيف عميق.',
    sortOrder: 4,
    isActive: true,
  };

  const category = await prisma.serviceCategory.upsert({
    where: { slug: categoryData.slug },
    update: categoryData,
    create: categoryData,
  });

  console.log(`✅ Category upserted: ${category.name} (${category.id})`);

  // 2. The 2 Services Data with verified 200 OK Unsplash images
  const servicesData = [
    // 1. Car Service at Home
    {
      name: 'Car Service at Home',
      nameAr: 'صيانة السيارات في المنزل',
      slug: 'car-service-at-home',
      imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80',
      shortDescription: 'Quick doorstep oil changes, 10,000 km periodic maintenance & full workshop pickup & drop.',
      shortDescriptionAr: 'تغيير زيت وفلتر عند باب بيتك، صيانة 10,000 كم واستلام وتوصيل للورشة.',
      basePrice: 229,
      originalPrice: 299,
      rating: 4.8,
      reviewCount: 5420,
      sortOrder: 1,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Quick Oil Change',
          imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Quick Oil Change at Home (Synthetic)',
              price: 229,
              originalPrice: 299,
              description: 'Quick oil change at your doorstep for fast, hassle-free maintenance with synthetic oil & new filter.',
              imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Quick Oil Change at Home (Full Synthetic Premium)',
              price: 289,
              originalPrice: 359,
              description: 'High-grade full synthetic motor oil & OEM oil filter replacement at your doorstep.',
              imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Oil & Filter Change + 20-Point Inspection',
              price: 319,
              originalPrice: 399,
              description: 'Comprehensive engine oil change, filter swap, plus 20-point mechanical & fluid inspection.',
              imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: '10K Service at Home',
          imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: '10K Service at Home (Sedan)',
              price: 359,
              originalPrice: 449,
              description: 'Routine 10,000 km service at home with essential checks, oil change, filter, battery & brake inspection.',
              imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: '10K Service at Home (SUV / 4x4)',
              price: 429,
              originalPrice: 529,
              description: 'Complete 10,000 km routine maintenance package for SUVs at your doorstep.',
              imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: '10K Service at Home (Luxury / German)',
              price: 499,
              originalPrice: 620,
              description: 'Specialized 10,000 km service for high-performance & European vehicles at home.',
              imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: '10K Pick Up & Drop Off',
          imageUrl: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: '10K Pick Up & Drop Off (Sedan)',
              price: 539,
              originalPrice: 699,
              description: 'Detailed 10K service with certified workshop diagnostic inspection and doorstep pickup & drop.',
              imageUrl: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: '10K Pick Up & Drop Off (SUV)',
              price: 629,
              originalPrice: 799,
              description: 'Full workshop 10,000 km service including mechanical diagnostics, wheel alignment check & pickup.',
              imageUrl: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: '10K Pick Up & Drop Off (Luxury / German)',
              price: 749,
              originalPrice: 950,
              description: 'Comprehensive workshop service with full diagnostic report, genuine parts & pickup & delivery.',
              imageUrl: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
      ],
    },

    // 2. Car Wash
    {
      name: 'Car Wash',
      nameAr: 'غسيل وتلميع السيارات',
      slug: 'car-wash-at-home',
      imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80',
      shortDescription: 'Doorstep steam wash, interior deep shampooing, waterless exterior polish & adventure ride detailing.',
      shortDescriptionAr: 'غسيل سيارات متنقل عند المنزل، تلميع خارجي وتنظيف وتطهير داخلي عميق.',
      basePrice: 40,
      originalPrice: 60,
      rating: 4.8,
      reviewCount: 8284,
      sortOrder: 2,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Exclusive Offer',
          imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Sedan Detailing Offer',
              price: 79,
              originalPrice: 99,
              description: 'Give your car a spotless interior and exterior with expert care.',
              imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'SUV Detailing Offer',
              price: 109,
              originalPrice: 129,
              description: 'Transform your ride with a premium clean that leaves it shining inside and out!',
              imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Sedan',
          imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Exterior Cleaning',
              price: 45,
              originalPrice: 55,
              description: 'Give your sedan a sleek, polished finish with a professional exterior cleaning!',
              imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Interior Deep Cleaning',
              price: 240,
              originalPrice: 310,
              description: 'Revive your sedan with a thorough interior deep clean, leaving every detail spotless!',
              imageUrl: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Exterior + Interior Cleaning',
              price: 269,
              originalPrice: 299,
              description: 'Complete sedan detailing for a spotless exterior, & polished interior.',
              imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'SUV',
          imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Exterior Cleaning',
              price: 55,
              originalPrice: 65,
              description: 'Unleash your SUV’s shine with a premium exterior clean that turns heads!',
              imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Interior Deep Cleaning',
              price: 350,
              originalPrice: 400,
              description: 'Give your SUV’s interior a fresh start with a deep clean that’s as bold as your ride!',
              imageUrl: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Exterior + Interior Cleaning',
              price: 399,
              originalPrice: 450,
              description: 'Give your SUV an interior + exterior detailing that’s as bold as your ride!',
              imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Motorbike',
          imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&q=80',
          sortOrder: 4,
          variants: [
            {
              name: 'Full Wash',
              price: 40,
              originalPrice: 60,
              description: 'Revitalize your motorbike with a full wash that brings back its shine and power!',
              imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&q=80',
              sortOrder: 1,
            },
          ],
        },
        {
          name: 'Adventure Rides',
          imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&q=80',
          sortOrder: 5,
          variants: [
            {
              name: 'Quad Bike Wash',
              price: 60,
              originalPrice: 80,
              description: 'Get your quad bike trail-ready with a wash that’s as tough as your ride!',
              imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Quad Bike Wash (Large)',
              price: 109,
              originalPrice: 140,
              description: 'Power up your ride with a full wash that leaves it clean and ready for adventure!',
              imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Jet Ski Wash (12 ft)',
              price: 60,
              originalPrice: 80,
              description: 'Get your Jet Ski sparkling clean and ready to ride with a refreshing wash!',
              imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Jet Ski Wash (15-24 ft)',
              price: 109,
              originalPrice: 140,
              description: 'Ride the waves in style with a sparkling clean that makes your Jet Ski shine like new!',
              imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
              sortOrder: 4,
            },
            {
              name: 'Buggy Wash',
              price: 209,
              originalPrice: 260,
              description: 'Transform your buggy with a wash that brings out its best, ready for any terrain!',
              imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&q=80',
              sortOrder: 5,
            },
          ],
        },
      ],
    },
  ];

  for (const sData of servicesData) {
    const service = await prisma.service.upsert({
      where: { slug: sData.slug },
      update: {
        name: sData.name,
        nameAr: sData.nameAr,
        categoryId: category.id,
        imageUrl: sData.imageUrl,
        shortDescription: sData.shortDescription,
        shortDescriptionAr: sData.shortDescriptionAr,
        basePrice: sData.basePrice,
        originalPrice: sData.originalPrice,
        rating: sData.rating,
        reviewCount: sData.reviewCount,
        sortOrder: sData.sortOrder,
        isFeatured: sData.isFeatured,
        bookingType: sData.bookingType,
        isActive: true,
      },
      create: {
        name: sData.name,
        nameAr: sData.nameAr,
        slug: sData.slug,
        categoryId: category.id,
        imageUrl: sData.imageUrl,
        shortDescription: sData.shortDescription,
        shortDescriptionAr: sData.shortDescriptionAr,
        basePrice: sData.basePrice,
        originalPrice: sData.originalPrice,
        rating: sData.rating,
        reviewCount: sData.reviewCount,
        sortOrder: sData.sortOrder,
        isFeatured: sData.isFeatured,
        bookingType: sData.bookingType,
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
      update: { sortOrder: sData.sortOrder },
      create: {
        categoryId: category.id,
        serviceId: service.id,
        sortOrder: sData.sortOrder,
      },
    });

    // Upsert Option Groups and Variants
    for (const gData of sData.optionGroups) {
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
      console.log(`  🔸 Option Group updated: "${gData.name}" with verified images`);
    }
  }

  console.log('\n🎉 Successfully refreshed all images for "Car Services"!');
}

seedCarServices()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
