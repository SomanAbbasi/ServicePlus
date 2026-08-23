import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  FileText,
  Mail,
  Scale,
  Server,
  Globe,
  Trash2,
  BellRing,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Building2,
  Send,
  Printer,
} from "lucide-react";
import { useLocale } from "@/frontend/lib/locale";
import { Button } from "@/frontend/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Service Plus FMP" },
      {
        name: "description",
        content:
          "Read how Service Plus FMP (a division of Resources For Employment L.L.C.) collects, uses, protects, and handles your personal data across our website and applications.",
      },
      { property: "og:title", content: "Privacy Policy — Service Plus FMP" },
      {
        property: "og:description",
        content:
          "Comprehensive privacy disclosures, lawful bases, data sharing, retention periods, and your rights.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-slate-50/50 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-cyan-600 transition-colors">
            {isAr ? "الرئيسية" : "Home"}
          </Link>
          <ChevronRight className={`size-3 text-slate-400 ${isAr ? "rotate-180" : ""}`} />
          <span className="text-slate-900 font-bold">
            {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
          </span>
        </nav>

        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs mb-8">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-cyan-50/60 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1 text-xs font-extrabold text-cyan-800">
                <Clock className="size-3.5 text-cyan-600" />
                <span>{isAr ? "آخر تحديث: 13 يوليو 2026" : "Last updated: 13 July 2026"}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                {isAr
                  ? "سيرفس بلس إف إم بي (Service Plus FMP)، وهي قسم من شركة موارد للتوظيف ذ.م.م. نلتزم بأعلى معايير الشفافية وحماية خصوصية بياناتك الشخصية."
                  : "Service Plus FMP, a division of Resources For Employment L.L.C. We are committed to transparency and the highest standards of personal data protection."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-full border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 gap-1.5"
              >
                <Printer className="size-3.5 text-slate-500" />
                <span>{isAr ? "طباعة" : "Print"}</span>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-cyan-600 hover:bg-cyan-700 text-xs font-bold text-white shadow-xs"
              >
                <a href="mailto:support@serviceplus.ae">
                  <Mail className="size-3.5 me-1.5" />
                  {isAr ? "تواصل مع مسؤول البيانات" : "Contact Data Officer"}
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Jump Pills */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 me-2">
              {isAr ? "الانتقال السريع:" : "Jump to:"}
            </span>
            {[
              { id: "intro", label: isAr ? "المقدمة" : "1. Introduction" },
              { id: "collected", label: isAr ? "البيانات المجمعة" : "2. Data Collected" },
              { id: "cookies", label: isAr ? "ملفات الكوكيز" : "3. Cookies & Tracking" },
              { id: "usage", label: isAr ? "استخدام البيانات" : "4. Data Usage" },
              { id: "lawful-basis", label: isAr ? "الأساس القانوني" : "5. Lawful Basis" },
              { id: "sharing", label: isAr ? "مشاركة البيانات" : "6. Data Sharing" },
              { id: "transfers", label: isAr ? "النقل الدولي" : "7. Transfers" },
              { id: "security", label: isAr ? "أمان البيانات" : "8. Security" },
              { id: "retention", label: isAr ? "الاحتفاظ بالبيانات" : "9. Retention" },
              { id: "rights", label: isAr ? "حقوقك" : "10. Your Rights" },
              { id: "deletion", label: isAr ? "حذف الحساب" : "12. Account Deletion" },
              { id: "contact", label: isAr ? "اتصل بنا" : "16. Contact Us" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => scrollToSection(pill.id)}
                className="rounded-full border border-slate-200/90 bg-slate-50/80 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-800 transition-colors"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="space-y-8 text-slate-700">

          {/* 1. Introduction */}
          <section
            id="intro"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <FileText className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "1. المقدمة" : "1. Introduction"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "نطاق سريان سياسة الخصوصية" : "Scope & application of this policy"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {isAr
                ? "توضح سياسة الخصوصية هذه كيف تقوم سيرفس بلس إف إم بي (Service Plus FMP)، وهي قسم من شركة موارد للتوظيف ذ.م.م (المشار إليها بـ «نحن» في هذه الوثيقة)، بجمع واستخدام ومشاركة وحماية بياناتك الشخصية عند استخدامك لـ:"
                : "This Privacy Policy explains how Service Plus FMP, a division of Resources For Employment L.L.C. (referred to as \"we\" throughout this document), collects, uses, shares, and protects your personal data when you use:"}
            </p>

            <ul className="space-y-2 ps-2 text-xs sm:text-sm font-medium text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>
                  {isAr
                    ? "موقع ومنصة الحجز الإلكتروني لسيرفس بلس إف إم بي"
                    : "The Service Plus FMP website and online booking platform"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>
                  {isAr
                    ? "تطبيقات الهواتف الذكية لسيرفس بلس إف إم بي"
                    : "The Service Plus FMP mobile applications"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>
                  {isAr
                    ? "خدمات دعم العملاء، والمراسلة، وقنوات التواصل"
                    : "Customer support, messaging, and communication services"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>
                  {isAr
                    ? "أي أدوات مدمجة أو قنوات خدمة تابعة لجهات خارجية نقوم بتشغيلها"
                    : "Any integrated third-party tools or service channels we operate"}
                </span>
              </li>
            </ul>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-900 leading-relaxed">
              {isAr
                ? "باستخدام خدماتنا، فإنك توافق على جمع واستخدام معلوماتك كما هو موضح في سياسة الخصوصية هذه. إذا كنت لا توافق، يرجى التوقف عن استخدام خدماتنا."
                : "By using our services, you agree to the collection and use of your information as described in this Privacy Policy. If you do not agree, please discontinue use of our services."}
            </div>
          </section>

          {/* 2. Personal Data We Collect */}
          <section
            id="collected"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "2. البيانات الشخصية التي نجمعها" : "2. Personal Data We Collect"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "فئات البيانات والأغراض التفصيلية" : "Categories of collected information"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {isAr
                ? "نقوم بجمع فئات مختلفة من البيانات الشخصية بناءً على كيفية تفاعلك مع خدماتنا:"
                : "We collect different categories of personal data depending on how you interact with our services:"}
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold">
                  <tr>
                    <th className="p-3.5 sm:p-4 text-start w-1/3 sm:w-1/4">
                      {isAr ? "الفئة / الغرض" : "Category / Purpose"}
                    </th>
                    <th className="p-3.5 sm:p-4 text-start">
                      {isAr ? "التفاصيل" : "Details"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "معلومات الحساب" : "Account Information"}
                    </td>
                    <td className="p-3.5 sm:p-4 leading-relaxed">
                      {isAr
                        ? "الاسم الكامل، عنوان البريد الإلكتروني، رقم الهاتف، الجنسية، ورمز الدولة."
                        : "Full name, email address, phone number, nationality, and country code."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "العنوان والموقع الجغرافي" : "Address & Location"}
                    </td>
                    <td className="p-3.5 sm:p-4 leading-relaxed">
                      {isAr
                        ? "عناوين تقديم الخدمة، تفاصيل المبنى أو الشقة، المنطقة، المدينة، الإمارة/المنطقة، وأي ملاحظات دخول أو توجيهات للوصول."
                        : "Service addresses, building or apartment details, area, city, region, and any access notes or directions."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "الحجوزات والمعاملات" : "Booking & Transaction"}
                    </td>
                    <td className="p-3.5 sm:p-4 leading-relaxed">
                      {isAr
                        ? "سجل الحجوزات، تفضيلات الخدمة، تفاصيل الجدولة، حالة الاشتراك أو الباقة، استخدام قسائم الخصم، ورصيد المحفظة."
                        : "Booking history, service preferences, scheduling details, subscription or package status, voucher usage, and wallet credit balance."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "معلومات الدفع" : "Payment Information"}
                    </td>
                    <td className="p-3.5 sm:p-4 leading-relaxed">
                      {isAr
                        ? "رموز دفع مشفرة (Tokens) يتم إنشاؤها عبر معالج دفع معتمد ومتوافق مع معايير PCI-DSS. نحن لا نقوم بتخزين أرقام البطاقات الكاملة، أو رموز الأمان CVV، أو تواريخ الانتهاء."
                        : "Payment tokens generated by our PCI-DSS-compliant payment processor. We do not store full card numbers, CVV codes, or expiry dates."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "بيانات الجهاز والاستخدام" : "Device & Usage"}
                    </td>
                    <td className="p-3.5 sm:p-4 leading-relaxed">
                      {isAr
                        ? "عنوان IP، نوع المتصفح، نظام التشغيل، إصدار التطبيق، مصدر الإحالة، تقارير الأعطال، وبيانات الاستخدام والتفاعل العامة."
                        : "IP address, browser type, operating system, app version, referral source, crash reports, and general usage or interaction data."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "المراسلات والاتصالات" : "Communications"}
                    </td>
                    <td className="p-3.5 sm:p-4 leading-relaxed">
                      {isAr
                        ? "رسائل البريد الإلكتروني لدعم العملاء، رسائل واتساب، سجل المحادثات داخل التطبيق، وتسجيلات مكالمات الدعم المسجلة."
                        : "Customer support emails, WhatsApp messages, in-app chat history, and recorded support calls."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "تفضيلات التسويق" : "Marketing Preferences"}
                    </td>
                    <td className="p-3.5 sm:p-4 leading-relaxed">
                      {isAr
                        ? "الاشتراكات في النشرات الإخبارية، تفضيلات الإشعارات الفورية، وحالة الاشتراك أو إلغاء الاشتراك في الرسائل القصيرة والعروض الترويجية."
                        : "Newsletter subscriptions, push notification preferences, and SMS or promotional opt-in / opt-out status."}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Cookies and Tracking Technologies */}
          <section
            id="cookies"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Globe className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "3. ملفات تعريف الارتباط وتقنيات التتبع" : "3. Cookies and Tracking Technologies"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "ملفات الكوكيز والتحليلات والتشخيص" : "Cookies, telemetry, and partner integrations"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isAr
                ? "قد نقوم نحن وشركاؤنا من الأطراف الثالثة بجمع معلومات حول كيفية وصولك إلى موقعنا وتطبيقاتنا واستخدامها، بما في ذلك:"
                : "We and our third-party partners may collect information about how you access and use our website and mobile applications, including:"}
            </p>

            <ul className="grid sm:grid-cols-2 gap-2.5 ps-2 text-xs sm:text-sm font-medium text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>{isAr ? "معرّفات الجهاز وإصدار التطبيق" : "Device identifiers and app version"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>{isAr ? "نوع المتصفح ونظام التشغيل" : "Browser type and operating system"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>{isAr ? "عنوان IP والموقع الجغرافي التقريبي" : "IP address and approximate location"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>{isAr ? "التفاعلات وسلوك التصفح ونشاط البحث أو الحجز" : "App interactions, navigation behaviour, and search or booking activity"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>{isAr ? "تقارير الأعطال والتشخيصات وبيانات الأداء" : "Crash reports, diagnostics, and performance data"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>{isAr ? "معرّفات ملفات تعريف الارتباط ورموز الإشعارات الفورية" : "Cookie identifiers and push notification tokens"}</span>
              </li>
              <li className="flex items-start gap-2.5 sm:col-span-2">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>{isAr ? "بيانات التحليلات وتتبع الإحالات المجمعة عبر مزودين معتمدين" : "Analytics and attribution data collected through third-party providers"}</span>
              </li>
            </ul>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
              {isAr
                ? "تُستخدم هذه التقنيات للمصادقة، التحليلات، منع الاحتيال، التشخيص، مراقبة الأداء، تحسين الخدمة، وقياس فاعلية الحملات التسويقية. قد يستخدم شركاؤنا من الأطراف الثالثة — بما في ذلك موفرو التحليلات والإعلانات وبوابات الدفع — تقنيات مماثلة فيما يتعلق بخدماتنا."
                : "These technologies are used for authentication, analytics, fraud prevention, diagnostics, performance monitoring, service improvement, and marketing measurement. Third-party partners — including analytics, advertising, attribution, and payment providers — may also use similar technologies in connection with our services."}
            </p>
          </section>

          {/* 4. How We Use Your Personal Data */}
          <section
            id="usage"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Server className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "4. كيفية استخدام بياناتك الشخصية" : "4. How We Use Your Personal Data"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "أغراض المعالجة التشغيلية والخدمية" : "Purposes and applications of processed data"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {isAr
                ? "نستخدم بياناتك الشخصية لتشغيل وتحسين وتأمين خدماتنا:"
                : "We use your personal data to operate, improve, and secure our services:"}
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold">
                  <tr>
                    <th className="p-3.5 sm:p-4 text-start w-1/3 sm:w-1/4">
                      {isAr ? "الفئة / الغرض" : "Category / Purpose"}
                    </th>
                    <th className="p-3.5 sm:p-4 text-start">
                      {isAr ? "التفاصيل والبيانات المستخدمة" : "Details"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "تنفيذ وإدارة الحجوزات" : "Deliver and manage bookings"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "بيانات الحساب، والعنوان، والحجز، والدفع." : "Account, address, booking, and payment data."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "إرسال وتوجيه المحترفين" : "Dispatch service professionals"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "الاسم، العنوان، رقم الاتصال، تفاصيل الحجز، وتعليمات الخدمة الخاصة." : "Name, address, contact number, booking details, and service instructions."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "معالجة المدفوعات والمبالغ المستردة" : "Process payments and refunds"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "رموز الدفع المشفرة، سجلات الحجز، وسجل المعاملات المالية." : "Payment tokens, booking records, and transaction history."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "تقديم خدمة العملاء والدعم" : "Provide customer support"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "سجل المراسلات والمحادثات، سجل الحجوزات، وتفاصيل الحساب." : "Communications history, booking history, and account details."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "تحسين الخدمات وتجربة المستخدم" : "Improve services and user experience"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "تحليلات الاستخدام، التشخيصات، وسجلات التشغيل التقنية." : "Usage analytics, diagnostics, and operational logs."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "منع الاحتيال والأمان" : "Fraud prevention and security"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "معلومات الجهاز، بيانات المصادقة، وسجلات الأمان." : "Device information, authentication data, and security logs."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "الاتصالات التسويقية" : "Marketing communications"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "تفاصيل الاتصال وتفضيلات التسويق (بناءً على موافقتك الصريحة عند الاقتضاء)." : "Contact details and marketing preferences (with your consent where required)."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "الامتثال القانوني والتنظيمي" : "Legal and regulatory compliance"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "سجلات المعاملات، المعلومات الضريبية والمحاسبية، والطلبات الرسمية من السلطات المختصة." : "Transaction records, tax and accounting information, and lawful authority requests."}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AI Policy Protection Callout */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3 text-xs text-emerald-950 font-semibold leading-relaxed">
              <Sparkles className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-emerald-900 text-xs mb-1">
                  {isAr ? "حماية بيانات العملاء ونماذج الذكاء الاصطناعي:" : "AI Protection & Anonymized Analytics:"}
                </p>
                <p>
                  {isAr
                    ? "يجوز لنا أيضاً استخدام المعلومات المجمعة ومجهولة المصدر لأغراض التحليلات والرؤى التشغيلية وتحسين الخدمات. نحن لا نستخدم أي محتوى أو بيانات تخص العملاء لتدريب نماذج الذكاء الاصطناعي الخارجية."
                    : "We may also use aggregated and anonymised information for analytics, operational insights, and service improvement. We do not use customer content to train external AI models."}
                </p>
              </div>
            </div>
          </section>

          {/* 5. Lawful Basis for Processing */}
          <section
            id="lawful-basis"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Scale className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "5. الأساس القانوني للمعالجة" : "5. Lawful Basis for Processing"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "الأسس القانونية لمعالجة بياناتك" : "Legal grounds under applicable data protection laws"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {isAr
                ? "نحن نعالج بياناتك الشخصية فقط عندما يتوفر لدينا أساس قانوني مشروع للقيام بذلك:"
                : "We only process your personal data where we have a lawful basis to do so:"}
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold">
                  <tr>
                    <th className="p-3.5 sm:p-4 text-start w-1/3 sm:w-1/4">
                      {isAr ? "الأساس القانوني" : "Lawful Basis"}
                    </th>
                    <th className="p-3.5 sm:p-4 text-start">
                      {isAr ? "التفاصيل ونطاق التطبيق" : "Details"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "تنفيذ العقد" : "Performance of a contract"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "تسجيل الحساب، إتمام الحجوزات، وتجهيز عمليات الدفع." : "Account registration, booking fulfilment, and payment processing."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "المصالح المشروعة" : "Legitimate interests"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "منع الاحتيال، التحليلات التشغيلية، تحسين المنتجات، والأمان." : "Fraud prevention, analytics, product improvement, and operational security."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "الالتزامات القانونية" : "Legal obligations"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "الامتثال للضرائب والمحاسبة، مكافحة غسل الأموال، وطلبات السلطات الرسمية." : "Tax, accounting, anti-money-laundering compliance, and lawful authority requests."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "الموافقة" : "Consent"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "الاتصالات التسويقية والإشعارات الترويجية الاختيارية." : "Marketing communications and optional notifications."}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Who We Share Your Personal Data With */}
          <section
            id="sharing"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Building2 className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "6. الجهات التي نشارك بياناتك الشخصية معها" : "6. Who We Share Your Personal Data With"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "عدم بيع البيانات ومصفوفة المشاركة الضرورية" : "Strict no-sale policy and trusted partners"}
                </p>
              </div>
            </div>

            {/* Zero Sale of Data Highlight */}
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 font-extrabold text-cyan-950 text-xs sm:text-sm flex items-center gap-3">
              <CheckCircle2 className="size-5 text-cyan-700 shrink-0" />
              <span>
                {isAr
                  ? "نحن نشارك البيانات الشخصية فقط عند الضرورة لتشغيل خدماتنا. نحن لا نبيع أو نؤجر أو نتاجر بمعلوماتك الشخصية لأي طرف ثالث."
                  : "We share personal data only where necessary to operate our services. We do not sell, rent, or lease your personal information to any third party."}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold">
                  <tr>
                    <th className="p-3.5 sm:p-4 text-start w-1/3 sm:w-1/4">
                      {isAr ? "الفئة / الشريك" : "Category / Purpose"}
                    </th>
                    <th className="p-3.5 sm:p-4 text-start">
                      {isAr ? "الغرض من المشاركة" : "Details"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "محترفو الخدمة" : "Service professionals"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "لتنفيذ الحجوزات وتقديم الخدمات في موقعك المحدد." : "To fulfil bookings and deliver services at your location."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "معالجو وبوابات الدفع" : "Payment processors"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "لمعالجة عمليات الدفع واسترداد المبالغ بشكل آمن ومحمي." : "To process payments and refunds securely."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "مزودو خدمات الاتصالات" : "Communications providers"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "لإرسال الرسائل النصية القصيرة، الإشعارات الفورية، البريد الإلكتروني، ورسائل واتساب." : "To send SMS, push notifications, email, and WhatsApp messages."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "مزودو الخرائط والعناوين" : "Maps and address providers"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "للتحقق من صحة العناوين، وتوجيه المسارات، وتغطية مناطق تقديم الخدمة." : "For address validation, routing, and service area coverage."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "مزودو السحابة والبنية التحتية" : "Cloud and infrastructure providers"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "للاستضافة والتحليلات والمراقبة وتشغيل الأنظمة الأساسية." : "For hosting, analytics, monitoring, and operational systems."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 align-top">
                      {isAr ? "السلطات القانونية والتنظيمية" : "Legal and regulatory authorities"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "عند الاقتضاء بموجب القانون المعمول به أو بناءً على طلب رسمي من سلطة مختصة." : "Where required by applicable law or a lawful authority request."}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. International Data Transfers */}
          <section
            id="transfers"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Globe className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "7. نقل البيانات دولياً" : "7. International Data Transfers"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "ضمانات نقل البيانات ومعالجتها عبر الحدود" : "Cross-border data protection safeguards"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {isAr
                ? "قد يتم نقل البيانات الشخصية ومعالجتها في البلدان التي نعمل فيها نحن أو مقدمو خدماتنا، بما في ذلك دولة الإمارات العربية المتحدة والولايات القضائية الأخرى التي يتواجد فيها شركاؤنا في التكنولوجيا أو البنية التحتية. عندما يتم نقل البيانات الشخصية دولياً، فإننا نتخذ خطوات معقولة لضمان وجود ضمانات مناسبة، بما في ذلك الحماية التعاقدية مع مزودي الخدمات ومعالجي البيانات لدينا."
                : "Personal data may be transferred to and processed in countries where we or our service providers operate, including the United Arab Emirates and other jurisdictions where our technology or infrastructure partners are based. Where personal data is transferred internationally, we take reasonable steps to ensure appropriate safeguards are in place, including contractual protections with our service providers and data processors."}
            </p>

            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              {isAr
                ? "باستخدام خدماتنا، فإنك تقر بأن بياناتك قد تخضع لعمليات النقل الدولي هذه وفقاً للمعايير والضمانات المذكورة."
                : "By using our services, you acknowledge that your data may be subject to these international transfers."}
            </p>
          </section>

          {/* 8. Data Security */}
          <section
            id="security"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Lock className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "8. أمان البيانات" : "8. Data Security"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "التدابير التقنية والتنظيمية للحماية" : "Technical and organisational protective measures"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isAr
                ? "نتخذ تدابير فنية وتنظيمية صارمة ومعقولة لحماية بياناتك الشخصية من الوصول غير المصرح به أو سوء الاستخدام أو الفقدان أو الإفصاح. وتشمل هذه التدابير:"
                : "We take reasonable technical and organisational measures to protect your personal data from unauthorised access, misuse, loss, or disclosure. These measures include:"}
            </p>

            <ul className="grid sm:grid-cols-2 gap-3 ps-2 text-xs sm:text-sm font-semibold text-slate-800">
              <li className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <Lock className="size-4 text-cyan-600 shrink-0" />
                <span>{isAr ? "تشفير البيانات أثناء النقل وأثناء التخزين" : "Encryption of data in transit and at rest"}</span>
              </li>
              <li className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <ShieldCheck className="size-4 text-cyan-600 shrink-0" />
                <span>{isAr ? "ضوابط المصادقة وقيود الوصول المحكمة" : "Authentication controls and access restrictions"}</span>
              </li>
              <li className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <Server className="size-4 text-cyan-600 shrink-0" />
                <span>{isAr ? "جدران الحماية وحماية الشبكات المتقدمة" : "Firewall and network protections"}</span>
              </li>
              <li className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <Clock className="size-4 text-cyan-600 shrink-0" />
                <span>{isAr ? "التسجيل والمراقبة التشغيلية المستمرة" : "Operational logging and monitoring"}</span>
              </li>
              <li className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100 sm:col-span-2">
                <CheckCircle2 className="size-4 text-cyan-600 shrink-0" />
                <span>{isAr ? "تقييد الوصول الداخلي للموظفين على أساس الحاجة إلى المعرفة فقط" : "Restricted internal access on a need-to-know basis"}</span>
              </li>
            </ul>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 leading-relaxed font-medium">
              {isAr
                ? "لا توجد طريقة نقل أو تخزين عبر الإنترنت آمنة تماماً بنسبة 100%. نشجعك على استخدام كلمات مرور قوية وفريدة وحماية بيانات اعتماد حسابك دائماً."
                : "No method of transmission or storage over the internet is completely secure. We encourage you to use strong, unique passwords and to protect your account credentials."}
            </div>
          </section>

          {/* 9. Data Retention */}
          <section
            id="retention"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Clock className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "9. الاحتفاظ بالبيانات" : "9. Data Retention"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "جداول وفترات الاحتفاظ بالبيانات" : "Retention schedules and deletion timelines"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {isAr
                ? "نحتفظ بالبيانات الشخصية فقط طالما كان ذلك ضرورياً لتحقيق الأغراض الموضحة في سياسة الخصوصية هذه وللامتثال لالتزاماتنا القانونية:"
                : "We retain personal data only for as long as necessary to fulfil the purposes described in this Privacy Policy and to comply with our legal obligations:"}
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold">
                  <tr>
                    <th className="p-3.5 sm:p-4 text-start w-1/3 sm:w-1/4">
                      {isAr ? "الفئة / الغرض" : "Category / Purpose"}
                    </th>
                    <th className="p-3.5 sm:p-4 text-start">
                      {isAr ? "فترة الاحتفاظ" : "Retention Period"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                      {isAr ? "معلومات الحساب" : "Account information"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "حتى حذف الحساب، بالإضافة إلى 30 يوماً." : "Until account deletion, plus 30 days."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                      {isAr ? "سجلات الحجوزات" : "Booking records"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "حتى حذف الحساب، بالإضافة إلى 30 يوماً." : "Until account deletion, plus 30 days."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                      {isAr ? "تذاكر دعم العملاء" : "Customer support tickets"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "طوال مدة تفاعل الدعم، ما لم يكن الاحتفاظ الأطول مطلوباً قانوناً." : "For the duration of the support interaction, unless longer retention is legally required."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                      {isAr ? "تسجيلات مكالمات الدعم" : "Support call recordings"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "تصل إلى عامين (2 سنة)." : "Up to 2 years."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                      {isAr ? "سجلات الأمان ومنع الاحتيال" : "Fraud and security logs"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "90 يوماً." : "90 days."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                      {isAr ? "بيانات تحليلات الويب والتطبيق" : "Web and app analytics data"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {isAr ? "مجمعة ومجهولة المصدر؛ يتم الاحتفاظ بها وفقاً لفترة الاحتفاظ القياسية لمزود التحليلات." : "Aggregated and anonymised; retained per our analytics provider's standard retention period."}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {isAr
                ? "يجوز لنا الاحتفاظ بالمعلومات مجهولة المصدر والمجمعة بعد هذه الفترات لأغراض التحليلات والأبحاث التشغيلية."
                : "We may retain anonymised and aggregated information beyond these periods for analytics and research purposes."}
            </p>
          </section>

          {/* 10. Your Rights and Choices */}
          <section
            id="rights"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Scale className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "10. حقوقك وخياراتك" : "10. Your Rights and Choices"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "خياراتك وحقوقك بموجب قوانين حماية البيانات" : "Data subject rights and control mechanisms"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {isAr
                ? "اعتماداً على موقعك الجغرافي والقوانين المعمول بها، قد يكون لديك الحق في:"
                : "Depending on your location and applicable law, you may have the right to:"}
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { en: "Access the personal data we hold about you", ar: "الوصول إلى البيانات الشخصية التي نحتفظ بها عنك" },
                { en: "Correct inaccurate or incomplete data", ar: "تصحيح البيانات غير الدقيقة أو غير المكتملة" },
                { en: "Request deletion of your personal data", ar: "طلب حذف بياناتك الشخصية" },
                { en: "Object to or restrict certain processing activities", ar: "الاعتراض على أو تقييد بعض أنشطة المعالجة" },
                { en: "Withdraw consent where processing is based on consent", ar: "سحب الموافقة حيثما تستند المعالجة إلى الموافقة" },
                { en: "Request portability of your data in a structured format", ar: "طلب نقل بياناتك بصيغة منظمة وقابلة للقراءة آلياً" },
                { en: "File a complaint with a relevant data protection authority", ar: "تقديم شكوى إلى الجهة التنظيمية المختصة بحماية البيانات", span: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs font-bold text-slate-800 ${
                    item.span ? "sm:col-span-2" : ""
                  }`}
                >
                  <CheckCircle2 className="size-4 text-cyan-600 shrink-0 mt-0.5" />
                  <span>{isAr ? item.ar : item.en}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 11. Marketing Controls */}
          <section
            id="marketing"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <BellRing className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "11. ضوابط التسويق" : "11. Marketing Controls"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "إلغاء الاشتراك وإدارة التفضيلات" : "Opt-out mechanisms and communication channels"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {isAr
                ? "يمكنك إلغاء الاشتراك في الاتصالات التسويقية في أي وقت من خلال:"
                : "You can opt out of marketing communications at any time by:"}
            </p>

            <ul className="space-y-2.5 ps-2 text-xs sm:text-sm font-semibold text-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>
                  {isAr
                    ? "النقر على رابط إلغاء الاشتراك في أي بريد إلكتروني تسويقي نرسله"
                    : "Clicking the unsubscribe link in any marketing email we send"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>
                  {isAr
                    ? "الرد بكلمة STOP على أي رسالة تسويقية قصيرة (SMS)"
                    : "Replying STOP to any marketing SMS message"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>
                  {isAr
                    ? "تعديل إعدادات الإشعارات في تطبيق سيرفس بلس إف إم بي"
                    : "Adjusting your notification settings in the Service Plus FMP app"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-1.5 rounded-full bg-cyan-600 shrink-0 mt-2" />
                <span>
                  {isAr
                    ? "التواصل معنا عبر البريد الإلكتروني: support@serviceplus.ae"
                    : "Contacting us directly at support@serviceplus.ae"}
                </span>
              </li>
            </ul>
          </section>

          {/* 12. Account Deletion */}
          <section
            id="deletion"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "12. حذف الحساب والبيانات" : "12. Account Deletion"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "إجراءات طلب حذف البيانات الشخصية" : "Verified data erasure requests"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {isAr
                ? "لطلب حذف حسابك والبيانات الشخصية المرتبطة به، يُرجى إرسال بريد إلكتروني إلى support@serviceplus.ae مع وضع عنوان الموضوع: \"Data Deletion Request\"."
                : "To request deletion of your account and associated personal data, please email support@serviceplus.ae with the subject line: \"Data Deletion Request\"."}
            </p>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs font-semibold text-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="font-extrabold text-slate-900 block mb-0.5">
                  {isAr ? "مدة التنفيذ:" : "Resolution Timeline:"}
                </span>
                <span className="text-slate-600">
                  {isAr
                    ? "سيتم تنفيذ الطلبات التي تم التحقق منها في غضون 30 يوماً، مع مراعاة أي التزامات قانونية أو ضريبية بالاحتفاظ بالسجلات."
                    : "Verified requests will be actioned within 30 days, subject to any applicable legal retention obligations."}
                </span>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-full font-bold text-xs border-slate-300">
                <a href="mailto:support@serviceplus.ae?subject=Data%20Deletion%20Request">
                  <Send className="size-3.5 me-1.5" />
                  {isAr ? "إرسال طلب الحذف" : "Submit Request"}
                </a>
              </Button>
            </div>
          </section>

          {/* 13. Age Restriction */}
          <section
            id="age"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "13. القيود العمرية وحماية القُصّر" : "13. Age Restriction"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "الخدمات مخصصة للبالغين 18 سنة فما فوق" : "18+ age requirement policy"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {isAr
                ? "خدماتنا مخصصة للبالغين الذين تبلغ أعمارهم 18 عاماً فما فوق. نحن لا نجمع عن قصد بيانات شخصية من أفراد تقل أعمارهم عن 18 عاماً. إذا كنت تعتقد أننا جمعنا معلومات عن قاصر دون قصد، يرجى التواصل معنا على الفور عبر support@serviceplus.ae وسنتخذ خطوات سريعة لحذف تلك المعلومات."
                : "Our services are intended for adults aged 18 years and above. We do not knowingly collect personal data from individuals under 18. If you believe we have inadvertently collected information from a minor, please contact us immediately at support@serviceplus.ae and we will take prompt steps to remove that information."}
            </p>
          </section>

          {/* 14. Third-Party Services and Links */}
          <section
            id="third-party"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <ExternalLink className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "14. خدمات وروابط الأطراف الثالثة" : "14. Third-Party Services and Links"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "روابط الجهات الخارجية وإخلاء المسؤولية" : "External services and link practices"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {isAr
                ? "قد يحتوي موقعنا وتطبيقاتنا على روابط لمواقع أو خدمات تابعة لجهات خارجية، بما في ذلك موفرو خدمات الدفع وخدمات الخرائط. نحن لسنا مسؤولين عن ممارسات الخصوصية لتلك الأطراف الثالثة. نشجعك على مراجعة سياسات الخصوصية الخاصة بهم قبل تقديم أي معلومات شخصية إليهم."
                : "Our website and applications may contain links to third-party websites or services, including payment providers and mapping services. We are not responsible for the privacy practices of those third parties. We encourage you to review their respective privacy policies before submitting any personal information to them."}
            </p>
          </section>

          {/* 15. Updates to This Privacy Policy */}
          <section
            id="updates"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Clock className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "15. التحديثات على سياسة الخصوصية هذه" : "15. Updates to This Privacy Policy"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {isAr ? "إخطارات التعديل وتواريخ المراجعة" : "Revision history and notification process"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {isAr
                ? "يجوز لنا تحديث سياسة الخصوصية هذه من حين لآخر لتعكس التغييرات في خدماتنا أو المتطلبات القانونية أو المعايير المتبعة. عند إجراء تغييرات جوهرية، سنقوم بإخطار المستخدمين عبر البريد الإلكتروني أو الإشعارات داخل التطبيق. يعكس تاريخ «آخر تحديث» أعلى هذه السياسة تاريخ أحدث مراجعة. نشجعك على مراجعة سياسة الخصوصية هذه بشكل دوري."
                : "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or industry standards. When material changes are made, we will notify users via email or in-product notices. The \"Last updated\" date at the top of this policy reflects the most recent revision date. We encourage you to review this Privacy Policy periodically."}
            </p>
          </section>

          {/* 16. Contact Us */}
          <section
            id="contact"
            className="rounded-3xl border border-cyan-200 bg-gradient-to-b from-cyan-50/50 to-white p-6 sm:p-8 shadow-xs space-y-6 scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-cyan-100 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-600 text-white shadow-xs">
                <Mail className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isAr ? "16. تواصل معنا" : "16. Contact Us"}
                </h2>
                <p className="text-xs text-cyan-800 font-semibold">
                  {isAr ? "قنوات الدعم والاستفسارات القانونية" : "Support and data inquiries"}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {isAr
                ? "إذا كان لديك أي أسئلة أو مخاوف أو طلبات بخصوص سياسة الخصوصية هذه أو كيفية تعاملنا مع بياناتك الشخصية، يُرجى الاتصال بنا:"
                : "If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal data, please contact us:"}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Support & Data Enquiries Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-700">
                  {isAr ? "استفسارات الدعم وحماية البيانات" : "Support & Data Enquiries"}
                </span>
                <p className="text-xs font-bold text-slate-900">
                  <a href="mailto:support@serviceplus.ae" className="hover:text-cyan-600 transition-colors">
                    support@serviceplus.ae
                  </a>
                </p>
                <p className="text-[11px] text-slate-500">
                  {isAr ? "لطلبات حذف البيانات واستفسارات الخصوصية وحقوق المستخدم" : "For data deletion, access requests, and user rights"}
                </p>
              </div>

              {/* Business & General Enquiries Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-700">
                  {isAr ? "استفسارات الأعمال والشؤون العامة" : "Business & General Enquiries"}
                </span>
                <p className="text-xs font-bold text-slate-900">
                  <a href="mailto:info@serviceplus.ae" className="hover:text-cyan-600 transition-colors">
                    info@serviceplus.ae
                  </a>
                </p>
                <p className="text-[11px] text-slate-500">
                  {isAr ? "للشراكات والتواصل العام والامتثال المؤسسي" : "For partnerships, corporate inquiries, and compliance"}
                </p>
              </div>
            </div>

            {/* Corporate Entity Notice Box */}
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-start">
                <p className="text-xs font-extrabold text-white">
                  Service Plus FMP
                </p>
                <p className="text-[11px] text-slate-300">
                  A division of Resources For Employment L.L.C.
                </p>
              </div>
              <div className="text-center sm:text-end text-[11px] text-slate-400">
                <span>&copy; 2026 Service Plus FMP — A Division of Resources For Employment L.L.C. | info@serviceplus.ae</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

