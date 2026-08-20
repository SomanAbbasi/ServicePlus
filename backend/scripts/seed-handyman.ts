import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedHandyman() {
  console.log('🔧 Starting Handyman & Maintenance seeding...');

  // 1. Upsert Category "Handyman & Maintenance"
  const categoryData = {
    name: 'Handyman & Maintenance',
    nameAr: 'الصيانة والخدمات المنزلية',
    slug: 'handyman-maintenance',
    icon: 'Wrench',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    description: 'Skilled handymen, electricians, plumbers, home painting & roof waterproofing services at home.',
    descriptionAr: 'حرفيون مهرة، كهربائيون، سباكون، دهان منازل وعزل أسطح معتمد في منزلك.',
    sortOrder: 3,
    isActive: true,
  };

  const category = await prisma.serviceCategory.upsert({
    where: { slug: categoryData.slug },
    update: categoryData,
    create: categoryData,
  });

  console.log(`✅ Category upserted: ${category.name} (${category.id})`);

  // 2. The 3 Services Data
  const servicesData = [
    // 1. Handyman & Maintenance
    {
      name: 'Handyman & Maintenance',
      nameAr: 'خدمات الصيانة والتركيبات',
      slug: 'handyman-services',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
      shortDescription: 'Book skilled handymen, electricians, and plumbers for drilling, mounting, plumbing, electrical & home repairs.',
      shortDescriptionAr: 'فنيون محترفون للتركيبات، الثقب، السباكة، الكهرباء وإصلاح الأجهزة المنزلية.',
      basePrice: 58,
      originalPrice: 70,
      rating: 4.85,
      reviewCount: 153928,
      sortOrder: 1,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Bestsellers',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Hourly Handyman',
              price: 129,
              originalPrice: 169,
              description: 'Book skilled handymen by the hour for drilling, mounting, & general home fixes.',
              imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Hourly Electrician',
              price: 149,
              originalPrice: 169,
              description: 'Book an electrician by the hour for lighting, wiring, sockets & electrical fixes.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Hourly Plumber',
              price: 129,
              originalPrice: 169,
              description: 'Book a plumber by the hour for leaks, fixture repairs, installations & more.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Drilling & Hanging (Up to 15 Holes)',
              price: 119,
              originalPrice: 129,
              description: 'Book expert help for drilling & hanging shelves, frames, curtains & decorative wall items.',
              imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
              sortOrder: 4,
            },
            {
              name: 'Drainage Related Services',
              price: 129,
              originalPrice: 169,
              description: 'Fix common drainage issues like blockages & backups quickly & professionally.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 5,
            },
          ],
        },
        {
          name: 'Handyman Services',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Furniture Installation',
              price: 129,
              originalPrice: 169,
              description: 'Book expert help to assemble or repair your furniture fast, accurate & tool-ready.',
              imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'TV/Entertainment System Installation',
              price: 149,
              originalPrice: 179,
              description: 'Professional TV & speaker system setup with clean mounting, wiring & expert positioning.',
              imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Drilling & Hanging (Up to 15 Holes)',
              price: 119,
              originalPrice: 129,
              description: 'Book expert help for drilling & hanging shelves, frames, curtains & decorative wall items.',
              imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Curtains & Blinds Installation',
              price: 119,
              originalPrice: 129,
              description: 'Expert fitting of curtains & blinds for a clean, polished window finish.',
              imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
              sortOrder: 4,
            },
            {
              name: 'Flyscreen Installation (1 Window)',
              price: 129,
              originalPrice: 169,
              description: 'Keep insects out with expert flyscreen fitting for doors, windows & vents.',
              imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
              sortOrder: 5,
            },
            {
              name: 'Door Lock Install/Repair (1 Lock)',
              price: 129,
              originalPrice: 169,
              description: 'Reliable door lock installation & repair for improved home safety & function.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 6,
            },
          ],
        },
        {
          name: 'Plumbing Services',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Drainage Related Services',
              price: 129,
              originalPrice: 169,
              description: 'Fix common drainage issues like blockages & backups quickly & professionally.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Leakage Repairs',
              price: 129,
              originalPrice: 169,
              description: 'Expert plumbers to locate & repair home leaks.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Bathroom Fixture Install/Repair',
              price: 129,
              originalPrice: 169,
              description: 'Refresh your bathroom with expert fixture repairs & smooth new installations.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Electrical Services',
          imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
          sortOrder: 4,
          variants: [
            {
              name: 'Single Chandelier Installation',
              price: 149,
              originalPrice: 169,
              description: 'Install chandeliers safely with expert care & precise placement.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Switches & Lights Install/Replace',
              price: 129,
              originalPrice: 169,
              description: 'Replace faulty lights or switches with safe, professional hands, fast & hassle-free.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Wiring',
              price: 149,
              originalPrice: 179,
              description: 'Book expert help for safe, reliable socket repairs & wiring fixes in your home.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Appliance Repairs',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
          sortOrder: 5,
          variants: [
            {
              name: 'Dishwasher Repair & Maintenance',
              price: 149,
              originalPrice: 179,
              description: 'Suds up and keep things running smoothly with our dishwasher TLC!',
              imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Washing Machine Repair & Maintenance',
              price: 149,
              originalPrice: 179,
              description: 'Spin into action with our washing machine wizardry!',
              imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Dryer Repair & Maintenance',
              price: 149,
              originalPrice: 179,
              description: 'Keep your laundry routine running with expert dryer repair & professional maintenance.',
              imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Oven Repair & Maintenance',
              price: 149,
              originalPrice: 179,
              description: 'Bake on, worry-free, with our oven TLC!',
              imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
              sortOrder: 4,
            },
            {
              name: 'Refrigerator Repair & Maintenance',
              price: 149,
              originalPrice: 179,
              description: 'Chill out with our fridge fix-ups & maintenance magic!',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 5,
            },
          ],
        },
        {
          name: 'Half Day Callout',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
          sortOrder: 6,
          variants: [
            {
              name: 'Plumber - 4 Hours',
              price: 440,
              originalPrice: 516,
              description: 'Zip through plumbing issues with our 4-hour service.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Electrician - 4 Hours',
              price: 500,
              originalPrice: 596,
              description: 'Spark up your home with our lightning-fast 4-hour electrical service.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Handyman - 4 Hours',
              price: 440,
              originalPrice: 516,
              description: 'Whip your home into shape with our 4-hour handyman service.',
              imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Full Day Callout',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
          sortOrder: 7,
          variants: [
            {
              name: 'Plumber - 8 Hours',
              price: 720,
              originalPrice: 1032,
              description: 'Hire a plumber for 8 hours to complete multiple repairs, installs & upgrades in one go.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Electrician - 8 Hours',
              price: 830,
              originalPrice: 1192,
              description: 'Book an electrician for 8 hours to complete multiple fixes & upgrades in a single visit.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Handyman - 8 Hours',
              price: 720,
              originalPrice: 1032,
              description: 'Fix it, hang it, build it, all in one productive handyman visit.',
              imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: '30 Min Callout',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
          sortOrder: 8,
          variants: [
            {
              name: 'Wallframe Installation (Up to 2)',
              price: 58,
              originalPrice: 70,
              description: 'Mount your wall frame with precision drilling, leveling & expert placement.',
              imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Dining Chairs Assembly – Set of 4',
              price: 65,
              originalPrice: 85,
              description: 'Turn that flat-pack into sit-back with 4 dining chairs assembled hassle-free.',
              imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Single Office/Gaming Chair Assembly',
              price: 65,
              originalPrice: 80,
              description: 'Assemble your office/gaming chair for ultimate comfort with expert setup.',
              imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Shattaf Replacement (Up to 2)',
              price: 58,
              originalPrice: 70,
              description: 'Replace your shattaf & ensure perfect pressure with a quick, leak-free setup.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Home Repairs',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
          sortOrder: 9,
          variants: [
            {
              name: 'Handyman 90-min',
              price: 189,
              originalPrice: 219,
              description: 'Get help with small home repairs & fixes in one 90-min session.',
              imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Handyman 2-hr Session',
              price: 249,
              originalPrice: 289,
              description: 'Tackle multiple home repairs, installations & setup tasks in a 2-hr visit.',
              imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Handyman 3-hr Session',
              price: 349,
              originalPrice: 399,
              description: 'Get larger repairs and multiple installations handled in a 3-hr session.',
              imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Electrician 90-min',
              price: 189,
              originalPrice: 219,
              description: 'Fix common electrical issues, faults, and fittings safely in 90 mins.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 4,
            },
            {
              name: 'Electrician 2-hr Session',
              price: 249,
              originalPrice: 289,
              description: 'Take care of multiple electrical repairs, fittings, and fixes in a 2-hr booking.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 5,
            },
            {
              name: 'Electrician 3-hr Session',
              price: 349,
              originalPrice: 399,
              description: 'Complete larger electrical jobs, installations & repairs in a 3-hr session.',
              imageUrl: 'https://images.unsplash.com/photo-1558882224-dda166733046?w=400&q=80',
              sortOrder: 6,
            },
            {
              name: 'Plumber 90-min',
              price: 189,
              originalPrice: 219,
              description: 'Fix leaks, taps, fittings, and minor plumbing issues in a 90-min visit.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 7,
            },
            {
              name: 'Plumber 2-hr Session',
              price: 249,
              originalPrice: 289,
              description: 'Take care of multiple plumbing repairs, leaks, and fittings in a 2-hr visit.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 8,
            },
            {
              name: 'Plumber 3-hr Session',
              price: 349,
              originalPrice: 399,
              description: 'Handle larger plumbing jobs, repairs, and installations in a 3-hr booking.',
              imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
              sortOrder: 9,
            },
          ],
        },
      ],
    },

    // 2. Home Painting
    {
      name: 'Home Painting',
      nameAr: 'دهان المنازل والديكور',
      slug: 'home-painting',
      imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80',
      shortDescription: 'Professional interior & exterior painting, accent walls, move-in/out repainting with premium Jotun paints.',
      shortDescriptionAr: 'دهان احترافي للجدران والأسقف للشقق والفلل مع حماية الأثاث ودهانات جوتن الأصلية.',
      basePrice: 199,
      originalPrice: 260,
      rating: 4.92,
      reviewCount: 28410,
      sortOrder: 2,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Painting Packages',
          imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Studio Apartment Painting',
              price: 499,
              originalPrice: 650,
              description: 'Full walls & ceiling painting with surface preparation and premium paint.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: '1 Bedroom Apartment Painting',
              price: 799,
              originalPrice: 999,
              description: 'Complete 1-bedroom apartment painting including living room and hallway.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: '2 Bedroom Apartment Painting',
              price: 1199,
              originalPrice: 1499,
              description: 'Thorough repainting for 2-bedroom apartments with high coverage.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: '3 Bedroom Apartment / Villa Painting',
              price: 1699,
              originalPrice: 2100,
              description: 'Comprehensive painting for spacious 3-bedroom residences.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Rooms & Walls',
          imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Single Room Painting',
              price: 299,
              originalPrice: 399,
              description: 'Freshen up any single bedroom or study with clean edges and zero mess.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Single Feature / Accent Wall',
              price: 199,
              originalPrice: 260,
              description: 'Bold accent wall styling with premium designer finish.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Ceiling Painting Only',
              price: 249,
              originalPrice: 320,
              description: 'Brighten discolored or water-stained ceilings.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Touch-ups & Fixes',
          imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Wall Crack & Hole Patching + Paint Touch-up',
              price: 149,
              originalPrice: 199,
              description: 'Filler patch repair and color-matched touch-up.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Door & Frame Repainting (Per Door)',
              price: 99,
              originalPrice: 130,
              description: 'Wood sanding, primer and smooth enamel paint.',
              imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
              sortOrder: 2,
            },
          ],
        },
      ],
    },

    // 3. Roof Waterproofing Services
    {
      name: 'Roof Waterproofing Services',
      nameAr: 'عزل الأسطح ومكافحة التسربات',
      slug: 'roof-waterproofing-services',
      imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
      shortDescription: 'Professional roof leak inspection, membrane waterproofing & warranty-backed seal solutions.',
      shortDescriptionAr: 'فحص تسربات الأسطح، العزل المائي الحراري وضمان معتمد ضد التسرب.',
      basePrice: 99,
      originalPrice: 199,
      rating: 4.88,
      reviewCount: 14290,
      sortOrder: 3,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Waterproofing Services',
          imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Roof Waterproofing Inspection',
              price: 99,
              originalPrice: 199,
              description: 'Professional roof inspection with quotation & warranty-backed solution.',
              imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Liquid Membrane Waterproofing (Per Sqm)',
              price: 35,
              originalPrice: 50,
              description: 'High-durability polyurethane coating resistant to UV and pooling water.',
              imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Bituminous Torch-on Membrane System (Per Sqm)',
              price: 45,
              originalPrice: 60,
              description: 'Heavy-duty 4mm reinforced membrane for long-lasting leak protection.',
              imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Balcony & Terrace Waterproofing (Per Area)',
              price: 399,
              originalPrice: 550,
              description: 'Grout sealing, base waterproofing and tile protection.',
              imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=80',
              sortOrder: 4,
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
      console.log(`  🔸 Option Group seeded: "${gData.name}" with ${gData.variants.length} items`);
    }
  }

  console.log('\n🎉 Successfully seeded "Handyman & Maintenance" with all 3 services and options!');
}

seedHandyman()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
