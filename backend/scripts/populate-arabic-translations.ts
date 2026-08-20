import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Translation dictionary mappings for option groups and key terms
const translationDict: Record<string, string> = {
  // Option Groups
  'Bestsellers': 'الأكثر مبيعاً',
  'Vitamins & Nutrition': 'الفيتامينات والتغذية',
  'STD & UTI Tests': 'فحوصات الأمراض المنقولة جنسياً والتهابات البول',
  'Annual Checkups': 'الفحوصات السنوية الشاملة',
  'Offers': 'العروض المميزة',
  'General': 'خيارات عامة وأساسية',
  'Apartment': 'خدمات الشقق السكنية',
  'Villa': 'خدمات الفلل السكنية',
  'Kitchen': 'تنظيف وتطهير المطبخ',
  'Bathroom': 'تنظيف وتطهير الحمامات',
  'Cockroaches': 'مكافحة الصراصير',
  'Bed Bugs': 'مكافحة بق الفراش',
  'Mosquitoes': 'مكافحة البعوض والحشرات الطائرة',
  'Ants': 'مكافحة النمل والنمل الأبيض',
  'Rodents': 'مكافحة القوارض والفئران',
  'Apartment Disinfection': 'تعقيم الشقق السكنية',
  'Villa Disinfection': 'تعقيم الفلل والمباني',
  'Washing & Ironing': 'الغسيل والكي',
  'Dry Cleaning': 'التنظيف الجاف',
  'Bedding & Linens': 'غسيل المفارش والستائر',
  'Bags & Shoes': 'تنظيف الحقائب والأحذية',
  'Single Items': 'قطع منفردة',
  'Hair Styling': 'تصفيف وتسريح الشعر',
  'Nails & Manicure': 'العناية بالأظافر والمانيكير',
  'Facials & Skincare': 'العناية بالبشرة والفيشل',
  'Massage & Body Spa': 'المساج وسبا الجسم',
  'Men Haircut': 'قص وتصفيف شعر الرجال',
  'Beard Trim & Grooming': 'حلاقة وتشذيب اللحية',
  'AC Split Unit': 'مكيفات اسبليت',
  'AC Central & Duct': 'مكيفات مركزية ودكت',
  'Sofa & Couch': 'تنظيف وتغسيل الكنب',
  'Carpet & Rugs': 'تنظيف وتغسيل السجاد',
  'Mattress': 'تنظيف وتطهير المراتب',
  'Curtains': 'تنظيف بالبخار للستائر',
  "Men’s Health": 'صحة الرجل',
  "Men's Health": 'صحة الرجل',
  "Women’s Health": 'صحة المرأة',
  "Women's Health": 'صحة المرأة',
  "Core Health": 'الصحة الأساسية',
  "Infections & Illnesses": 'الأمراض والعدوى',

  // Lab Tests & Variants seen in UI
  'General Full Body Checkup': 'فحص الشامل العام للجسم',
  'Vitamins & Minerals Panel': 'باقة الفيتامينات والمعادن',
  'Lipid/Cholesterol Profile': 'فحص الدهون والكوليسترول',
  'Custom Prescription Based Lab Test': 'تحليل مخبري مخصص حسب الوصفة الطبية',
  'STD 14 Test - Normal (48 hrs)': 'فحص 14 مرض منقول جنسياً - عادي (48 ساعة)',
  'STD 7 Test - Normal (48 hrs)': 'فحص 7 أمراض منقولة جنسياً - عادي (48 ساعة)',
  'Thyroid Profile': 'تحليل وظائف الغدة الدرقية',
  'Vitamin D & B12 Panel': 'فحص فيتامين د وفيتامين ب12 الشامل',
  'Comprehensive CBC Test': 'فحص صورة الدم الكاملة (CBC)',
  'Diabetes Screening (HbA1c)': 'فحص السكري والتراكمي (HbA1c)',
  'Full Body Wellness Checkup': 'فحص العافية الطبي الشامل للجسم',

  // Addons
  'Balcony Cleaning': 'تنظيف الشرفة',
  'Ironing and Folding': 'الكي والطي',
  'Fridge Cleaning': 'تنظيف الثلاجة',
  'Wardrobe Cleaning': 'تنظيف وترتيب الخزانة',
  'Cupboard Cleaning': 'تنظيف الخزائن والدواليب',
  'Party Cleaning': 'تنظيف ما بعد الحفلات',

  // Common Services
  'Furniture Assembly': 'تركيب وتفكيك الأثاث',
  'Home Disinfection': 'تعقيم وتطهير المنازل',
  'DHA-licensed Nurse Visit': 'زيارة ممرض مرخص من هيئة الصحة بدبي',
  'IV Drip Hydration Therapy': 'علاج المحاليل الوريدية والترطيب',
  'Apartment (Studio / 1BR)': 'شقة (استوديو / غرفة وصالة)',
  'Apartment (2BR / 3BR)': 'شقة (غرفتين أو 3 غرف وصالة)',
  'Villa (Small / Medium)': 'فيلا (صغيرة إلى متوسطة)',
  'Villa (Large / Mansion)': 'فيلا (كبيرة أو قصر)',
  'Kitchen Deep Sanitisation': 'تعقيم عميق شامل للمطبخ',
  'Bathroom Sanitisation': 'تعقيم وتطهير شامل للحمام',
  'Wash & Iron - Small Bag (Up to 10 Items)': 'غسيل وكي - حقيبة صغيرة (حتى 10 قطع)',
  'Wash & Iron - Medium Bag (Up to 20 Items)': 'غسيل وكي - حقيبة متوسطة (حتى 20 قطعة)',
  'Wash & Iron - Large Bag (Up to 30 Items)': 'غسيل وكي - حقيبة كبيرة (حتى 30 قطعة)',
  'Suit (2-Piece)': 'بدلة رجالية (قطعتين)',
  'Dress (Casual / Evening)': 'فستان (يومي / سهرة)',
  'Shirt / Blouse': 'قميص / بلوزة',
  'Bedsheet & Pillowcases Set': 'طقم مفرش سرير وأغطية وسائد',

  'Full Home Pest Control': 'مكافحة الآفات والحشرات الشاملة للمنزل',
  'Pest Control & Disinfection': 'مكافحة الآفات والتطهير',
  'Laundry & Dry Cleaning': 'غسيل وكي الملابس والغسيل الجاف',
  'Home Cleaning': 'تنظيف المنازل بالساعة',
  'Regular Cleaning': 'التنظيف الدوري المنتظم للمنزل',
  'Deep Cleaning': 'التنظيف العميق الشامل',
  'AC Cleaning': 'تنظيف وصيانة المكيفات بالبخار',
  'Furniture Cleaning': 'تنظيف غسيل الكنب والأثاث',
  "Women's Salon": 'صالون التجميل للسيدات في المنزل',
  "Women's Spa": 'سبا المساج والاسترخاء للسيدات',
  "Men's Grooming": 'عناية وحلاقة الرجال المنزلية',
  'Lab at Home': 'الفحوصات المخبرية المنزلية',
  'PCR at Home': 'فحص PCR في المنزل',
  'Nurse Care at Home': 'الرعاية التمريضية المنزلية',
  'Water Purifiers Service': 'صيانة وفلاتر مياه الشرب',
  'Handyman Service': 'خدمات الصيانة المنزلية والتركيبات',
  'Car Washing & Detailing': 'غسيل وتلميع السيارات أمام المنزل',
  'Pet Grooming & Care': 'العناية والاهتمام بالحيوانات الأليفة',
};

const descriptionDict: Record<string, string> = {
  // Lab Descriptions
  'Detects 14 common STDs with fast, accurate & discreet testing for early diagnosis.': 'يكشف عن 14 من الأمراض المنقولة جنسياً الشائعة بفحص سريع ودقيق ومحاط بالسرية التامة.',
  'Detects 7 common STDs with fast, accurate & discreet results within 48 hours.': 'يكشف عن 7 من الأمراض المنقولة جنسياً الشائعة مع نتائج سريعة ودقيقة خلال 48 ساعة.',
  'Measures thyroid hormones to track metabolism, energy & overall health.': 'يقيس هرمونات الغدة الدرقية لمتابعة عمليات الأيض والمستويات العامة للطاقة والصحة.',
  'Comprehensive evaluation of vital body systems, organ functions, and blood markers for complete peace of mind.': 'تقييم شامل لأجهزة الجسم الحيوية ووظائف الأعضاء ومؤشرات الدم لراحة بال كاملة.',
  'Measures key vitamins D, B12 and minerals to optimize energy, immune system, and bone health.': 'يقيس الفيتامينات الأساسية مثل د و ب12 والمعادن لتعزيز الطاقة والمناعة وصحة العظام.',
  'Checks total cholesterol, HDL, LDL, and triglycerides to monitor cardiovascular health.': 'يقيس الكوليسترول الكلي والنافع والضار والدهون الثلاثية لمتابعة صحة القلب والأوعية الدموية.',
  'Upload or request custom lab tests prescribed by your physician for home sample collection.': 'إجراء الفحوصات المخبرية المحددة في الوصفة الطبية الخاصة بك مع سحب العينات في المنزل.',

  // Addons Descriptions
  'Thorough washing and sweeping of balcony space.': 'غسيل وتنظيف شامل لمساحة الشرفة وإزالة الأتربة.',
  'Ironing up to 10 garments and neat folding.': 'كي حتى 10 قطع ملابس وطيها بانتظام.',
  'Interior defrost, shelf wipe and sanitization.': 'إزالة الثلج وتنظيف وتعقيم الأرفف من الداخل.',
  'Re-organizing and dusting inside wardrobes.': 'إعادة ترتيب ومسح الأتربة داخل الخزائن.',
  'Internal cabinet wiping and sorting.': 'مسح الخزائن الداخلية وتنسيق محتوياتها.',
  'Post party cleanup, dish washing & trash removal.': 'تنظيف المكان، غسيل الأطباق وإزالة المخلفات بعد المناسبات.',

  // Other Descriptions
  'Expert furniture assembly and disassembly': 'تركيب وتفكيك الأثاث باحترافية وتجميع الغرف والمكاتب.',
  'Complete home sanitisation and disinfection treatment': 'تعقيم وتطبيبات شاملة للمنزل للقضاء على البكتيريا والفيروسات.',
  'DHA-licensed phlebotomists collect blood samples at home with reports in 24-48 hrs': 'سحب عينات الدم في المنزل بواسطة ممرضين مرخصين من هيئة الصحة بدبي مع تقارير خلال 24-48 ساعة.',
  'Targeted treatment for cockroaches, bedbugs, ants, mosquitoes, rodents & full home': 'علاج مستهدف للقضاء على الصراصير وبق الفراش والنمل والبعوض والقوارض لجميع أنواع المنازل.',
  'Professional home service.': 'خدمة منزلية احترافية وموثوقة بأعلى معايير الجودة.',
};

/** Translate english terms to Arabic safely */
function translateText(text: string | null | undefined, defaultPrefix = ''): string | null {
  if (!text || !text.trim()) return null;
  const trimmed = text.trim();
  if (translationDict[trimmed]) return translationDict[trimmed];
  if (descriptionDict[trimmed]) return descriptionDict[trimmed];

  // Common pattern replacements
  let ar = trimmed;
  ar = ar.replace(/Full Body Checkup/gi, 'فحص شامل للجسم');
  ar = ar.replace(/Checkup/gi, 'فحص طبي');
  ar = ar.replace(/Panel/gi, 'باقة فحوصات');
  ar = ar.replace(/Profile/gi, 'تحليل شامل');
  ar = ar.replace(/Test/gi, 'فحص');
  ar = ar.replace(/Screening/gi, 'مسح طبي');
  ar = ar.replace(/Therapy/gi, 'علاج');
  ar = ar.replace(/Consultation/gi, 'استشارة طبية');
  ar = ar.replace(/Drip/gi, 'محلول وريدي');
  ar = ar.replace(/Shot/gi, 'حقنة مغذية');
  ar = ar.replace(/Session/gi, 'جلسة');
  ar = ar.replace(/Sessions/gi, 'جلسات');
  ar = ar.replace(/Package/gi, 'باقة');
  ar = ar.replace(/Service/gi, 'خدمة');

  // If text was modified by replacements and contains Arabic, return it
  if (ar !== trimmed) return ar;

  // Fallback to defaultPrefix if provided
  return defaultPrefix ? `${defaultPrefix} ${trimmed}` : trimmed;
}

async function main() {
  console.log('🚀 Starting fast parallel Arabic translation sync for database...');

  // 1. ServiceCategories
  const categories = await prisma.serviceCategory.findMany();
  await Promise.all(categories.map(cat => {
    const arName = translationDict[cat.name] || cat.nameAr || `خدمات ${cat.name}`;
    const arDesc = descriptionDict[cat.description || ''] || cat.descriptionAr || `أفضل ${arName} في دبي والإمارات.`;
    return prisma.serviceCategory.update({
      where: { id: cat.id },
      data: {
        nameAr: arName,
        descriptionAr: arDesc,
        introAr: cat.introAr || `احجز ${arName} في دقائق مع محترفين موثوقين ومعتمدين.`,
      },
    });
  }));
  console.log(`✅ Updated ${categories.length} Service Categories`);

  // 2. Services
  const services = await prisma.service.findMany();
  await Promise.all(services.map(s => {
    const arName = translationDict[s.name] || s.nameAr || s.name;
    const arShortDesc = descriptionDict[s.shortDescription || ''] || s.shortDescriptionAr || `خدمة ${arName} احترافية بمواعيد مرنة وأسعار شفافة.`;
    const arDesc = descriptionDict[s.description || ''] || s.descriptionAr || arShortDesc;
    return prisma.service.update({
      where: { id: s.id },
      data: {
        nameAr: arName,
        shortDescriptionAr: arShortDesc,
        descriptionAr: arDesc,
      },
    });
  }));
  console.log(`✅ Updated ${services.length} Services`);

  // 3. Option Groups
  const groups = await prisma.serviceOptionGroup.findMany();
  await Promise.all(groups.map(g => {
    const arName = translationDict[g.name] || (g.nameAr && !g.nameAr.startsWith('باقة ') ? g.nameAr : null) || translateText(g.name, 'باقة') || `باقة ${g.name}`;
    return prisma.serviceOptionGroup.update({
      where: { id: g.id },
      data: { nameAr: arName },
    });
  }));
  console.log(`✅ Updated ${groups.length} Service Option Groups`);

  // 4. Service Variants (Batch 20 at a time for high speed)
  const variants = await prisma.serviceVariant.findMany();
  const chunkSize = 20;
  for (let i = 0; i < variants.length; i += chunkSize) {
    const chunk = variants.slice(i, i + chunkSize);
    await Promise.all(chunk.map(v => {
      const arName = translationDict[v.name] || (v.nameAr && !v.nameAr.includes(v.name) ? v.nameAr : null) || translateText(v.name) || v.name;
      const arDesc = descriptionDict[v.description || ''] || (v.descriptionAr && !v.descriptionAr.startsWith('خيار ') ? v.descriptionAr : null) || translateText(v.description) || (v.description ? `خيار ${arName}` : null);
      return prisma.serviceVariant.update({
        where: { id: v.id },
        data: {
          nameAr: arName,
          descriptionAr: arDesc,
        },
      });
    }));
  }
  console.log(`✅ Updated ${variants.length} Service Variants`);

  // 5. Addons
  const addons = await prisma.addon.findMany();
  await Promise.all(addons.map(a => {
    const arName = translationDict[a.name] || a.nameAr || translateText(a.name) || a.name;
    const arDesc = descriptionDict[a.description || ''] || translateText(a.description) || a.description;
    return prisma.addon.update({
      where: { id: a.id },
      data: {
        nameAr: arName,
        descriptionAr: arDesc,
      },
    });
  }));
  console.log(`✅ Updated ${addons.length} Addons`);

  console.log('🎉 All database records updated with Arabic translations!');
}

main()
  .catch((e) => {
    console.error('❌ Error updating translations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
