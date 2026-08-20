import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSalonSpa() {
  console.log('🌸 Starting Salon & Spa at Home seeding...');

  // 1. Upsert Category "Salon & Spa at Home"
  const categoryData = {
    name: 'Salon & Spa at Home',
    nameAr: 'صالون وسبا في المنزل',
    slug: 'salon-spa-at-home',
    icon: 'Sparkles',
    imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80',
    description: "Top-rated women's and men's beauty, salon and luxury spa wellness treatments delivered to your home.",
    descriptionAr: 'خدمات التجميل والسبا النسائية والرجالية الفاخرة تصلك حتى باب منزلك.',
    sortOrder: 1, // Prominent at top
    isActive: true,
  };

  const category = await prisma.serviceCategory.upsert({
    where: { slug: categoryData.slug },
    update: categoryData,
    create: categoryData,
  });

  console.log(`✅ Category upserted: ${category.name} (${category.id})`);

  // 2. Services Configuration
  const servicesData = [
    {
      name: "Women's Salon",
      nameAr: 'صالون نسائي',
      slug: 'womens-salon',
      imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
      shortDescription: 'Professional waxing, nails, hair, facials & henna at home.',
      shortDescriptionAr: 'خدمات العناية بالأظافر، الواكس، الشعر، تنظيف البشرة والحناء.',
      basePrice: 29,
      originalPrice: 35,
      rating: 4.9,
      reviewCount: 362586,
      sortOrder: 1,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Best sellers',
          imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Underarms Waxing',
              price: 29,
              originalPrice: 35,
              description: 'Silky smooth underarms with gentle wax & soothing aftercare.',
              imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
              durationMinutes: 15,
              sortOrder: 1,
            },
            {
              name: 'Full Arms & Underarms Waxing',
              price: 69,
              originalPrice: 85,
              description: 'Stay effortlessly smooth with silky full arms & underarms.',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
              durationMinutes: 30,
              sortOrder: 2,
            },
            {
              name: 'Classic Manicure & Pedicure',
              price: 119,
              originalPrice: 149,
              description: 'Nail shaping, cuticle care, scrub, foot massage & regular polish.',
              imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 3,
            },
            {
              name: 'Gelish Manicure & Classic Pedicure',
              price: 169,
              originalPrice: 210,
              description: 'Long-lasting gelish manicure paired with classic foot spa.',
              imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80',
              durationMinutes: 75,
              sortOrder: 4,
            },
            {
              name: 'Express Glow Facial',
              price: 139,
              originalPrice: 179,
              description: 'Quick cleansing, gentle exfoliation and brightening radiant mask.',
              imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f407b0b691b?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 5,
            },
          ],
        },
        {
          name: 'Bundles',
          imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Head-to-Toe Pamper Package',
              price: 249,
              originalPrice: 320,
              description: 'Full arms & legs waxing, classic mani-pedi and hair blowdry.',
              imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&q=80',
              durationMinutes: 120,
              sortOrder: 1,
            },
            {
              name: 'Essential Waxing Trio',
              price: 119,
              originalPrice: 150,
              description: 'Full arms, full legs & underarms gentle waxing bundle.',
              imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 2,
            },
            {
              name: 'Glow & Shine Combo',
              price: 199,
              originalPrice: 250,
              description: 'Customized deep facial plus hair wash & styling blowdry.',
              imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
              durationMinutes: 90,
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Nails',
          imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Classic Manicure',
              price: 59,
              originalPrice: 75,
              description: 'Nail trimming, shaping, cuticle care & regular polish.',
              imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80',
              durationMinutes: 30,
              sortOrder: 1,
            },
            {
              name: 'Classic Pedicure',
              price: 69,
              originalPrice: 85,
              description: 'Foot soak, exfoliating scrub, nail grooming & regular polish.',
              imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80',
              durationMinutes: 35,
              sortOrder: 2,
            },
            {
              name: 'Gelish Manicure',
              price: 99,
              originalPrice: 125,
              description: 'Long-lasting high-shine chip-free gel polish for hands.',
              imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 3,
            },
            {
              name: 'Gelish Pedicure',
              price: 109,
              originalPrice: 135,
              description: 'Flawless gel polish finish for toes with complete foot spa.',
              imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80',
              durationMinutes: 50,
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Hair Removal',
          imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
          sortOrder: 4,
          variants: [
            {
              name: 'Underarms Waxing',
              price: 29,
              originalPrice: 35,
              description: 'Quick and gentle wax for clean underarms.',
              imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
              durationMinutes: 15,
              sortOrder: 1,
            },
            {
              name: 'Full Arms Waxing',
              price: 49,
              originalPrice: 65,
              description: 'Smooth arms waxing with soothing hydrating lotion.',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
              durationMinutes: 25,
              sortOrder: 2,
            },
            {
              name: 'Full Legs Waxing',
              price: 69,
              originalPrice: 89,
              description: 'Complete leg hair removal with moisturizing finish.',
              imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&q=80',
              durationMinutes: 35,
              sortOrder: 3,
            },
            {
              name: 'Full Body Waxing',
              price: 199,
              originalPrice: 260,
              description: 'Comprehensive gentle waxing from head to toe.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 90,
              sortOrder: 4,
            },
          ],
        },
        {
          name: 'Facial',
          imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f407b0b691b?w=400&q=80',
          sortOrder: 5,
          variants: [
            {
              name: 'Deep Cleansing Facial (60 min)',
              price: 179,
              originalPrice: 230,
              description: 'Steam, pore extraction, deep detox & soothing herbal mask.',
              imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f407b0b691b?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
            {
              name: 'HydraGlow Brightening Facial (60 min)',
              price: 219,
              originalPrice: 280,
              description: 'Hyaluronic acid infusion for instant deep hydration and radiance.',
              imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Hair',
          imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
          sortOrder: 6,
          variants: [
            {
              name: 'Wash & Blowdry (Short/Medium)',
              price: 79,
              originalPrice: 99,
              description: 'Shampoo, conditioning and professional blowout styling.',
              imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
              durationMinutes: 40,
              sortOrder: 1,
            },
            {
              name: 'Wash & Blowdry (Long/Thick)',
              price: 99,
              originalPrice: 129,
              description: 'Volumizing blowout with smooth finish for long hair.',
              imageUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&q=80',
              durationMinutes: 55,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Henna',
          imageUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80',
          sortOrder: 7,
          variants: [
            {
              name: 'Traditional Henna Design (Both Palms)',
              price: 89,
              originalPrice: 115,
              description: 'Elegant floral or geometric patterns on palms.',
              imageUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 1,
            },
            {
              name: 'Bridal / Party Henna (Hands & Feet)',
              price: 249,
              originalPrice: 320,
              description: 'Intricate rich henna artwork for special occasions.',
              imageUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80',
              durationMinutes: 90,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Massage',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
          sortOrder: 8,
          variants: [
            {
              name: 'Relaxing Head, Neck & Shoulders (30 min)',
              price: 69,
              originalPrice: 90,
              description: 'Relieve upper body stiffness and tension with soothing pressure.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 30,
              sortOrder: 1,
            },
            {
              name: 'Foot Reflexology Massage (30 min)',
              price: 69,
              originalPrice: 90,
              description: 'Acupressure foot massage to restore energy and relieve tired feet.',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
              durationMinutes: 30,
              sortOrder: 2,
            },
          ],
        },
      ],
    },
    {
      name: "Women's Spa",
      nameAr: 'سبا نسائي',
      slug: 'womens-spa',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      shortDescription: 'Luxury spa massages, face lifting, Ayurvedic & Thai therapies at home.',
      shortDescriptionAr: 'جلسات مساج واسترخاء فاخرة، شد الوجه وعلاجات أيورفيدا وتايلاندية.',
      basePrice: 99,
      originalPrice: 139,
      rating: 4.95,
      reviewCount: 218430,
      sortOrder: 2,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Best sellers',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Swedish Relaxation Massage (60 min)',
              price: 139,
              originalPrice: 180,
              description: 'Gentle gliding strokes to ease daily stress and calm muscles.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
            {
              name: 'Deep Tissue Muscle Recovery (60 min)',
              price: 159,
              originalPrice: 210,
              description: 'Firm therapeutic pressure to release deep muscular knots.',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 2,
            },
            {
              name: 'Signature Aromatherapy Massage (60 min)',
              price: 149,
              originalPrice: 195,
              description: 'Custom essential oil blends to balance mind and body.',
              imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Bundles',
          imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Total Wellness Ritual (90 min)',
              price: 219,
              originalPrice: 290,
              description: '60 min full body relaxation + 30 min foot reflexology.',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
              durationMinutes: 90,
              sortOrder: 1,
            },
            {
              name: 'Spa Escape & Face Lift Combo (105 min)',
              price: 259,
              originalPrice: 340,
              description: '60 min Deep Tissue + 45 min Face Sculpting.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 105,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Face lifting',
          imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f407b0b691b?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Gua Sha Facial Sculpt (45 min)',
              price: 129,
              originalPrice: 170,
              description: 'Natural stone sculpting to tone cheekbones and jawline.',
              imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f407b0b691b?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 1,
            },
            {
              name: 'Koban Japanese Face Lift (60 min)',
              price: 169,
              originalPrice: 220,
              description: 'Traditional lifting massage to boost microcirculation & collagen.',
              imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Deep tissue',
          imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
          sortOrder: 4,
          variants: [
            {
              name: 'Deep Tissue Massage (60 min)',
              price: 159,
              originalPrice: 210,
              description: 'Intense pressure focused on chronic tension areas.',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
            {
              name: 'Deep Tissue Massage (90 min)',
              price: 219,
              originalPrice: 290,
              description: 'Comprehensive full body deep muscle recovery.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 90,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Relaxation',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
          sortOrder: 5,
          variants: [
            {
              name: 'Swedish Relaxation Massage (60 min)',
              price: 139,
              originalPrice: 180,
              description: 'Classic Swedish strokes for soothing full body relaxation.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
            {
              name: 'Warm Botanical Candle Massage (60 min)',
              price: 169,
              originalPrice: 220,
              description: 'Warm scented shea butter massage to nourish skin.',
              imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Ayurvedic',
          imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80',
          sortOrder: 6,
          variants: [
            {
              name: 'Abhyanga Warm Herbal Oil Massage (60 min)',
              price: 169,
              originalPrice: 220,
              description: 'Traditional rhythmic strokes with warm dosha-specific oils.',
              imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
            {
              name: 'Potli Herbal Compress Therapy (60 min)',
              price: 189,
              originalPrice: 245,
              description: 'Warm herbal poultices pressed onto sore joints and muscles.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Targeted',
          imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
          sortOrder: 7,
          variants: [
            {
              name: 'Targeted Back, Neck & Shoulders (45 min)',
              price: 99,
              originalPrice: 130,
              description: 'Focused relief for desk workers and upper body tension.',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 1,
            },
            {
              name: 'Foot & Calf Revitalizing Massage (45 min)',
              price: 99,
              originalPrice: 130,
              description: 'Relieves heavy legs, swelling and standing fatigue.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Thai',
          imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
          sortOrder: 8,
          variants: [
            {
              name: 'Traditional Thai Dry Massage (60 min)',
              price: 149,
              originalPrice: 195,
              description: 'Assisted stretching and acupressure without oils on floor mat.',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
          ],
        },
        {
          name: 'Hot Stone',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
          sortOrder: 9,
          variants: [
            {
              name: 'Volcanic Hot Stone Therapy (60 min)',
              price: 179,
              originalPrice: 235,
              description: 'Heated basalt volcanic stones to melt away stiffness.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
          ],
        },
        {
          name: 'Aroma Therapy',
          imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80',
          sortOrder: 10,
          variants: [
            {
              name: 'Lavender Calming Aromatherapy (60 min)',
              price: 149,
              originalPrice: 195,
              description: 'Pure French lavender essential oils to induce restful sleep.',
              imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Men's Salon",
      nameAr: 'صالون رجالي',
      slug: 'mens-salon',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
      shortDescription: 'Master barbers for precision haircuts, beard trimming, styling & facial at home.',
      shortDescriptionAr: 'حلاقة شعر احترافية، تهذيب اللحية، تنظيف البشرة وعناية متكاملة للرجال.',
      basePrice: 39,
      originalPrice: 55,
      rating: 4.88,
      reviewCount: 142890,
      sortOrder: 3,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Best sellers',
          imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Classic Haircut & Styling',
              price: 59,
              originalPrice: 75,
              description: 'Precision scissor cut, fade, wash & modern styling.',
              imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
              durationMinutes: 30,
              sortOrder: 1,
            },
            {
              name: 'Royal Beard Trim & Hot Towel Shave',
              price: 49,
              originalPrice: 65,
              description: 'Beard shaping, razor line definition & hot towel treatment.',
              imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
              durationMinutes: 25,
              sortOrder: 2,
            },
            {
              name: "The Gentleman's Cut & Shave Combo",
              price: 99,
              originalPrice: 130,
              description: 'Full haircut styling plus luxury beard sculpt & hot towel.',
              imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
              durationMinutes: 50,
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Bundles',
          imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Complete Grooming Package',
              price: 169,
              originalPrice: 220,
              description: 'Haircut, beard sculpt, express facial and scalp massage.',
              imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
              durationMinutes: 75,
              sortOrder: 1,
            },
            {
              name: 'Father & Son Haircut Duo',
              price: 99,
              originalPrice: 135,
              description: 'Two haircuts and styling at the comfort of your home.',
              imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Haircuts & Styling',
          imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Signature Haircut',
              price: 59,
              originalPrice: 75,
              description: 'Custom scissor or clippers haircut with blowdry styling.',
              imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
              durationMinutes: 30,
              sortOrder: 1,
            },
            {
              name: 'Buzz Cut & Razor Lineup',
              price: 39,
              originalPrice: 50,
              description: 'Clean single-guard buzz cut with razor sharp edge lineup.',
              imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
              durationMinutes: 20,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Beard & Shave',
          imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
          sortOrder: 4,
          variants: [
            {
              name: 'Beard Trim & Lineup',
              price: 39,
              originalPrice: 50,
              description: 'Clippers trim, fade, and razor line shaping.',
              imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
              durationMinutes: 20,
              sortOrder: 1,
            },
            {
              name: 'Traditional Hot Towel Wet Shave',
              price: 49,
              originalPrice: 65,
              description: 'Pre-shave oil, hot towel lather and straight razor finish.',
              imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
              durationMinutes: 25,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Facial & Skincare',
          imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f407b0b691b?w=400&q=80',
          sortOrder: 5,
          variants: [
            {
              name: 'Deep Pore Cleansing Facial (45 min)',
              price: 129,
              originalPrice: 170,
              description: 'Steam, blackhead extraction, scrub and clay mask.',
              imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f407b0b691b?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 1,
            },
          ],
        },
        {
          name: 'Hands & Feet',
          imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80',
          sortOrder: 6,
          variants: [
            {
              name: "Men's Sport Manicure & Pedicure Combo",
              price: 119,
              originalPrice: 155,
              description: 'Complete nail clipping, cuticle grooming, foot scrub & buff.',
              imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80',
              durationMinutes: 50,
              sortOrder: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Men's Spa",
      nameAr: 'سبا رجالي',
      slug: 'mens-spa',
      imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
      shortDescription: 'Therapeutic deep tissue, athletic recovery, Swedish & hot stone massages for men.',
      shortDescriptionAr: 'مساج الأنسجة العميقة، التعافي الرياضي، والمساج السويدي للرجال.',
      basePrice: 99,
      originalPrice: 139,
      rating: 4.92,
      reviewCount: 189410,
      sortOrder: 4,
      isFeatured: true,
      bookingType: 'options',
      optionGroups: [
        {
          name: 'Best sellers',
          imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
          sortOrder: 1,
          variants: [
            {
              name: 'Deep Tissue Muscle Recovery (60 min)',
              price: 159,
              originalPrice: 210,
              description: 'Targeted high-pressure massage to relieve sore muscles & knots.',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
            {
              name: 'Swedish Anti-Stress Massage (60 min)',
              price: 139,
              originalPrice: 180,
              description: 'Medium pressure therapy to reduce fatigue and unwind.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 2,
            },
            {
              name: 'Athlete Sports Recovery Massage (60 min)',
              price: 169,
              originalPrice: 225,
              description: 'PJM stretching and trigger point release post workout.',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 3,
            },
          ],
        },
        {
          name: 'Bundles',
          imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
          sortOrder: 2,
          variants: [
            {
              name: 'Ultimate Muscle Overhaul (90 min)',
              price: 219,
              originalPrice: 290,
              description: '60 min Deep Tissue + 30 min Foot Reflexology.',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
              durationMinutes: 90,
              sortOrder: 1,
            },
          ],
        },
        {
          name: 'Deep Tissue',
          imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
          sortOrder: 3,
          variants: [
            {
              name: 'Deep Tissue Massage (60 min)',
              price: 159,
              originalPrice: 210,
              description: 'Therapeutic deep muscle pressure with cooling arnica balm.',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
            {
              name: 'Deep Tissue Massage (90 min)',
              price: 219,
              originalPrice: 290,
              description: 'Comprehensive full body deep tissue therapy.',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
              durationMinutes: 90,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Relaxation',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
          sortOrder: 4,
          variants: [
            {
              name: 'Swedish Relaxation Massage (60 min)',
              price: 139,
              originalPrice: 180,
              description: 'Smooth flowing strokes to melt mental stress.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
          ],
        },
        {
          name: 'Sports Recovery',
          imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
          sortOrder: 5,
          variants: [
            {
              name: 'Pre/Post Workout Sports Massage (60 min)',
              price: 169,
              originalPrice: 225,
              description: 'Assisted stretching and lactic acid flushing.',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
          ],
        },
        {
          name: 'Targeted',
          imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
          sortOrder: 6,
          variants: [
            {
              name: 'Lower Back & Spine Focus (45 min)',
              price: 99,
              originalPrice: 130,
              description: 'Releases lumbar tightness and postural back fatigue.',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 1,
            },
            {
              name: 'Head, Neck & Shoulders Desk Relief (45 min)',
              price: 99,
              originalPrice: 130,
              description: 'Relieves neck stiffness and screen fatigue.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 45,
              sortOrder: 2,
            },
          ],
        },
        {
          name: 'Thai & Stretching',
          imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
          sortOrder: 7,
          variants: [
            {
              name: 'Traditional Thai Stretch Massage (60 min)',
              price: 149,
              originalPrice: 195,
              description: 'Dynamic stretching and bodyweight pressure for flexibility.',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
            },
          ],
        },
        {
          name: 'Hot Stone',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
          sortOrder: 8,
          variants: [
            {
              name: 'Heated Volcanic Stone Massage (60 min)',
              price: 179,
              originalPrice: 235,
              description: 'Penetrating heat to loosen tight back and shoulders.',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
              durationMinutes: 60,
              sortOrder: 1,
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
              durationMinutes: vData.durationMinutes,
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
              durationMinutes: vData.durationMinutes,
              sortOrder: vData.sortOrder,
              isActive: true,
            },
          });
        }
      }
      console.log(`  🔸 Option Group seeded: "${gData.name}" with ${gData.variants.length} items`);
    }
  }

  console.log('\n🎉 Successfully seeded "Salon & Spa at Home" with all 4 services and options!');
}

seedSalonSpa()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
