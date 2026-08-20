import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ServicePlus database...');

  const uae = await prisma.country.upsert({
    where: { code: 'AE' },
    update: {},
    create: {
      code: 'AE',
      name: 'United Arab Emirates',
      currencyCode: 'AED',
      currencySymbol: 'د.إ',
      dialCode: '+971',
    },
  });

  const dubai = await prisma.city.upsert({
    where: { id: 'city-dubai' },
    update: {},
    create: {
      id: 'city-dubai',
      name: 'Dubai',
      slug: 'dubai',
      countryId: uae.id,
      surchargePct: 0,
      isActive: true,
    },
  });

  const abuDhabi = await prisma.city.upsert({
    where: { id: 'city-abudhabi' },
    update: {},
    create: {
      id: 'city-abudhabi',
      name: 'Abu Dhabi',
      slug: 'abu-dhabi',
      countryId: uae.id,
      surchargePct: 5,
      isActive: true,
    },
  });

  const sharjah = await prisma.city.upsert({
    where: { id: 'city-sharjah' },
    update: {},
    create: {
      id: 'city-sharjah',
      name: 'Sharjah',
      slug: 'sharjah',
      countryId: uae.id,
      surchargePct: 0,
      isActive: true,
    },
  });

  const catCleaning = await prisma.serviceCategory.upsert({
    where: { slug: 'home-cleaning' },
    update: {},
    create: {
      name: 'Home Cleaning',
      nameAr: 'تنظيف المنازل',
      slug: 'home-cleaning',
      icon: 'Sparkles',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
      description: 'Professional home cleaning services for every need.',
      descriptionAr: 'خدمات تنظيف منازل احترافية لكل احتياج.',
      intro: 'ServicePlus brings you top-rated home cleaning professionals in Dubai and across the UAE. Whether you need a one-time deep clean, regular weekly maintenance, or a thorough move-in/move-out cleaning, our vetted professionals deliver spotless results every time.\n\nAll our cleaning professionals are background-checked, insured, and equipped with eco-friendly products. Book in under 60 seconds and enjoy same-day availability across Dubai, Abu Dhabi, Sharjah, and Ajman.',
      introAr: 'تقدّم لك سيرفس بلس أفضل محترفي تنظيف المنازل في دبي وجميع أنحاء الإمارات. سواء كنت تحتاج تنظيفًا عميقًا لمرة واحدة، أو صيانة أسبوعية منتظمة، أو تنظيفًا شاملاً قبل الانتقال أو بعده، يقدّم محترفونا الموثوقون نتائج لامعة في كل مرة.\n\nجميع محترفي التنظيف لدينا تم التحقق من خلفياتهم، وهم مؤمّنون ومجهّزون بمنتجات صديقة للبيئة. احجز في أقل من 60 ثانية واستمتع بالتوفر في نفس اليوم في دبي وأبوظبي والشارقة وعجمان.',
      sections: [
        {
          title: 'What is Home Cleaning?',
          body: 'Home cleaning is a professional service that covers all aspects of maintaining a clean and hygienic living space. Our professionals handle everything from dusting and vacuuming to kitchen degreasing and bathroom sanitisation. Services range from regular maintenance cleaning to deep cleaning that targets hidden dirt and allergens.',
        },
        {
          title: 'Why Choose ServicePlus for Home Cleaning?',
          body: 'Our cleaning professionals undergo rigorous vetting and training. We use eco-friendly, non-toxic products that are safe for children and pets. With transparent pricing, no hidden fees, and free cancellation up to 6 hours before your slot, ServicePlus makes home cleaning effortless.\n\nEvery booking is backed by our satisfaction guarantee — if you are not happy, we will re-clean for free.',
        },
        {
          title: 'How to Book a Home Cleaning Service',
          body: 'Booking is simple: choose your service, select a date and time, confirm your address, and you are done. Your professional will arrive at the scheduled time with all necessary equipment. Track your professional in real time through the app.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هو تنظيف المنازل؟',
          body: 'تنظيف المنزل هو خدمة احترافية تشمل جميع جوانب الحفاظ على مساحة معيشة نظيفة وصحية. يتعامل محترفونا مع كل شيء من التخلص من الغبار والمسح بالمكنسة الكهربائية إلى إزالة الشحوم من المطبخ والتعقيم في الحمامات. تتراخدم الخدمات من التنظيف الدوري الروتيني إلى التنظيف العميق الذي يستهدف الأوساخ والمواد المسببة للحساسية المخفية.',
        },
        {
          title: 'لماذا تختار سيرفس بلس لتنظيف المنازل؟',
          body: 'يخضع محترفو التنظيف لدينا لعملية تحقق وتدريب صارمة. نستخدم منتجات صديقة للبيئة وغير سامة آمنة على الأطفال والحيوانات الأليفة. مع أسعار شفافة وبدون رسوم خفية وإلغاء مجاني حتى 6 ساعات قبل موعدك، تجعل سيرفس بلس من تنظيف المنزل أمرًا سهلاً.\n\nكل حجز مدعوم بضمان رضا العملاء — إذا لم تكن راضيًا، سنعيد التنظيف مجانًا.',
        },
        {
          title: 'كيفية حجز خدمة تنظيف المنازل',
          body: 'الحجز سهل: اختر الخدمة، وحدد التاريخ والوقت، وتأكيد عنوانك، وانتهى الأمر. سيصل المحترف في الموعد المحدد مع جميع المعدات اللازمة. تتبع المحترف في الوقت الفعلي عبر التطبيق.',
        },
      ],
      faqs: [
        { q: 'How long does a home cleaning service take?', a: 'A regular cleaning session typically takes 2-4 hours depending on the size of your home. Deep cleaning may take 4-8 hours for a thorough result.' },
        { q: 'Do I need to provide cleaning supplies?', a: 'No, our professionals come fully equipped with eco-friendly cleaning products and professional-grade equipment. You can request them to use your own supplies if preferred.' },
        { q: 'Can I book same-day home cleaning?', a: 'Yes! We offer same-day availability for most areas in Dubai and surrounding emirates. Book before 2 PM for same-day slots.' },
        { q: 'What is included in a deep cleaning service?', a: 'Deep cleaning covers all areas including kitchen appliances, bathroom tiles, window tracks, baseboards, light fixtures, and behind furniture. It is a top-to-bottom thorough clean.' },
        { q: 'Is there a cancellation fee?', a: 'No cancellation fee if you cancel up to 6 hours before your scheduled slot. Late cancellations may incur a small fee.' },
      ],
      faqsAr: [
        { q: 'كم تستغرق خدمة تنظيف المنازل؟', a: 'تستغرق جلسة التنظيف العادية عادة 2-4 ساعات حسب حجم منزلك. قد يستغرق التنظيف العميق 4-8 ساعات للحصول على نتيجة شاملة.' },
        { q: 'هل أحتاج أن أوفر مواد التنظيف؟', a: 'لا، يأتي محترفونا مجهّزين بالكامل بمنتجات تنظيف صديقة للبيئة ومعدات احترافية. يمكنك طلبهم باستخدام موادك الخاصة إذا كنت تفضل ذلك.' },
        { q: 'هل يمكنني حجز تنظيف في نفس اليوم؟', a: 'نعم! نوفر التوفر في نفس اليوم لمعظم مناطق دبي والإمارات المحيطة. احجز قبل الساعة 2 مساءً للمواعيد في نفس اليوم.' },
        { q: 'ماذا يشمل التنظيف العميق؟', a: 'يشمل التنظيف العميق جميع المناطق بما في ذلك أجهزة المطبخ وبلاط الحمامات ومسارات النوافذ والألواح الثابتة والإضاءة وخلف الأثاث.' },
        { q: 'هل هناك رسوم إلغاء؟', a: 'لا رسوم إلغاء إذا ألغيت الحجز قبل 6 ساعات من موعدك المحدد. قد تُطلب رسوم بسيطة للإلغاء المتأخر.' },
      ],
      seoTitle: 'Home Cleaning Services in Dubai & UAE — ServicePlus',
      seoDescription: 'Book professional home cleaning services in Dubai, Abu Dhabi, Sharjah & Ajman. Vetted professionals, eco-friendly products, same-day availability. Starting from AED 50/hr.',
      isActive: true,
      sortOrder: 1,
    },
  });

  const catPcrAtHome = await prisma.serviceCategory.upsert({
    where: { slug: 'pcr-at-home' },
    update: {},
    create: {
      name: 'PCR at Home',
      nameAr: 'فحص PCR في المنزل',
      slug: 'pcr-at-home',
      icon: 'FlaskConical',
      imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&q=80',
      description: 'Convenient PCR testing in the comfort of your home.',
      descriptionAr: 'فحوصات PCR مريحة في راحة منزلك.',
      intro: 'Get accurate PCR test results without leaving your home. ServicePlus partners with accredited laboratories to bring COVID-19 PCR testing directly to your doorstep. Our certified medical professionals collect samples quickly and safely, with results delivered digitally within 24-48 hours.\n\nAvailable across Dubai, Abu Dhabi, Sharjah, and Ajman — ideal for travel requirements, workplace testing, or peace of mind.',
      introAr: 'احصل على نتائج فحص PCR دقيقة دون مغادرة منزلك. تعاون سيرفس بلس مع مختبرات معتمدة لتقديم فحص كوفيد-19 PCR مباشرة إلى باب منزلك. يجمع المحترفون الطبيون المعتمدون العينات بسرعة وأمان، مع تقديم النتائج إلكترونيًا خلال 24-48 ساعة.\n\nمتاح في دبي وأبوظبي والشارقة وعجمان — مثالي لمتطلبات السفر أو اختبارات مكان العمل أو لراحة البال.',
      sections: [
        {
          title: 'What is PCR at Home?',
          body: 'PCR at Home is a service where a certified healthcare professional visits your home to collect a nasopharyngeal swab for COVID-19 PCR testing. The sample is then sent to an accredited laboratory for analysis, and results are delivered digitally.',
        },
        {
          title: 'Why Choose ServicePlus for PCR Testing?',
          body: 'Our phlebotomists and nurses are DHA-certified and follow strict safety protocols. We partner with MOH and DHA-approved laboratories for accurate results. No need to wait in queues — we come to you.\n\nResults are delivered via SMS and email within 24-48 hours, and we provide the official lab certificate accepted for travel and official purposes.',
        },
        {
          title: 'How to Book a PCR Test',
          body: 'Select the PCR at Home service, choose your preferred date and time, and confirm your address. Our professional will arrive at your doorstep with all necessary equipment. The sample collection takes less than 10 minutes.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هو فحص PCR في المنزل؟',
          body: 'فحص PCR في المنزل هو خدمة يزور فيها محترف طبي معتمد منزلك لجمع مسحة أنفية ل-pharyngeal لفحص كوفيد-19 PCR. ثم تُرسل العينة إلى مختبر معتمد للتحليل، وتُقدم النتائج إلكترونيًا.',
        },
        {
          title: 'لماذا تختار سيرفس بلس لفحص PCR؟',
          body: 'أخصائيو السحب لدينا معتمدون من هيئة الصحة في دبي يتبعون بروتوكولات سلامة صارمة. نتعاون مع مختبرات معتمدة من وزارة الصحة وهيئة دبي للصحة لنتائج دقيقة. لا حاجة للانتظار في الطوابير — نأتي إليك.\n\nتُقدم النتائج عبر الرسائل النصية والبريد الإلكتروني خلال 24-48 ساعة، ونوفر الشهادة الرسمية من المختبر المقبولة للسفر والأغراض الرسمية.',
        },
        {
          title: 'كيفية حجز فحص PCR',
          body: 'اختر خدمة فحص PCR في المنزل، وحدد التاريخ والوقت المفضلين، وأكد عنوانك. سيصل المحترف إلى باب منزلك بجميع المعدات اللازمة. تستغرق عملية جمع العينة أقل من 10 دقائق.',
        },
      ],
      faqs: [
        { q: 'How long does the sample collection take?', a: 'The sample collection takes less than 10 minutes. Our professional will arrive at your scheduled time and collect the nasopharyngeal swab.' },
        { q: 'When will I receive my PCR results?', a: 'Results are typically delivered within 24-48 hours via SMS and email. You will also receive an official lab certificate.' },
        { q: 'Is the PCR test accepted for travel?', a: 'Yes, our PCR test certificates are issued by MOH and DHA-approved laboratories and are accepted for international travel.' },
        { q: 'Do I need to fast before the test?', a: 'No, fasting is not required for a PCR test. You can eat and drink normally before the sample collection.' },
      ],
      faqsAr: [
        { q: 'كم تستغرق عملية جمع العينة؟', a: 'تستغرق عملية جمع العينة أقل من 10 دقائق. سيصل المحترف في الموعد المحدد ويجمع المسحة الأنفية.' },
        { q: 'متى سأحصل على نتائج فحص PCR؟', a: 'تُقدم النتائج عادة خلال 24-48 ساعة عبر الرسائل النصية والبريد الإلكتروني. ستحصل أيضًا على شهادة مختبر رسمية.' },
        { q: 'هل يُقبل فحص PCR للسفر؟', a: 'نعم، شهادات فحص PCR الصادرة عن مختبرات معتمدة من وزارة الصحة وهيئة دبي للصحة مقبولة للسفر الدولي.' },
        { q: 'هل أحتاج للصيام قبل الفحص؟', a: 'لا، الصيام غير مطلوب لفحص PCR. يمكنك الأكل والشرب بشكل طبيعي قبل جمع العينة.' },
      ],
      seoTitle: 'PCR Test at Home in Dubai & UAE — ServicePlus',
      seoDescription: 'Book a professional PCR test at home in Dubai, Abu Dhabi, Sharjah & Ajman. DHA-certified professionals, results in 24-48 hours. Travel-approved certificates.',
      isActive: true,
      sortOrder: 2,
    },
  });

  const catWomensSalon = await prisma.serviceCategory.upsert({
    where: { slug: 'womens-salon' },
    update: {},
    create: {
      name: "Women's Salon",
      nameAr: 'صالون نسائي',
      slug: 'womens-salon',
      icon: 'Scissors',
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
      description: 'Expert hair styling, coloring, and beauty treatments.',
      descriptionAr: 'خدمات تجميل وتصفيف شعر احترافية.',
      intro: 'Transform your look with ServicePlus women\'s salon services. Our expert hairstylists and beauty professionals come to your home, offering everything from haircuts and blow-dries to color treatments, keratin smoothing, and special occasion styling.\n\nAll salon professionals are trained in the latest trends and techniques, using premium salon-quality products. Enjoy a luxurious salon experience without leaving the comfort of your home.',
      introAr: 'غيّري مظهرك مع خدمات صالون السيدات من سيرفس بلس. يأتي مصففو الشعر والمحترفون الجماليون المتخصصون إلى منزلك، مقدمين كل شيء من قصات الشعر والتجفيف إلى علاجات التلوين و Treatment الكيراتين وتصفيف المناسبات الخاصة.\n\nجميع متخصصي الصالون مدربون على أحدث الصيحات والتقنيات، باستخدام منتجات عالية الجودة من صالوناتprofessionnelle. استمتعي بتجربة صالون فاخرة دون مغادرة راحة منزلك.',
      sections: [
        {
          title: 'What is Women\'s Salon Service?',
          body: 'Our Women\'s Salon service brings professional hair and beauty treatments directly to your home. Services include haircuts, blow-drying, hair coloring, highlights, keratin treatments, hair spa, updos, braiding, and special occasion styling. We also offer manicure, pedicure, and basic beauty treatments.',
        },
        {
          title: 'Why Choose ServicePlus Salon?',
          body: 'Our salon professionals are certified by international beauty academies and have years of experience. They bring professional-grade tools and products to your home, ensuring salon-quality results.\n\nWith transparent pricing, no hidden charges, and the comfort of your own home, ServicePlus salon is the smart choice for modern women in the UAE.',
        },
        {
          title: 'How to Book a Salon Service',
          body: 'Choose your desired service, select a date and time, and confirm your address. Your stylist will arrive with all necessary equipment. You can discuss your preferences and get a consultation before the service begins.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هي خدمة صالون السيدات؟',
          body: 'تقدّم لك خدمة صالون السيدات من سيرفس بلس علاجات الشعر والجمال الاحترافية مباشرة إلى منزلك. تشمل الخدمات قصات الشعر والتجفيف والتلوين والتمييز وعلاجات الكيراتين وسبا الشعر والتسريحات الخاصة. كما نقدم manicure و pedicure وعلاجات الجمال الأساسية.',
        },
        {
          title: 'لماذا تختار صالون سيرفس بلس؟',
          body: 'محترفو الصالون لدينا معتمدون من أكاديميات الجمال الدولية وexperience多年. يأتون بأدوات ومنتجات من الدرجة المهنية إلى منزلك، مما يضمن نتائج بجودة الصالون.\n\nمع أسعار شفافة وبدون رسوم خفية وراحة منزلك، يُعد صالون سيرفس بلس الخيار الذكي للمرأة العصرية في الإمارات.',
        },
        {
          title: 'كيفية حجز خدمة الصالون',
          body: 'اختر الخدمة المطلوبة، وحدد التاريخ والوقت، وأكد عنوانك. سيصل مصفف الشعر مع جميع المعدات اللازمة. يمكنك مناقشة تفضيلاتك والحصول على استشارة قبل بدء الخدمة.',
        },
      ],
      faqs: [
        { q: 'What hair services are available?', a: 'We offer haircuts, blow-drying, hair coloring, highlights, balayage, keratin treatments, hair spa, updos, braiding, and special occasion styling.' },
        { q: 'Do salon professionals bring their own products?', a: 'Yes, our professionals come equipped with premium salon-quality products. You can also request them to use your preferred products.' },
        { q: 'Can I get a consultation before booking?', a: 'Yes, you can discuss your preferences and get a professional consultation when your stylist arrives.' },
        { q: 'How long does a hair coloring session take?', a: 'Hair coloring typically takes 1.5-3 hours depending on the technique and hair length. Keratin treatments may take 2-4 hours.' },
      ],
      faqsAr: [
        { q: 'ما هي خدمات الشعر المتاحة؟', a: 'نقدم قصات الشعر والتجفيف والتلوين والتمييز و balayage وعلاجات الكيراتين وسبا الشعر والتسريحات الخاصة والضفائر.' },
        { q: 'هل يأتي متخصصو الصالون بمنتجاتهم الخاصة؟', a: 'نعم، يأتي محترفونا مجهّزين بمنتجات عالية الجودة من صالوناتprofessional. يمكنك أيضًا طلب استخدام منتجاتك المفضلة.' },
        { q: 'هل يمكنني الحصول على استشارة قبل الحجز؟', a: 'نعم، يمكنك مناقشة تفضيلاتك والحصول على استشارة احترافية عند وصول مصفف الشعر.' },
        { q: 'كم تستغرق جلسة تلوين الشعر؟', a: 'يستغرق تلوين الشعر عادة 1.5-3 ساعات حسب التقنية وطول الشعر. قد تستغرق علاجات الكيراتين 2-4 ساعات.' },
      ],
      seoTitle: 'Women\'s Salon Services at Home in Dubai — ServicePlus',
      seoDescription: 'Book professional women\'s salon services at home in Dubai & UAE. Haircuts, coloring, keratin treatments & more. Expert stylists, premium products.',
      isActive: true,
      sortOrder: 3,
    },
  });

  const catWomensSpa = await prisma.serviceCategory.upsert({
    where: { slug: 'womens-spa' },
    update: {},
    create: {
      name: "Women's Spa",
      nameAr: 'سبا نسائي',
      slug: 'womens-spa',
      icon: 'Flower2',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
      description: 'Relaxing spa and wellness treatments at your doorstep.',
      descriptionAr: 'علاجات سبا وعافية مريحة في منزلك.',
      intro: 'Indulge in a luxurious spa experience without leaving your home. ServicePlus brings professional spa treatments to your doorstep, including full-body massage, aromatherapy, hot stone therapy, facials, body scrubs, and reflexology.\n\nOur certified therapists use premium oils and products to help you unwind, relieve stress, and rejuvenate. Perfect for a relaxing evening, a special occasion, or regular wellness maintenance.',
      introAr: 'استمتعي بتجربة سبا فاخرة دون مغادرة منزلك. تأتي سيرفس بلس بعلاجات السبا الاحترافية إلى باب منزلك، بما في ذلك تدليك الجسم الكامل وعلاج الروائح العطرية والعلاج بالحصى الساخن والوجه والتقشير وعلاج مناولة القدم.\n\nالمعالجون المعتمدون لدينا يستخدمون زيوتًا ومنتجات فاخرة لمساعدتك على الاسترخاء والتخلص من التوتر والتجدد. مثالية لمساء مريح أو مناسبة خاصة أو صيانة العافية المنتظمة.',
      sections: [
        {
          title: 'What is Women\'s Spa Service?',
          body: 'Our Women\'s Spa service provides professional massage and wellness treatments in the comfort of your home. Services include Swedish massage, deep tissue massage, aromatherapy, hot stone therapy, Balinese massage, Thai massage, facials, body scrubs, and reflexology.',
        },
        {
          title: 'Why Choose ServicePlus Spa?',
          body: 'Our spa therapists are internationally certified and trained in various massage techniques. They bring portable massage tables, premium oils, and create a calming ambiance in your home.\n\nWith flexible scheduling, transparent pricing, and professional-grade service, you can enjoy a spa day any time you want — no appointments at crowded spas needed.',
        },
        {
          title: 'How to Book a Spa Service',
          body: 'Select your preferred massage type or spa treatment, choose a date and time, and confirm your address. Your therapist will arrive with all necessary equipment. You can discuss pressure preferences and areas of focus before the session begins.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هي خدمة السبا للسيدات؟',
          body: 'توفر خدمة السبا للسيدات من سيرفس بلس علاجات تدليك وعافية احترافية في راحة منزلك. تشمل الخدمات تدليك السويدية وتدليك الأنسجة العميقة وعلاج الروائح العطرية والعلاج بالحصى الساخن والتدليك الباليزي والتايلاندي والوجه والتقشير وعلاج مناولة القدم.',
        },
        {
          title: 'لماذا تختار سبا سيرفس بلس؟',
          body: 'معالجو السبا لدينا معتمدون دوليًا ومدربون على تقنيات تدليك مختلفة. يأتون بطاولات تدليك محمولة وزيوت فاخرة وخلق أجواء مريحة في منزلك.\n\nمع جدولة مرنة وأسعار شافحة وخدمة من الدرجة المهنية، يمكنك الاستمتاع بيوم سبا في أي وقت تريده — لا حاجة لمواعيد في أزدحام.',
        },
        {
          title: 'كيفية حجز خدمة السبا',
          body: 'اختر نوع التدليك أو علاج السبا المفضل، وحدد التاريخ والوقت، وأكد عنوانك. سيصل المعالج بجميع المعدات اللازمة. يمكنك مناقشة تفضيلات الضغط ومجالات التركيز قبل بدء الجلسة.',
        },
      ],
      faqs: [
        { q: 'What types of massage are available?', a: 'We offer Swedish, deep tissue, aromatherapy, hot stone, Balinese, Thai, and sports massage. Each type targets different needs and preferences.' },
        { q: 'Do therapists bring their own equipment?', a: 'Yes, our therapists bring portable massage tables, towels, oils, and all necessary equipment to create a spa atmosphere in your home.' },
        { q: 'How long is a typical spa session?', a: 'Sessions range from 60 minutes for a standard massage to 120 minutes for a full spa package. You can customize the duration based on your preference.' },
        { q: 'Can I book a spa service for a special occasion?', a: 'Absolutely! We offer special occasion packages including couples massage, bridal spa, and birthday spa experiences.' },
      ],
      faqsAr: [
        { q: 'ما هي أنواع التدليك المتاحة؟', a: 'نقدم التدليك السويدية والأنسجة العميقة والعطرية والحصى الساخن والباليزي والتايلاندي وتدليك الرياضة. كل نوع يستهدف احتياجات وتفضيلات مختلفة.' },
        { q: 'هل يأتي المعالجون بمعداتهم الخاصة؟', a: 'نعم، يأتي معالجونا بطاولات تدليك محمولة ومناشف وزيوت وجميع المعدات اللازمة لإنشاء جو سبا في منزلك.' },
        { q: 'كم تستغرق جلسة السبا النموذجية؟', a: 'تتراوح الجلسات من 60 دقيقة للتدليك العادي إلى 120 دقيقة لحزمة السبا الكاملة. يمكنك تخصيص المدة حسب تفضيلك.' },
        { q: 'هل يمكنني حجز خدمة سبا لمناسبة خاصة؟', a: 'بالتأكيد! نقدم حزم للمناسبات الخاصة بما في ذلك تدليك الزوجين وسبا العروس وتجربة سبا عيد الميلاد.' },
      ],
      seoTitle: 'Women\'s Spa & Massage at Home in Dubai — ServicePlus',
      seoDescription: 'Book professional spa and massage services at home in Dubai & UAE. Swedish, deep tissue, aromatherapy & more. Certified therapists, premium products.',
      isActive: true,
      sortOrder: 4,
    },
  });

  const catFurnitureCleaning = await prisma.serviceCategory.upsert({
    where: { slug: 'furniture-cleaning' },
    update: {},
    create: {
      name: 'Furniture Cleaning',
      nameAr: 'تنظيف الأثاث',
      slug: 'furniture-cleaning',
      icon: 'Armchair',
      imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80',
      description: 'Deep cleaning for sofas, chairs, and all upholstery.',
      descriptionAr: 'تنظيف عميق للأرائك والكراسي والمفروشات.',
      intro: 'Restore your furniture to its original freshness with ServicePlus furniture cleaning service. Our professionals use advanced hot-water extraction and steam cleaning techniques to remove stains, allergens, and deep-seated dirt from sofas, chairs, mattresses, and curtains.\n\nWhether you have fabric, leather, or suede furniture, our trained technicians use the appropriate cleaning method for each material. We serve all areas in Dubai, Abu Dhabi, Sharjah, and Ajman.',
      introAr: 'استعد أثاثك إلى عبقه الأصلي مع خدمة تنظيف الأثاث من سيرفس بلس. يستخدم محترفونا تقنيات متقدمة لاستخراج الماء الساخن والتنظيف بالبخار لإزالة البقخ والمواد المسببة للحساسية والأوساخ العميقة من الأرائك والكراسي والمراتب والستائر.\n\nسواء كان لديك أثاث من القماش أو الجلد أو السuede، يستخدم فناؤنا المدربون طريقة التنظيف المناسبة لكل مادة. نخدم جميع مناطق دبي وأبوظبي والشارقة وعجمان.',
      sections: [
        {
          title: 'What is Furniture Cleaning?',
          body: 'Furniture cleaning is a professional deep-cleaning service for sofas, armchairs, dining chairs, mattresses, and upholstered headboards. We use hot-water extraction, steam cleaning, and dry-cleaning techniques depending on the fabric type.',
        },
        {
          title: 'Why Choose ServicePlus Furniture Cleaning?',
          body: 'Our technicians are trained to handle all types of upholstery including fabric, leather, suede, and velvet. We use eco-friendly, non-toxic cleaning solutions that are safe for children and pets.\n\nRegular furniture cleaning extends the life of your furniture, improves indoor air quality, and removes up to 99% of dust mites and allergens.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هو تنظيف الأثاث؟',
          body: 'تنظيف الأثاث هو خدمة تنظيف احترافية عميقة للأرائك والكراسي وكراسي الطعام والمراتب واللحف الخشبية المفروشة. نستخدم تقنيات استخراج الماء الساخن والتنظيف بالبخار والتنظيف الجاف حسب نوع القماش.',
        },
        {
          title: 'لماذا تختار تنظيف الأثاث من سيرفس بلس؟',
          body: 'فنيونا مدربون على التعامل مع جميع أنواع المفروشات بما في ذلك القماش والجلد والسويد والمخمل. نستخدم محلولات تنظيف صديقة للبيئة وغير سامة آمنة على الأطفال والحيوانات الأليفة.\n\nالتنظيف الدوري للأثاث يمديد عمر أثاثك ويحسّن جودة الهواء الداخلي ويإزالة ما يصل إلى 99% من حشراتBed dust والمواد المسببة للحساسية.',
        },
      ],
      faqs: [
        { q: 'What types of furniture can you clean?', a: 'We clean sofas, armchairs, dining chairs, mattresses, ottomans, upholstered headboards, and car seats. We handle fabric, leather, suede, and velvet.' },
        { q: 'How long does furniture cleaning take?', a: 'A standard sofa cleaning takes 60-90 minutes. Drying time is 4-6 hours depending on ventilation and weather conditions.' },
        { q: 'Are your cleaning products safe for pets?', a: 'Yes, all our cleaning solutions are eco-friendly, non-toxic, and safe for children and pets.' },
        { q: 'Can you remove old stains?', a: 'We have a high success rate with stain removal. However, very old or set-in stains may not be completely removable. Our technician will assess the stain before cleaning.' },
      ],
      faqsAr: [
        { q: 'ما هي أنواع الأثاث التي يمكن تنظيفها؟', a: 'نقوم بتنظيف الأرائك والكراسي وكراسي الطعام والمراتب والأوتومان والحف الخشبية المفروشة ومقاعد السيارات. نتعامل مع القماش والجلد والسويد والمخمل.' },
        { q: 'كم يستغرق تنظيف الأثاث؟', a: 'يستغرق تنظيف الأريكة العادي 60-90 دقيقة. وقت التجفيف 4-6 ساعات حسب التهوية والظروف الجوية.' },
        { q: 'هل منتجات التنظيف آمنة على الحيوانات الأليفة؟', a: 'نعم، جميع محلولات التنظيف لدينا صديقة للبيئة وغير سامة وآمنة على الأطفال والحيوانات الأليفة.' },
        { q: 'هل يمكنكم إزالة البقخ القديمة؟', a: 'لدينا نسبة نجاح عالية في إزالة البقخ. ومع ذلك، قد لا يمكن إزالة البقخ القديمة جدًا بالكامل. سيقيّم الفني البقخ قبل التنظيف.' },
      ],
      seoTitle: 'Furniture & Sofa Cleaning Services in Dubai — ServicePlus',
      seoDescription: 'Professional furniture and sofa cleaning in Dubai & UAE. Fabric, leather & suede cleaning. Remove stains, allergens & dust mites. Book online.',
      isActive: true,
      sortOrder: 5,
    },
  });

  const catAcCleaning = await prisma.serviceCategory.upsert({
    where: { slug: 'ac-cleaning' },
    update: {},
    create: {
      name: 'A/C Cleaning',
      nameAr: 'تنظيف المكيفات',
      slug: 'ac-cleaning',
      icon: 'Wind',
      imageUrl: 'https://images.unsplash.com/photo-1631545806609-213a3e8c05cf?w=600&q=80',
      description: 'Professional AC servicing, cleaning, and maintenance.',
      descriptionAr: 'خدمة تنظيف وصيانة المكيفات الاحترافية.',
      intro: 'Keep your air conditioning system running efficiently with ServicePlus AC cleaning service. Our certified HVAC technicians provide thorough cleaning and maintenance for split AC units, window units, and central air systems.\n\nRegular AC cleaning improves air quality, reduces energy consumption, extends the lifespan of your unit, and prevents costly breakdowns. We serve all areas in Dubai, Abu Dhabi, Sharjah, and Ajman.',
      introAr: 'حافظ على كفاءة نظام التكييف الهوائي مع خدمة تنظيف المكيفات من سيرفس بلس. يوفر فنيو HVAC المعتمدون تنظيفًا وصيانة شاملة لوحدات التكييف المنفصلة والنوافذية والأنظمة المركزية.\n\nتنظيف المكيفات الدوري يحسّن جودة الهواء ويقلل استهلاك الطاقة ويمديد عمر وحدتك ويمنع الأعطال الباهظة. نخدم جميع مناطق دبي وأبوظبي والشارقة وعجمان.',
      sections: [
        {
          title: 'What is A/C Cleaning?',
          body: 'A/C cleaning is a professional service that involves deep cleaning of your air conditioning unit including filters, coils, fins, and drainage system. This improves efficiency, air quality, and extends the lifespan of your AC system.',
        },
        {
          title: 'Why Choose ServicePlus for AC Cleaning?',
          body: 'Our technicians are certified HVAC professionals with experience in all major AC brands. We use specialised cleaning agents and high-pressure washing equipment to thoroughly clean every component.\n\nRegular AC maintenance can reduce energy bills by up to 15% and prevent unexpected breakdowns during Dubai\'s hot summers.',
        },
        {
          title: 'How to Book AC Cleaning',
          body: 'Select the AC cleaning service, specify the number and type of units, choose a date and time, and confirm your address. Our technician will arrive with all necessary tools and equipment.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هو تنظيف المكيفات؟',
          body: 'تنظيف المكيفات هو خدمة احترافية تشمل التنظيف العميق لوحدة التكييف بما في ذلك الفلاتر والملفات والمراوح ونظام الصرف. هذا يحسّن الكفاءة وجودة الهواء ويمديد عمر نظام التكييف.',
        },
        {
          title: 'لماذا تختار سيرفس بلس لتنظيف المكيفات؟',
          body: 'فنيونا معتمدون في HVAC مع خبرة في جميع العلامات التجارية الرئيسية للمكيفات. نستخدم عوامل تنظيف متخصصة ومعدات غسيل الضغط العالي لتنظيف كل مكون بعمق.\n\nصيانة المكيفات الدوري يمكن أن تقلل فواتير الطاقة بنسبة تصل إلى 15% وتمنع الأعطال غير المتوقعة خلال صيف دبي الحار.',
        },
        {
          title: 'كيفية حجز تنظيف المكيفات',
          body: 'اختر خدمة تنظيف المكيفات، وحدد عدد ونوع الوحدات، وحدد التاريخ والوقت، وأكد عنوانك. سيصل الفني بجميع الأدوات والمعدات اللازمة.',
        },
      ],
      faqs: [
        { q: 'How often should I clean my AC?', a: 'We recommend AC cleaning every 3-6 months in Dubai due to high dust levels. For optimal performance, schedule cleaning before summer and mid-season.' },
        { q: 'How long does AC cleaning take?', a: 'A standard split AC cleaning takes 60-90 minutes per unit. Central air system cleaning may take 2-4 hours.' },
        { q: 'Does AC cleaning improve cooling?', a: 'Yes, a clean AC unit cools more efficiently. Cleaning removes dust and buildup that restrict airflow and reduce cooling performance.' },
        { q: 'Do you offer AC repair as well?', a: 'Our primary service is AC cleaning and maintenance. For repairs, we can recommend trusted HVAC partners in your area.' },
      ],
      faqsAr: [
        { q: 'كم مرة يجب تنظيف المكيف؟', a: 'نوصي بتنظيف المكيف كل 3-6 أشهر في دبي بسبب مستويات الغبار العالية. للأفضل أداء، جدول التنظيف قبل الصيف ومنتصف الموسم.' },
        { q: 'كم يستغرق تنظيف المكيف؟', a: 'يستغرق تنظيف التكييف المنفصل العادي 60-90 دقيقة لكل وحدة. قد يستغرق تنظيف النظام المركزي 2-4 ساعات.' },
        { q: 'هل يحسّن التنظيف تبريد المكيف؟', a: 'نعم، وحدة التكييف النظيفة تبرد بكفاءة أكبر. يزيل التنظيف الغبار والترسبات التي تعيق تدفق الهواء وتقلل أداء التبريد.' },
        { q: 'هل تقدمون إصلاح المكيفات أيضًا؟', a: 'خدمتنا الرئيسية هي تنظيف وصيانة المكيفات. للإصلاحات، يمكننا التوصية بشركاء HVAC موثوقين في منطقتك.' },
      ],
      seoTitle: 'A/C Cleaning & Maintenance Services in Dubai — ServicePlus',
      seoDescription: 'Professional AC cleaning and maintenance in Dubai & UAE. Split, window & central AC servicing. Improve efficiency, reduce energy bills. Book now.',
      isActive: true,
      sortOrder: 6,
    },
  });

  const catMensGrooming = await prisma.serviceCategory.upsert({
    where: { slug: 'mens-grooming' },
    update: {},
    create: {
      name: "Premium Men's Grooming",
      nameAr: 'عناية رجالية مميزة',
      slug: 'mens-grooming',
      icon: 'User',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
      description: 'Premium grooming, haircut, and styling services for men.',
      descriptionAr: 'خدمات حلاقة وعناية رجالية مميزة.',
      intro: 'Look your best with ServicePlus premium men\'s grooming service. Our expert barbers and grooming professionals come to your home, offering classic and modern haircuts, beard trimming and shaping, hot towel shaves, facials, and men\'s spa treatments.\n\nAll grooming professionals are trained in the latest men\'s styling trends and use premium grooming products. Enjoy a barbershop-quality experience in the comfort of your own space.',
      introAr: 'ابحث بأفضل مظهرك مع خدمة العناية الرجالية المميزة من سيرفس بلس. يأتي الحلاقون والمحترفون المتخصصون إلى منزلك، مقدمين قصات شعر كلاسيكية وعصرية وتقليم ولحية وتشكيل وحلاقة المنشفة الساخنة والوجه وعلاجات السبا الرجالية.\n\nجميع متخصصي العناية مدربون على أحدث صيحات الأناقة الرجالية ويستخدمون منتجات عناية فاخرة. استمتع بتجربة حلاقة بجودة الصالون في راحة مكانك الخاص.',
      sections: [
        {
          title: 'What is Premium Men\'s Grooming?',
          body: 'Premium men\'s grooming is a comprehensive personal care service that includes classic and modern haircuts, beard grooming, hot towel shaves, men\'s facials, hair treatments, and spa services. Our professionals bring the barbershop experience to your home.',
        },
        {
          title: 'Why Choose ServicePlus Grooming?',
          body: 'Our barbers are trained in international grooming standards and stay updated with the latest trends. We use premium brands and professional-grade tools for every service.\n\nWith same-day availability and transparent pricing, ServicePlus grooming is the convenient alternative to traditional barbershops.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هي العناية الرجالية المميزة؟',
          body: 'العناية الرجالية المميزة هي خدمة رعاية شخصية شاملة تشمل قصات الشعر الكلاسيكية والعصرية وعناية اللحية وحلاقة المنشفة الساخنة ووجه الرجال وعلاجات الشعر وخدمات السبا. يجلب محترفونا تجربة الحلاقة إلى منزلك.',
        },
        {
          title: 'لماذا تختار العناية من سيرفس بلس؟',
          body: 'حلاقونا مدربون على معايير العناية الدولية ويحدّثون أنفسهم بأحدث الصيحات. نستخدم علامات تجارية فاخرة وأدوات من الدرجة المهنية لكل خدمة.\n\nمع التوفر في نفس اليوم والأسعار الشفافة، تُعد عناية سيرفس بلس البديل المريح لصالونات الحلاقة التقليدية.',
        },
      ],
      faqs: [
        { q: 'What grooming services are available?', a: 'We offer classic haircuts, modern styles, beard trimming and shaping, hot towel shaves, men\'s facials, hair treatments, and men\'s spa services.' },
        { q: 'Do barbers bring their own tools?', a: 'Yes, our barbers come fully equipped with professional-grade tools, clippers, scissors, and premium grooming products.' },
        { q: 'Can I request a specific barber?', a: 'Yes, you can request a preferred barber based on availability. We will do our best to accommodate your request.' },
        { q: 'How long does a grooming session take?', a: 'A standard haircut takes 30-45 minutes. A full grooming session with beard and shave takes 60-90 minutes.' },
      ],
      faqsAr: [
        { q: 'ما هي خدمات العناية المتاحة؟', a: 'نقدم قصات الشعر الكلاسيكية والعصرية وتقليم وتشكيل اللحية وحلاقة المنشفة الساخنة ووجه الرجال وعلاجات الشعر وخدمات السبا الرجالية.' },
        { q: 'هل يأتي الحلاقون بأدواتهم الخاصة؟', a: 'نعم، يأتي حلاقونا مجهّزين بالكامل بأدوات من الدرجة المهنية ومكائن الحلاقة والمقصات ومنتجات العناية الفاخرة.' },
        { q: 'هل يمكنني طلب حلاق محدد؟', a: 'نعم، يمكنك طلب حلاق مفضل حسب التوفر. سنحاول قدر الإمكان تلبية طلبك.' },
        { q: 'كم تستغرق جلسة العناية؟', a: 'تستغرق قص الشعر العادية 30-45 دقيقة. تستغرق جلسة العناية الكاملة مع اللحية والحلاقة 60-90 دقيقة.' },
      ],
      seoTitle: 'Premium Men\'s Grooming & Barber Services in Dubai — ServicePlus',
      seoDescription: 'Book professional men\'s grooming at home in Dubai & UAE. Haircuts, beard trimming, hot towel shaves & more. Expert barbers, premium products.',
      isActive: true,
      sortOrder: 7,
    },
  });

  const catLabAtHome = await prisma.serviceCategory.upsert({
    where: { slug: 'lab-at-home' },
    update: {},
    create: {
      name: 'Lab at Home',
      nameAr: 'فحص مخبري في المنزل',
      slug: 'lab-at-home',
      icon: 'TestTube',
      imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&q=80',
      description: 'Lab tests and sample collection at your doorstep.',
      descriptionAr: 'فحوصات مخبرية وجمع عينات في منزلك.',
      intro: 'Skip the lab queues and get your blood tests, urine tests, and other diagnostic samples collected from the comfort of your home. ServicePlus partners with accredited laboratories to provide professional sample collection with results delivered digitally.\n\nOur certified phlebotomists follow strict hygiene protocols and use sterile, single-use equipment. Available across Dubai, Abu Dhabi, Sharjah, and Ajman.',
      introAr: 'تخطَّ طوابير المختبر واحصل على تحاليل الدم والبول والعينات التشخيصية الأخرى من راحة منزلك. تعاون سيرفس بلس مع مختبرات معتمدة لتقديم جمع عينات احترافي مع نتائج تُقدم إلكترونياً.\n\nأخصائيو السحب المعتمدون لدينا يتبعون بروتوكولات نظافة صارمة ويستخدمون معدات تعقيم مفردة. متاح في دبي وأبوظبي والشارقة وعجمان.',
      sections: [
        {
          title: 'What is Lab at Home?',
          body: 'Lab at Home is a service where a certified phlebotomist or lab technician visits your home to collect blood, urine, or other diagnostic samples. The samples are processed at accredited laboratories and results are delivered digitally.',
        },
        {
          title: 'Why Choose ServicePlus Lab at Home?',
          body: 'Our phlebotomists are DHA-certified and trained in proper sample collection techniques. We partner with internationally accredited laboratories for accurate and reliable results.\n\nNo more waiting in crowded labs or taking time off work. Get your tests done at your convenience with results available within 24-72 hours.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هو الفحص المخبري في المنزل؟',
          body: 'الفحص المخبري في المنزل هو خدمة يزور فيها فني مخبري معتمد منزلك لجمع عينات الدم أو البول أو العينات التشخيصية الأخرى. تُعالج العينات في مختبرات معتمدة وتُقدم النتائج إلكترونياً.',
        },
        {
          title: 'لماذا تختار الفحص المخبري في المنزل من سيرفس بلس؟',
          body: 'أخصائيو السحب لدينا معتمدون من هيئة دبي للصحة ومدربون على تقنيات جمع العينات الصحيحة. نتعاون مع مختبرات معتمدة دوليًا لنتائج دقيقة وموثوقة.\n\nلا مزيد من الانتظار في مختبرات مزدحمة أو أخذ إجازة من العمل. احصل على فحوصاتك في وقتك المتاح مع نتائج متاحة خلال 24-72 ساعة.',
        },
      ],
      faqs: [
        { q: 'What tests can be collected at home?', a: 'We offer blood tests (CBC, thyroid, diabetes, cholesterol), urine tests, hormone panels, vitamin levels, allergy tests, and many more diagnostic tests.' },
        { q: 'Do I need to fast before blood tests?', a: 'It depends on the test. Fasting is required for glucose, cholesterol, and lipid panels (8-12 hours). Our team will inform you of any preparation needed.' },
        { q: 'When will I receive my results?', a: 'Most results are delivered within 24-72 hours via email and SMS. Complex tests may take up to 5-7 days.' },
        { q: 'Are your labs accredited?', a: 'Yes, we partner with DHA and MOH-approved laboratories that are internationally accredited for accuracy and reliability.' },
      ],
      faqsAr: [
        { q: 'ما هي الفحوصات التي يمكن جمعها في المنزل؟', a: 'نقدم تحاليل الدم (CBC، الغدة الدرقية، السكري، الكولسترول) والبول والهرمونات ومستويات الفيتامينات والحساسية والمزيد من الفحوصات التشخيصية.' },
        { q: 'هل أحتاج للصيام قبل تحاليل الدم؟', a: 'يعتمد على الفحص. الصيام مطلوب لفحص الجلوكوز والكولسترول والدهون (8-12 ساعة). ستجدون فريقنا يبلغك بأي تحضيرات مطلوبة.' },
        { q: 'متى سأحصل على نتائجي؟', a: 'تُقدم معظم النتائج خلال 24-72 ساعة عبر البريد الإلكتروني والرسائل النصية. قد تستغرق الفحوصات المعقدة حتى 5-7 أيام.' },
        { q: 'هل مختبراتكم معتمدة؟', a: 'نعم، نتعاون مع مختبرات معتمدة من هيئة دبي للصحة ووزارة الصحة ومعتمدة دوليًا للدقة والموثوقية.' },
      ],
      seoTitle: 'Lab Tests at Home in Dubai & UAE — ServicePlus',
      seoDescription: 'Book lab tests and blood collection at home in Dubai & UAE. DHA-certified phlebotomists, accredited labs, results in 24-72 hours.',
      isActive: true,
      sortOrder: 8,
    },
  });

  const catPestControl = await prisma.serviceCategory.upsert({
    where: { slug: 'pest-control' },
    update: {},
    create: {
      name: 'Pest Control',
      nameAr: 'مكافحة الحشرات',
      slug: 'pest-control',
      icon: 'Bug',
      imageUrl: 'https://images.unsplash.com/photo-1611250188496-e966043a0629?w=600&q=80',
      description: 'Effective pest control and extermination services.',
      descriptionAr: 'خدمات مكافحة الحشرات الفعالة.',
      intro: 'Protect your home and family from unwanted pests with ServicePlus pest control service. Our certified technicians provide effective treatments for cockroaches, ants, termites, bed bugs, mosquitoes, rodents, and other common household pests.\n\nWe use safe, government-approved pesticides and integrated pest management techniques that are effective yet safe for children and pets. Serving all areas in Dubai, Abu Dhabi, Sharjah, and Ajman.',
      introAr: 'حمي منزلك وعائلتك من الحشرات غير المرغوب فيها مع خدمة مكافحة الحشرات من سيرفس بلس. يوفر فنيونا المعتمدون علاجات فعالة للصراصير والنمل وحشرات الخشب وحشرات الفراش والبعوض والقوارض والحشرات الشائعة الأخرى في المنازل.\n\nنستخدم مبيدات آمنة معتمدة من الحكومة وتقنيات مكافحة الحشرات المتكاملة الفعالة وآمنة على الأطفال والحيوانات الأليفة. نخدم جميع مناطق دبي وأبوظبي والشارقة وعجمان.',
      sections: [
        {
          title: 'What is Pest Control?',
          body: 'Pest control is the management and elimination of unwanted insects, rodents, and other pests from your home or business. Our service includes inspection, treatment, and prevention to keep your space pest-free.',
        },
        {
          title: 'Why Choose ServicePlus for Pest Control?',
          body: 'Our technicians are licensed and trained in the latest pest control methods. We use eco-friendly, government-approved products that are effective against pests yet safe for your family.\n\nWe offer both one-time treatments and regular maintenance plans to keep your home protected year-round.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هي مكافحة الحشرات؟',
          body: 'مكافحة الحشرات هي إدارة والقضاء على الحشرات غير المرغوب فيها والقوارض والآفات الأخرى من منزلك أو عملك. تشمل خدمتنا الفحص والعلاج وال预防 لإبقاء مكانك خالياً من الآفات.',
        },
        {
          title: 'لماذا تختار سيرفس بلس لمكافحة الحشرات؟',
          body: 'فنيونا مرخصون ومدربون على أحدث طرق مكافحة الحشرات. نستخدم منتجات صديقة للبيئة ومعتمدة من الحكومة فعالة ضد الحشرات وآمنة لعائلتك.\n\nنقدم علاجات لمرة واحدة وخطط صيانة منتظمة لإبقاء منزلك محميًا على مدار العام.',
        },
      ],
      faqs: [
        { q: 'What pests do you treat?', a: 'We treat cockroaches, ants, termites, bed bugs, mosquitoes, flies, spiders, rodents (rats and mice), and other common household pests.' },
        { q: 'Are your treatments safe for children and pets?', a: 'Yes, we use government-approved products that are safe for your family. We recommend ventilating the treated area for 2-3 hours after treatment.' },
        { q: 'How long does a pest control treatment take?', a: 'A standard treatment takes 60-120 minutes depending on the size of the property and type of pest.' },
        { q: 'How often should I get pest control?', a: 'For general prevention, we recommend quarterly treatments. For active infestations, more frequent visits may be needed until the problem is resolved.' },
        { q: 'Do you offer a guarantee?', a: 'Yes, we offer a satisfaction guarantee. If pests return within the guarantee period, we will re-treat at no additional cost.' },
      ],
      faqsAr: [
        { q: 'ما هي الآفات التي تعالجونها؟', a: 'نعالج الصراصير والنمل وال termite وحشرات الفراش والبعوض والذباب والعناكب والقوارض (الفئران) والآفات الشائعة الأخرى في المنازل.' },
        { q: 'هل علاجاتكم آمنة على الأطفال والحيوانات الأليفة؟', a: 'نعم، نستخدم منتجات معتمدة من الحكومة آمنة لعائلتك. نوصي بتهوية المعالجة لمدة 2-3 ساعات بعد العلاج.' },
        { q: 'كم يستغرق علاج مكافحة الحشرات؟', a: 'تستغرق العلاجات العادية 60-120 دقيقة حسب حجم الممتلكات ونوع الآفة.' },
        { q: 'كم مرة يجب أن أحصل على مكافحة الحشرات؟', a: 'لل prevention العامة، نوصي بعلاجات ربع سنوية. للإصابات النشطة، قد تكون زيارات أكثر تكرارًا حتى حل المشكلة.' },
        { q: 'هل تقدمون ضمانًا؟', a: 'نعم، نقدم ضمان رضا العملاء. إذا عادت الحشرات خلال فترة الضمان، سنعيد العلاج دون تكلفة إضافية.' },
      ],
      seoTitle: 'Pest Control Services in Dubai & UAE — ServicePlus',
      seoDescription: 'Professional pest control in Dubai & UAE. Cockroaches, termites, bed bugs, rodents & more. Safe, government-approved treatments. Book online.',
      isActive: true,
      sortOrder: 9,
    },
  });

  const catDisinfection = await prisma.serviceCategory.upsert({
    where: { slug: 'disinfection' },
    update: {},
    create: {
      name: 'Disinfection',
      nameAr: 'تعقيم',
      slug: 'disinfection',
      icon: 'ShieldCheck',
      imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80',
      description: 'Complete home and office disinfection and sanitisation.',
      descriptionAr: 'تعقيم وتطهير شامل للمنازل والمكاتب.',
      intro: 'Keep your home and office safe with ServicePlus disinfection service. Our certified technicians use hospital-grade disinfectants and advanced fogging equipment to eliminate 99.9% of bacteria, viruses, and germs from your space.\n\nIdeal for post-illness sanitisation, move-in/new home treatment, or regular maintenance. We use WHO-recommended products that are safe for surfaces yet effective against pathogens. Available across Dubai, Abu Dhabi, Sharjah, and Ajman.',
      introAr: 'حافظ على سلامة منزلك وعملك مع خدمة التعقيم من سيرفس بلس. يستخدم فنيونا المعتمدون مبيدات جراثيم من الدرجة المستشفى ومعدات رش متقدمة للقضاء على 99.9% من البكتيريا والفيروسات والجراثيم من مكانك.\n\nمثالي لتعقيم ما بعد المرض أو علاج المنزل الجديد أو الصيانة المنتظمة. نستخدم منتجات منظمة الصحة العالمية آمنة على الأسطح وفعالة ضد الممرضات. متاح في دبي وأبوظبي والشارقة وعجمان.',
      sections: [
        {
          title: 'What is Disinfection Service?',
          body: 'Disinfection service involves the application of hospital-grade disinfectants to eliminate bacteria, viruses, and other pathogens from your home or office. This includes surface spraying, fogging, and targeted treatment of high-touch areas.',
        },
        {
          title: 'Why Choose ServicePlus Disinfection?',
          body: 'Our technicians use WHO-recommended disinfectants that are proven effective against a wide range of pathogens including coronaviruses. We use ULV fogging machines for comprehensive coverage.\n\nAll our products are safe for most surfaces including furniture, electronics, and fabrics when applied correctly.',
        },
      ],
      sectionsAr: [
        {
          title: 'ما هي خدمة التعقيم؟',
          body: 'تشمل خدمة التعقيم تطبيق مبيدات جراثيم من الدرجة المستشفى للقضاء على البكتيريا والفيروسات والجراثيم الممرضات الأخرى من منزلك أو عملك. يشمل ذلك رش الأسطح والرش الضبابي والعلاج المركز للمناطق عالية اللمس.',
        },
        {
          title: 'لماذا تختار التعقيم من سيرفس بلس؟',
          body: 'يستخدم فنيونا مبيدات جراثيم منظمة الصحة العالمية المثبتة فعاليتها ضد مجموعة واسعة من الممرضات بما في ذلك كورونافيرس. نستخدم آلات رش ULV لتغطية شاملة.\n\nجميع منتجاتنا آمنة على معظم الأسطح بما في ذلك الأثاث والإلكترونيات والأقمشة عند التطبيق بشكل صحيح.',
        },
      ],
      faqs: [
        { q: 'How long does disinfection take?', a: 'A standard home disinfection takes 60-120 minutes. The area should be ventilated for 2-3 hours after treatment before re-entering.' },
        { q: 'Is the disinfection safe for children and pets?', a: 'Yes, our disinfectants are WHO-approved and safe once dry. We recommend keeping children and pets away during the treatment and for 2-3 hours after.' },
        { q: 'How often should I get my home disinfected?', a: 'For general maintenance, we recommend monthly or quarterly disinfection. After illness, we recommend immediate disinfection. For offices, weekly or bi-weekly is ideal.' },
        { q: 'Do you provide a certificate after disinfection?', a: 'Yes, we provide an official disinfection certificate that can be used for workplace compliance and official purposes.' },
        { q: 'What areas do you cover?', a: 'We cover all areas in Dubai, Abu Dhabi, Sharjah, and Ajman. Our professionals can disinfect homes, offices, shops, warehouses, and other commercial spaces.' },
      ],
      faqsAr: [
        { q: 'كم يستغرق التعقيم؟', a: 'تستغرق تعقيم المنزل العادي 60-120 دقيقة. يجب تهوية المنطقة لمدة 2-3 ساعات بعد العلاج قبل إعادة الدخول.' },
        { q: 'هل التعقيم آمن على الأطفال والحيوانات الأليفة؟', a: 'نعم، مبيدات الجراثيم المعتمدة من منظمة الصحة العالمية آمنة عند الجفاف. نوصي بإبقاء الأطفال والحيوانات بعيدًا أثناء العلاج و2-3 ساعات بعده.' },
        { q: 'كم مرة يجب تعقيم المنزل؟', a: 'للصيانة العامة، نوصي بالتعقيم الشهري أو ربع السنوي. بعد المرض، نوصي بالتعقيم الفوري. للمكاتب، الأسبوعي أو كل أسبوعين مثالي.' },
        { q: 'هل تقدمون شهادة بعد التعقيم؟', a: 'نعم، نقدم شهادة تعقيم رسمية يمكن استخدامها للتوافق في مكان العمل والأغراض الرسمية.' },
        { q: 'ما هي المناطق التي تغطونها؟', a: 'نغطي جميع مناطق دبي وأبوظبي والشارقة وعجمان. يمكن لمحترفينا تعقيم المنازل والمكاتب والمتاجر والمستودعات والأماكن التجارية الأخرى.' },
      ],
      seoTitle: 'Home & Office Disinfection Services in Dubai — ServicePlus',
      seoDescription: 'Professional home and office disinfection in Dubai & UAE. Hospital-grade disinfectants, WHO-approved products. 99.9% germ elimination. Book now.',
      isActive: true,
      sortOrder: 10,
    },
  });

  const svcDeepClean = await prisma.service.upsert({
    where: { slug: 'deep-cleaning' },
    update: {},
    create: {
      name: 'Deep Cleaning',
      slug: 'deep-cleaning',
      categoryId: catCleaning.id,
      shortDescription: 'Thorough deep cleaning of your entire home.',
      description:
        'Our deep cleaning service covers every corner of your home, including kitchens, bathrooms, living areas, and bedrooms. We use eco-friendly products and professional equipment.',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
      icon: 'Sparkles',
      bookingType: 'fixed',
      basePrice: 299,
      originalPrice: 399,
      materialsPrice: 0,
      extraProfessionalPct: 30,
      durationMinutes: 180,
      rating: 4.8,
      reviewCount: 342,
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
    },
  });

  const svcRegularClean = await prisma.service.upsert({
    where: { slug: 'regular-cleaning' },
    update: {},
    create: {
      name: 'Regular Cleaning',
      slug: 'regular-cleaning',
      categoryId: catCleaning.id,
      shortDescription: 'Weekly or bi-weekly home cleaning service.',
      imageUrl: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80',
      icon: 'Home',
      bookingType: 'hourly',
      basePrice: 50,
      hourlyRate: 50,
      materialsPrice: 15,
      extraProfessionalPct: 40,
      minHours: 2,
      maxHours: 8,
      durationMinutes: 60,
      rating: 4.7,
      reviewCount: 518,
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
    },
  });

  const svcFurnitureCleaning = await prisma.service.upsert({
    where: { slug: 'furniture-deep-cleaning' },
    update: {},
    create: {
      name: 'Furniture Deep Cleaning',
      slug: 'furniture-deep-cleaning',
      categoryId: catFurnitureCleaning.id,
      shortDescription: 'Professional deep cleaning for all furniture types.',
      imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80',
      icon: 'Armchair',
      bookingType: 'variant',
      basePrice: 0,
      materialsPrice: 0,
      durationMinutes: 120,
      rating: 4.7,
      reviewCount: 231,
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
    },
  });

  const svcAcCleaning = await prisma.service.upsert({
    where: { slug: 'ac-deep-cleaning' },
    update: {},
    create: {
      name: 'A/C Deep Cleaning',
      slug: 'ac-deep-cleaning',
      categoryId: catAcCleaning.id,
      shortDescription: 'Professional AC cleaning and maintenance service.',
      imageUrl: 'https://images.unsplash.com/photo-1631545806609-213a3e8c05cf?w=600&q=80',
      icon: 'Wind',
      bookingType: 'fixed',
      basePrice: 199,
      originalPrice: 250,
      materialsPrice: 30,
      durationMinutes: 90,
      rating: 4.8,
      reviewCount: 178,
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
    },
  });

  const svcPestControl = await prisma.service.upsert({
    where: { slug: 'general-pest-control' },
    update: {},
    create: {
      name: 'General Pest Control',
      slug: 'general-pest-control',
      categoryId: catPestControl.id,
      shortDescription: 'Effective pest control for cockroaches, ants, and more.',
      imageUrl: 'https://images.unsplash.com/photo-1611250188496-e966043a0629?w=600&q=80',
      icon: 'Bug',
      bookingType: 'fixed',
      basePrice: 249,
      materialsPrice: 50,
      durationMinutes: 120,
      rating: 4.6,
      reviewCount: 95,
      isActive: true,
      sortOrder: 1,
    },
  });

  const svcDisinfection = await prisma.service.upsert({
    where: { slug: 'home-disinfection' },
    update: {},
    create: {
      name: 'Home Disinfection',
      slug: 'home-disinfection',
      categoryId: catDisinfection.id,
      shortDescription: 'Complete home sanitisation and disinfection treatment.',
      imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80',
      icon: 'ShieldCheck',
      bookingType: 'fixed',
      basePrice: 349,
      originalPrice: 449,
      materialsPrice: 0,
      durationMinutes: 150,
      rating: 4.9,
      reviewCount: 203,
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.serviceListing.createMany({
    data: [
      { categoryId: catCleaning.id, serviceId: svcDeepClean.id, sortOrder: 1 },
      { categoryId: catCleaning.id, serviceId: svcRegularClean.id, sortOrder: 2 },
      { categoryId: catFurnitureCleaning.id, serviceId: svcFurnitureCleaning.id, sortOrder: 1 },
      { categoryId: catFurnitureCleaning.id, serviceId: svcSofaCleaning.id, sortOrder: 2 },
      { categoryId: catFurnitureCleaning.id, serviceId: svcCarpetCleaning.id, sortOrder: 3 },
      { categoryId: catFurnitureCleaning.id, serviceId: svcMattressCleaning.id, sortOrder: 4 },
      { categoryId: catFurnitureCleaning.id, serviceId: svcCurtainCleaning.id, sortOrder: 5 },
      { categoryId: catAcCleaning.id, serviceId: svcAcCleaning.id, sortOrder: 1 },
      { categoryId: catPestControl.id, serviceId: svcPestControl.id, sortOrder: 1 },
      { categoryId: catDisinfection.id, serviceId: svcDisinfection.id, sortOrder: 1 },
    ],
    skipDuplicates: true,
  });

  // Service relations for related services
  await prisma.serviceRelation.createMany({
    data: [
      // Furniture cleaning related
      { serviceId: svcFurnitureCleaning.id, relatedServiceId: svcSofaCleaning.id },
      { serviceId: svcFurnitureCleaning.id, relatedServiceId: svcCarpetCleaning.id },
      { serviceId: svcFurnitureCleaning.id, relatedServiceId: svcMattressCleaning.id },
      { serviceId: svcFurnitureCleaning.id, relatedServiceId: svcCurtainCleaning.id },
      { serviceId: svcSofaCleaning.id, relatedServiceId: svcCarpetCleaning.id },
      { serviceId: svcSofaCleaning.id, relatedServiceId: svcMattressCleaning.id },
      { serviceId: svcCarpetCleaning.id, relatedServiceId: svcMattressCleaning.id },
      // Home cleaning related
      { serviceId: svcDeepClean.id, relatedServiceId: svcRegularClean.id },
      { serviceId: svcDeepClean.id, relatedServiceId: svcAcCleaning.id },
      { serviceId: svcDeepClean.id, relatedServiceId: svcFurnitureCleaning.id },
      { serviceId: svcRegularClean.id, relatedServiceId: svcDeepClean.id },
      { serviceId: svcRegularClean.id, relatedServiceId: svcAcCleaning.id },
      // AC cleaning related
      { serviceId: svcAcCleaning.id, relatedServiceId: svcDeepClean.id },
      { serviceId: svcAcCleaning.id, relatedServiceId: svcDisinfection.id },
      // Pest control related
      { serviceId: svcPestControl.id, relatedServiceId: svcDisinfection.id },
    ],
    skipDuplicates: true,
  });

  const svcSofaCleaning = await prisma.service.upsert({
    where: { slug: 'sofa-cleaning' },
    update: {},
    create: {
      name: 'Sofa Cleaning',
      slug: 'sofa-cleaning',
      categoryId: catFurnitureCleaning.id,
      shortDescription: 'Professional sofa cleaning for every size and style, at home.',
      description: 'Professional sofa cleaning service using hot-water extraction and steam cleaning techniques. Suitable for fabric, leather, and suede sofas.',
      imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80',
      icon: 'Armchair',
      bookingType: 'variant',
      basePrice: 79,
      materialsPrice: 0,
      durationMinutes: 60,
      rating: 4.7,
      reviewCount: 189,
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
    },
  });

  const svcCarpetCleaning = await prisma.service.upsert({
    where: { slug: 'carpet-cleaning' },
    update: {},
    create: {
      name: 'Carpet Cleaning',
      slug: 'carpet-cleaning',
      categoryId: catFurnitureCleaning.id,
      shortDescription: 'Deep carpet cleaning to remove stains, dust, and allergens.',
      description: 'Professional carpet cleaning using hot-water extraction, stain removal, and anti-allergen treatment. Suitable for all carpet types.',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
      icon: 'Armchair',
      bookingType: 'variant',
      basePrice: 99,
      materialsPrice: 0,
      durationMinutes: 90,
      rating: 4.6,
      reviewCount: 134,
      isFeatured: true,
      isActive: true,
      sortOrder: 3,
    },
  });

  const svcMattressCleaning = await prisma.service.upsert({
    where: { slug: 'mattress-cleaning' },
    update: {},
    create: {
      name: 'Mattress Cleaning',
      slug: 'mattress-cleaning',
      categoryId: catFurnitureCleaning.id,
      shortDescription: 'Thorough mattress cleaning to remove dust mites and stains.',
      description: 'Professional mattress cleaning using UV sanitisation and hot-water extraction. Removes dust mites, stains, and allergens for a healthier sleep.',
      imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
      icon: 'Bed',
      bookingType: 'variant',
      basePrice: 99,
      materialsPrice: 0,
      durationMinutes: 60,
      rating: 4.8,
      reviewCount: 98,
      isFeatured: false,
      isActive: true,
      sortOrder: 4,
    },
  });

  const svcCurtainCleaning = await prisma.service.upsert({
    where: { slug: 'curtain-cleaning' },
    update: {},
    create: {
      name: 'Curtain Cleaning',
      slug: 'curtain-cleaning',
      categoryId: catFurnitureCleaning.id,
      shortDescription: 'On-site curtain cleaning without removal.',
      description: 'Professional on-site curtain cleaning using steam and dry-cleaning techniques. No need to remove your curtains.',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
      icon: 'Armchair',
      bookingType: 'fixed',
      basePrice: 149,
      materialsPrice: 0,
      durationMinutes: 90,
      rating: 4.5,
      reviewCount: 67,
      isFeatured: false,
      isActive: true,
      sortOrder: 5,
    },
  });

  const groupSofaSize = await prisma.serviceOptionGroup.upsert({
    where: { id: 'group-furniture-size' },
    update: {},
    create: {
      id: 'group-furniture-size',
      serviceId: svcFurnitureCleaning.id,
      name: 'Furniture Size',
      sortOrder: 1,
    },
  });

  const var1Seat = await prisma.serviceVariant.upsert({
    where: { id: 'var-1-seater' },
    update: {},
    create: {
      id: 'var-1-seater',
      serviceId: svcFurnitureCleaning.id,
      groupId: groupSofaSize.id,
      name: '1-Seater',
      price: 79,
      durationMinutes: 45,
      sortOrder: 1,
    },
  });

  const var3Seat = await prisma.serviceVariant.upsert({
    where: { id: 'var-3-seater' },
    update: {},
    create: {
      id: 'var-3-seater',
      serviceId: svcFurnitureCleaning.id,
      groupId: groupSofaSize.id,
      name: '3-Seater',
      price: 149,
      durationMinutes: 90,
      sortOrder: 2,
    },
  });

  const varLShape = await prisma.serviceVariant.upsert({
    where: { id: 'var-l-shape' },
    update: {},
    create: {
      id: 'var-l-shape',
      serviceId: svcFurnitureCleaning.id,
      groupId: groupSofaSize.id,
      name: 'L-Shape',
      price: 199,
      originalPrice: 249,
      durationMinutes: 120,
      sortOrder: 3,
    },
  });

  // Sofa Cleaning variants
  const groupSofaType = await prisma.serviceOptionGroup.upsert({
    where: { id: 'group-sofa-type' },
    update: {},
    create: {
      id: 'group-sofa-type',
      serviceId: svcSofaCleaning.id,
      name: 'Sofa Type',
      sortOrder: 1,
    },
  });

  await prisma.serviceVariant.createMany({
    data: [
      { id: 'var-sofa-1seat', serviceId: svcSofaCleaning.id, groupId: groupSofaType.id, name: '1-Seater', price: 79, durationMinutes: 45, sortOrder: 1 },
      { id: 'var-sofa-2seat', serviceId: svcSofaCleaning.id, groupId: groupSofaType.id, name: '2-Seater', price: 119, durationMinutes: 60, sortOrder: 2 },
      { id: 'var-sofa-3seat', serviceId: svcSofaCleaning.id, groupId: groupSofaType.id, name: '3-Seater', price: 149, durationMinutes: 75, sortOrder: 3 },
      { id: 'var-sofa-lshape', serviceId: svcSofaCleaning.id, groupId: groupSofaType.id, name: 'L-Shape Sofa', price: 179, originalPrice: 229, durationMinutes: 120, sortOrder: 4 },
      { id: 'var-sofa-recliner', serviceId: svcSofaCleaning.id, groupId: groupSofaType.id, name: 'Recliner', price: 99, durationMinutes: 60, sortOrder: 5 },
    ],
    skipDuplicates: true,
  });

  // Carpet Cleaning variants
  const groupCarpetType = await prisma.serviceOptionGroup.upsert({
    where: { id: 'group-carpet-type' },
    update: {},
    create: {
      id: 'group-carpet-type',
      serviceId: svcCarpetCleaning.id,
      name: 'Carpet Size',
      sortOrder: 1,
    },
  });

  await prisma.serviceVariant.createMany({
    data: [
      { id: 'var-carpet-small', serviceId: svcCarpetCleaning.id, groupId: groupCarpetType.id, name: 'Small (up to 4x6 ft)', price: 99, durationMinutes: 60, sortOrder: 1 },
      { id: 'var-carpet-medium', serviceId: svcCarpetCleaning.id, groupId: groupCarpetType.id, name: 'Medium (up to 6x9 ft)', price: 149, durationMinutes: 90, sortOrder: 2 },
      { id: 'var-carpet-large', serviceId: svcCarpetCleaning.id, groupId: groupCarpetType.id, name: 'Large (up to 9x12 ft)', price: 199, durationMinutes: 120, sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  // Mattress Cleaning variants
  const groupMattressType = await prisma.serviceOptionGroup.upsert({
    where: { id: 'group-mattress-type' },
    update: {},
    create: {
      id: 'group-mattress-type',
      serviceId: svcMattressCleaning.id,
      name: 'Mattress Size',
      sortOrder: 1,
    },
  });

  await prisma.serviceVariant.createMany({
    data: [
      { id: 'var-mattress-single', serviceId: svcMattressCleaning.id, groupId: groupMattressType.id, name: 'Single', price: 99, durationMinutes: 45, sortOrder: 1 },
      { id: 'var-mattress-double', serviceId: svcMattressCleaning.id, groupId: groupMattressType.id, name: 'Double', price: 149, durationMinutes: 60, sortOrder: 2 },
      { id: 'var-mattress-queen', serviceId: svcMattressCleaning.id, groupId: groupMattressType.id, name: 'Queen / King', price: 199, durationMinutes: 75, sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  const addonSanitise = await prisma.addon.upsert({
    where: { slug: 'sanitisation' },
    update: {},
    create: {
      name: 'Sanitisation',
      slug: 'sanitisation',
      description: 'Anti-bacterial sanitisation treatment.',
      price: 49,
      durationMinutes: 15,
      isActive: true,
      sortOrder: 1,
    },
  });

  const addonFragrance = await prisma.addon.upsert({
    where: { slug: 'premium-fragrance' },
    update: {},
    create: {
      name: 'Premium Fragrance',
      slug: 'premium-fragrance',
      description: 'Long-lasting premium fragrance treatment.',
      price: 29,
      durationMinutes: 10,
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.addonService.createMany({
    data: [
      { addonId: addonSanitise.id, serviceId: svcDeepClean.id },
      { addonId: addonSanitise.id, serviceId: svcRegularClean.id },
      { addonId: addonFragrance.id, serviceId: svcDeepClean.id },
      { addonId: addonSanitise.id, serviceId: svcFurnitureCleaning.id },
      { addonId: addonSanitise.id, serviceId: svcDisinfection.id },
    ],
    skipDuplicates: true,
  });

  const bundle = await prisma.bundle.upsert({
    where: { slug: 'full-home-care' },
    update: {},
    create: {
      name: 'Full Home Care Bundle',
      slug: 'full-home-care',
      description: 'Deep cleaning + sanitisation + disinfection for your entire home.',
      price: 349,
      originalPrice: 450,
      purchaseLimit: 0,
      isActive: true,
    },
  });

  await prisma.bundleItem.createMany({
    data: [
      { bundleId: bundle.id, label: 'Deep Cleaning', quantity: 1, serviceId: svcDeepClean.id },
      { bundleId: bundle.id, label: 'Sanitisation Treatment', quantity: 1 },
      { bundleId: bundle.id, label: 'Disinfection', quantity: 1, serviceId: svcDisinfection.id },
    ],
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off your first booking',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: 100,
      minAmount: 50,
      firstBookingOnly: true,
      isFeatured: true,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'CLEAN20' },
    update: {},
    create: {
      code: 'CLEAN20',
      description: '20 AED off cleaning services',
      discountType: 'fixed',
      discountValue: 20,
      minAmount: 100,
      isActive: true,
    },
  });

  const pro1 = await prisma.professional.upsert({
    where: { id: 'pro-ahmed' },
    update: {},
    create: {
      id: 'pro-ahmed',
      fullName: 'Ahmed Al-Rashid',
      phone: '+971501234567',
      cityId: dubai.id,
      status: 'AVAILABLE',
      rating: 4.9,
      completedJobs: 287,
      experienceYears: 8,
      isActive: true,
    },
  });

  const pro2 = await prisma.professional.upsert({
    where: { id: 'pro-mohammed' },
    update: {},
    create: {
      id: 'pro-mohammed',
      fullName: 'Mohammed Hassan',
      phone: '+971509876543',
      cityId: dubai.id,
      status: 'AVAILABLE',
      rating: 4.7,
      completedJobs: 156,
      experienceYears: 5,
      isActive: true,
    },
  });

  const pro3 = await prisma.professional.upsert({
    where: { id: 'pro-karim' },
    update: {},
    create: {
      id: 'pro-karim',
      fullName: 'Karim Osman',
      phone: '+971551122334',
      cityId: dubai.id,
      status: 'BUSY',
      rating: 4.8,
      completedJobs: 203,
      experienceYears: 6,
      isActive: true,
    },
  });

  await prisma.professionalSkill.createMany({
    data: [
      { professionalId: pro1.id, categoryId: catCleaning.id },
      { professionalId: pro1.id, categoryId: catFurnitureCleaning.id },
      { professionalId: pro2.id, categoryId: catCleaning.id },
      { professionalId: pro2.id, categoryId: catAcCleaning.id },
      { professionalId: pro3.id, categoryId: catPestControl.id },
      { professionalId: pro3.id, categoryId: catDisinfection.id },
    ],
    skipDuplicates: true,
  });

  for (const pro of [pro1, pro2, pro3]) {
    for (let day = 0; day < 7; day++) {
      await prisma.professionalAvailability.upsert({
        where: { professionalId_dayOfWeek: { professionalId: pro.id, dayOfWeek: day } },
        update: {},
        create: {
          professionalId: pro.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '20:00',
          isAvailable: true,
        },
      });
    }
  }

  await prisma.setting.upsert({
    where: { key: 'business_hours' },
    update: {},
    create: {
      key: 'business_hours',
      value: { start: '08:00', end: '20:00', timezone: 'Asia/Dubai' },
    },
  });

  await prisma.setting.upsert({
    where: { key: 'service_fee_pct' },
    update: {},
    create: { key: 'service_fee_pct', value: { value: 5 } },
  });

  console.log('Seed complete.');
  console.log('  Countries: 1 (UAE)');
  console.log('  Cities: 3 (Dubai, Abu Dhabi, Sharjah)');
  console.log('  Categories: 10');
  console.log('  Services: 10');
  console.log('  Variants: 11 (furniture sizes)');
  console.log('  Add-ons: 2');
  console.log('  Bundles: 1');
  console.log('  Coupons: 2 (WELCOME10, CLEAN20)');
  console.log('  Professionals: 3');
  console.log('  Service Relations: 15');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
