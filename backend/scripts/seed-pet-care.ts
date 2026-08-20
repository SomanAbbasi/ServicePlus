import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPetCare() {
  console.log('🐾 Starting Pet Care at Home seeding...');

  // 1. Upsert Category "Pet Care at Home"
  const categoryData = {
    name: 'Pet Care at Home',
    nameAr: 'العناية بالحيوانات الأليفة في المنزل',
    slug: 'pet-care-at-home',
    icon: 'PawPrint',
    imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&q=80',
    description: 'Doorstep mobile pet grooming vans, home bathing, VIP pet spa, MOCCAE-certified vet visits, vaccines & walking.',
    descriptionAr: 'سيارات متنقلة لقص وتزيين الحيوانات الأليفة، سبا منزلي، وفحوصات بيطرية وتطعيمات معتمدة.',
    sortOrder: 6,
    isActive: true,
  };

  const category = await prisma.serviceCategory.upsert({
    where: { slug: categoryData.slug },
    update: categoryData,
    create: categoryData,
  });

  console.log(`✅ Category upserted: ${category.name} (${category.id})`);

  // 2. The 2 Services Data
  const servicesData = [
    // 1. Pet Grooming
    {
      name: 'Pet Grooming',
      nameAr: 'تزيين وقص شعر الحيوانات الأليفة',
      slug: 'pet-grooming',
      imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80',
      shortDescription: 'Professional mobile grooming van or in-home baths, hair cuts, nail trims, VIP pet spa & walking.',
      shortDescriptionAr: 'خدمات قص وتزيين الكلاب والقطط في سيارات مجهزة بالكامل أو داخل منزلك.',
      basePrice: 105,
      originalPrice: 139,
      rating: 4.9,
      reviewCount: 10568,
      sortOrder: 1,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Basic Van Grooming',
          imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Small Dog < 9kg',
              price: 219,
              originalPrice: 250,
              description: 'Scrub, fluff & primp your small pup, all inside our grooming van.',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Medium Dog 10-19kg',
              price: 249,
              originalPrice: 310,
              description: 'Send your dog in scruffy, get them back squeaky clean in our van.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Large Dog > 20kg',
              price: 279,
              originalPrice: 350,
              description: 'Big dog, full groom. Washing, drying, nails & more, right outside your home.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Basic Grooming - Cats',
              price: 219,
              originalPrice: 320,
              description: 'Treat your cat to a spa day, right outside your front door.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Full Van Grooming',
          imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Small Dog < 9kg',
              price: 279,
              originalPrice: 320,
              description: 'Style, scrub & pamper your small pup from nose to tail in our van.',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Medium Dog 10-19kg',
              price: 329,
              originalPrice: 450,
              description: 'Expert grooming to maintain your dog’s coat, neatness, and comfort.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Large Dog > 20kg',
              price: 369,
              originalPrice: 480,
              description: 'Give your dog the full works, styled, washed & fresh in our van.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Full Grooming - Cats',
              price: 259,
              originalPrice: 350,
              description: 'Clip, clean & style your cat to perfection, right outside your home.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Basic Home Grooming',
          imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Small Dog < 9kg',
              price: 189,
              originalPrice: 259,
              description: 'Spoil your small pup with a wash, dry & nail trim, no travel needed.',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Medium Dog 10-19kg',
              price: 219,
              originalPrice: 299,
              description: 'Freshen up your dog with a full clean, right in your living room.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Large Dog > 20kg',
              price: 249,
              originalPrice: 349,
              description: 'Pamper your dog with a thorough wash & groom, at home.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Basic Grooming - Cats',
              price: 179,
              originalPrice: 249,
              description: 'Keep your cat clean, calm & comfortable, groomed right at home.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Full Home Grooming',
          imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
          sortOrder: 4,
          variants: [
            {
              name: 'Small Dog < 9kg',
              price: 249,
              originalPrice: 349,
              description: 'Transform your small pup with a full cut, bath & teeth clean at home.',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Medium Dog 10-19kg',
              price: 289,
              originalPrice: 399,
              description: 'Treat your dog to the full works, styled & spotless at home.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Large Dog > 20kg',
              price: 329,
              originalPrice: 449,
              description: 'Give your dog a complete groom, cut & clean without leaving home.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Full Grooming - Cats',
              price: 229,
              originalPrice: 309,
              description: 'Indulge your cat with a full groom, cut & pamper session at home.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'VIP Spa at Home',
          imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
          sortOrder: 5,
          variants: [
            {
              name: 'Spa Care - Small Dog < 9kg',
              price: 190,
              originalPrice: 239,
              description: 'Massage, facial, full groom & more for your small dog, at home.',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Spa Care - Medium Dog 10-19kg',
              price: 210,
              originalPrice: 269,
              description: 'Pamper your dog with a massage, facial & full groom at home.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Spa Care - Large Dog > 20kg',
              price: 270,
              originalPrice: 379,
              description: 'Treat your dog to a luxurious spa, massage & groom without leaving home.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Spa Care - Cat',
              price: 190,
              originalPrice: 239,
              description: 'Spoil your cat with a massage, blueberry facial & full groom at home.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Dry Bath at Home',
          imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
          sortOrder: 6,
          variants: [
            {
              name: 'Dry Bath - Dogs',
              price: 159,
              originalPrice: 199,
              description: 'Easy at-home dry bath with brushing & hygiene care for dogs.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Dry Bath - Cats',
              price: 130,
              originalPrice: 169,
              description: 'Refresh your cat gently with a no-water groom, ideal between baths.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Bundles',
          imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
          sortOrder: 7,
          variants: [
            {
              name: 'Basic Grooming (3x) - Small Dog',
              price: 595,
              originalPrice: 648,
              description: '3-session bundle for small dogs, keeping them clean and fresh.',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Basic Grooming (3x) - Medium Dog',
              price: 679,
              originalPrice: 777,
              description: '3-session bundle for medium dogs, for hygiene and shedding control.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Basic Grooming (3x) - Large Dog',
              price: 759,
              originalPrice: 879,
              description: '3-session bundle for large dogs, for ongoing coat care and freshness.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Full Grooming (3x) - Small Dog',
              price: 759,
              originalPrice: 867,
              description: 'A 3-session bundle for small dogs, for tidy cuts and a fresh look.',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 4,
            },
            {
              name: 'Full Grooming (3x) - Medium Dog',
              price: 879,
              originalPrice: 1014,
              description: 'Bundle of 3 sessions to keep medium dogs neat and well-groomed.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 5,
            },
            {
              name: 'Full Grooming (3x) - Large Dog',
              price: 989,
              originalPrice: 1188,
              description: 'Value bundle for large dogs, for detailed upkeep and coat freshness.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 6,
            },
            {
              name: 'Basic Grooming (3x) - Cat',
              price: 559,
              originalPrice: 648,
              description: '3-session bundle for cats, with gentle grooming & upkeep.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 7,
            },
            {
              name: 'Full Grooming (3x) - Cat',
              price: 709,
              originalPrice: 885,
              description: '3 grooming sessions bundled for cats, for cleaner coats and hygiene.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 8,
            },
          ],
        },
        {
          name: 'Pet Sitting & Walking',
          imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
          sortOrder: 8,
          variants: [
            {
              name: 'Pet Walk/Playtime',
              price: 105,
              originalPrice: 139,
              description: 'A 60-minute walk or play session for your pet’s daily movement.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Pet Sitting',
              price: 120,
              originalPrice: 159,
              description: 'Keep your pet fed, clean & cared for with a screened sitter at home.',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 2,
            },
          ],
        },
      ],
    },

    // 2. Vet at Home
    {
      name: 'Vet at Home',
      nameAr: 'طبيب بيطري في المنزل',
      slug: 'vet-at-home',
      imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=80',
      shortDescription: 'MOCCAE-certified veterinarians visiting your home for physical exams, vaccinations, blood tests & microchipping.',
      shortDescriptionAr: 'فحوصات بيطرية شاملة، تطعيمات، تحاليل دم وتركيب شرائح إلكترونية داخل منزلك.',
      basePrice: 249,
      originalPrice: 599,
      rating: 4.8,
      reviewCount: 1185,
      sortOrder: 2,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Health Checkup',
          imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Vet Home Visit (Dogs)',
              price: 249,
              originalPrice: 599,
              description: 'Get your furry bestie a VIP at-home checkup by top-tier MOCCAE-certified pros.',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Vet Home Visit (Cats)',
              price: 249,
              originalPrice: 599,
              description: 'Get your furry bestie a VIP at-home checkup by top-tier MOCCAE-certified pros.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Avians & Exotics',
              price: 249,
              originalPrice: 599,
              description: 'Give your exotic pets the royal treatment with exclusive at-home checkups.',
              imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Home Wound Management',
              price: 399,
              originalPrice: 649,
              description: 'Pet got a scratch? We’ll deliver next-level wound care right to your door!',
              imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Pet Vaccines',
          imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Annual Vaccination (Dog)',
              price: 549,
              originalPrice: 999,
              description: 'Keep your pup protected and thriving with our annual shots!',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Annual Vaccination (Cat)',
              price: 549,
              originalPrice: 999,
              description: 'Ensure your cat stays healthy and happy with our annual shots!',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Starter Vaccination Package (Puppy)',
              price: 999,
              originalPrice: 1499,
              description: 'Give your puppy the best start with our annual vaccinations! Includes Follow up vaccine.',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Starter Vaccination Package (Kitten)',
              price: 999,
              originalPrice: 1499,
              description: 'Start your kitten off right with our annual vaccinations! Includes Follow up vaccine.',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 4,
            },
            {
              name: 'Rabies',
              price: 399,
              originalPrice: 499,
              description: 'Protect your pets with the Rabies vaccine—essential for their health and safety!',
              imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
              sortOrder: 5,
            },
            {
              name: 'Kennel Cough/Bordatella',
              price: 349,
              originalPrice: 499,
              description: 'Keep your furry friend safe from kennel cough with our essential Bordatella vaccination!',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 6,
            },
          ],
        },
        {
          name: 'Pet Blood Tests',
          imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Complete Blood Count (CBC)',
              price: 499,
              originalPrice: 699,
              description: 'A comprehensive blood test to keep tails wagging and purrs coming!',
              imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Biochemistry',
              price: 799,
              originalPrice: 999,
              description: 'A test to assess your pet’s organ function and health—because they deserve the best!',
              imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Rabies Titer Test',
              price: 1999,
              originalPrice: 3499,
              description: 'A titer test to check rabies antibodies—keeping your pet safe and sound!',
              imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Micro Chipping',
          imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
          sortOrder: 4,
          variants: [
            {
              name: 'Microchipping for Dogs',
              price: 299,
              originalPrice: 359,
              description: 'Secure your dog’s safety with a microchip—no more lost pup panic!',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Microchipping for Cats',
              price: 299,
              originalPrice: 359,
              description: 'Microchip your cat for quick ID—ensuring they’re always safe, even on their adventures!',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Microchipping for Birds & Other Small Animals',
              price: 299,
              originalPrice: 359,
              description: 'Microchip your small pets—tiny adventurers need protection too!',
              imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&q=80',
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Ticks & Fleas',
          imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
          sortOrder: 5,
          variants: [
            {
              name: 'Ticks & Fleas ( Dogs ) 2 kg to10 kg',
              price: 280,
              originalPrice: 379,
              description: 'Protect your pup from pesky ticks and fleas—keep them comfy and happy!',
              imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
              sortOrder: 1,
            },
            {
              name: 'Ticks & Fleas ( Dog ) 10kg to 40kg',
              price: 369,
              originalPrice: 449,
              description: 'Say goodbye to ticks and fleas for your dog—because no pup deserves to be bugged!',
              imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80',
              sortOrder: 2,
            },
            {
              name: 'Ticks & Fleas (Cats) 1Kg to 6Kg',
              price: 279,
              originalPrice: 329,
              description: 'Say farewell to ticks and fleas for your feline—keeping them happy and cozy!',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
              sortOrder: 3,
            },
            {
              name: 'Ticks & Fleas ( Dogs ) Above 40kg',
              price: 449,
              originalPrice: 579,
              description: 'Say goodbye to ticks and fleas for your dog—because no pup deserves to be bugged!',
              imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
              sortOrder: 4,
            },
            {
              name: 'Ticks & Fleas ( Cat ) 6kg to 13kg',
              price: 329,
              originalPrice: 399,
              description: 'Shield your cat from ticks and fleas—keeping their naps uninterrupted and their playtime fun!',
              imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
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
      console.log(`  🔸 Option Group seeded: "${gData.name}" with ${gData.variants.length} items`);
    }
  }

  // 3. Upsert Coupon PG70
  const coupon = await prisma.coupon.upsert({
    where: { code: 'PG70' },
    update: {
      discountType: 'fixed',
      discountValue: 70,
      minAmount: 150,
      isActive: true,
    },
    create: {
      code: 'PG70',
      description: 'AED 70 OFF on Pet Grooming & Vet services',
      discountType: 'fixed',
      discountValue: 70,
      minAmount: 150,
      maxDiscount: 70,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxRedemptions: 10000,
      redemptionCount: 0,
      isActive: true,
    },
  });

  console.log(`🎟️ Coupon upserted: ${coupon.code} (AED 70 OFF)`);

  console.log('\n🎉 Successfully seeded "Pet Care at Home" category and services!');
}

seedPetCare()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
