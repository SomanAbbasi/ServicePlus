import { useState, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Layers,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

import { getHomeCatalog } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { iconByName, FALLBACK_IMAGE } from "@/frontend/components/icons";
import { ServiceCard } from "@/frontend/components/ServiceCard";
import { LocationPicker } from "@/frontend/components/LocationPicker";
import { ComingSoonModal } from "@/frontend/components/ComingSoonModal";
import { PhoneMockup } from "@/frontend/components/PhoneMockup";
import { Button } from "@/frontend/components/ui/button";
import { localizedText } from "@/frontend/lib/i18n-content";
import { useLocale } from "@/frontend/lib/locale";
import { useSavedLocation } from "@/frontend/lib/location";
import { formatMoney, num } from "@/frontend/lib/money";

const homeQuery = queryOptions({
  queryKey: ["home-catalog"],
  queryFn: () => getHomeCatalog(),
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(homeQuery);
    } catch (err) {
      console.warn("[Home Loader] Pre-fetch warning:", err);
    }
  },
  head: () => ({
    meta: [
      { title: "ServicePlus — #1 Super app for home services in the UAE" },
      {
        name: "description",
        content:
          "Book trusted home cleaning, salon, AC, pest control and lab professionals across Dubai and the UAE with transparent pricing and same-day slots.",
      },
      { property: "og:title", content: "ServicePlus — #1 Super app for home services in the UAE" },
      {
        name: "description",
        content: "Trusted professionals, transparent pricing, same-day availability in the UAE.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
  errorComponent: () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center bg-slate-50">
      <div className="max-w-md rounded-2xl bg-white p-6 shadow-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Services Catalog</h2>
        <p className="mt-2 text-xs text-slate-500">Please refresh the page to reload the catalog.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  ),
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const services = (data?.services ?? []).filter((s: any) => s.is_active !== false && s.isActive !== false && s.isActive !== 0);
  const categories = (data?.categories ?? []).filter((c: any) => c.is_active !== false && c.isActive !== false && c.isActive !== 0);
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const { location, save } = useSavedLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [selectedCatSlug, setSelectedCatSlug] = useState<string | null>(null);
  const catSliderRef = useRef<HTMLDivElement>(null);
  const isAr = locale === "ar";

  const scrollCatSlider = (direction: "left" | "right") => {
    if (catSliderRef.current) {
      const amount = direction === "left" ? -280 : 280;
      catSliderRef.current.scrollBy({ left: isAr ? -amount : amount, behavior: "smooth" });
    }
  };

  const REASONS = [
    {
      icon: Star,
      color: "bg-amber-100 text-amber-600",
      title: isAr ? "محترفون بأعلى تقييم" : "Top rated professionals",
      body: isAr
        ? "محترفونا موثوقون ومدرّبون جيدًا، بمتوسط تقييم ٤.٨ من ٥."
        : "Our professionals are reliable & well-trained, with an average rating of 4.8 out of 5.",
    },
    {
      icon: CalendarCheck,
      color: "bg-rose-100 text-rose-600",
      title: isAr ? "توفر في نفس اليوم" : "Same-day availability",
      body: isAr
        ? "احجز في أقل من ٦٠ ثانية واختر مواعيد نفس اليوم في دبي والإمارات."
        : "Book in less than 60 seconds and even select same-day slots across Dubai & UAE.",
    },
    {
      icon: BadgeDollarSign,
      color: "bg-emerald-100 text-emerald-600",
      title: isAr ? "أعلى جودة وأفضل سعر" : "Top quality, value for money",
      body: isAr
        ? "محترفونا مجهزون بأفضل المعدات وخدماتنا بأسعار شفافة دائمًا."
        : "Our professionals are equipped with the best tools and our services are always transparently priced.",
    },
    {
      icon: Layers,
      color: "bg-sky-100 text-sky-600",
      title: isAr ? "تجربة تطبيق متكاملة" : "Super app experience",
      body: isAr
        ? "تطبيقنا الشامل يقدم أوسع مجموعة من الخدمات المنزلية لتغطية كافة احتياجاتك!"
        : "Being a Super app means we've got the widest range of home services, so you're always covered!",
    },
  ];

  const PROMISES = isAr
    ? [
        "محترفون معتمدون وتم التحقق من خلفياتهم",
        "أسعار واضحة بدون أي رسوم خفية",
        "ضمان إعادة التنظيف مجانًا إذا لم تكن راضيًا ١٠٠٪",
        "ضمان الجودة في كل خدمة",
      ]
    : [
        "Verified, background-checked professionals",
        "Clear pricing with 0% hidden fees",
        "Free re-cleaning guarantee if not 100% satisfied",
        "Quality guarantee in every service",
      ];

  // Active Category & Filtered Services (Display top featured services on homepage)
  const activeCategory = categories.find((c) => c.slug === selectedCatSlug);
  const featuredOnly = services.filter((s) => s.is_featured || (s as any).isFeatured);
  const filteredServices = selectedCatSlug
    ? services.filter((s) => s.category_id === activeCategory?.id)
    : featuredOnly.length > 0
    ? featuredOnly
    : services;

  const displayServices = (filteredServices.length > 0 ? filteredServices : services).slice(0, 4);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="bg-slate-50/50 min-h-screen">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-white border-b border-slate-200/80">
        {/* Background Image backdrop with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
            alt="Clean Dubai Living Room"
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-bold text-cyan-800 shadow-2xs">
              <Sparkles className="size-3.5 text-cyan-600" />
              {isAr ? "#١ التطبيق الأول للخدمات المنزلية" : "#1 Super app for all home services"}
            </span>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-3 text-xs text-slate-600 sm:text-base max-w-2xl mx-auto leading-relaxed">
              {t("home.heroSubtitle")}
            </p>
          </div>

          {/* Floating White Location Card — Responsive & Clean Layout */}
          <div className="mt-8 mx-auto max-w-2xl">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/50">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 sm:text-xs">
                {t("home.whereQuestion")}
              </p>
              
              <div 
                onClick={() => setPickerOpen(true)}
                className="mt-3 flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-cyan-500 hover:bg-white sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3.5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-600">
                    <MapPin className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                      {location ? location.address : isAr ? "حدد المنطقة، الشارع أو المعلم..." : "Select area, street name or landmark..."}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {isAr ? "اضغط لتحديد موقعك في دبي والإمارات" : "Tap to set location in Dubai & UAE"}
                    </p>
                  </div>
                </div>

                <Button size="sm" className="w-full shrink-0 bg-cyan-600 font-bold text-white hover:bg-cyan-700 sm:w-auto shadow-2xs">
                  {t("home.setLocation")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Picker Modal */}
      <LocationPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(loc) => {
          save(loc);
          setPickerOpen(false);
        }}
      />

      {/* Category Slider & Popular Services Explorer Section */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl">
            {isAr ? "خدماتنا الأكثر شعبية" : "Our most popular services"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
            {isAr ? "استكشف الخدمات التي يحجزها عملاؤنا بكثرة:" : "Explore the services our customers book most:"}
          </p>
        </div>

        {/* Horizontal Category Slider Bar with Scroll Arrows */}
        <div className="relative mt-8">
          <button
            type="button"
            onClick={() => scrollCatSlider("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 grid size-9 place-items-center rounded-full border border-slate-200 bg-white shadow-md text-slate-700 transition-all hover:bg-slate-50 hover:scale-105 active:scale-95"
          >
            {isAr ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          </button>

          <div
            ref={catSliderRef}
            className="flex items-center gap-3 overflow-x-auto px-10 pb-4 pt-1 scrollbar-none scroll-smooth"
          >
            <button
              type="button"
              onClick={() => setSelectedCatSlug(null)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all ${
                selectedCatSlug === null
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-cyan-500"
              }`}
            >
              <Sparkles className="size-4" />
              {isAr ? "جميع الخدمات" : "All services"}
            </button>

            {categories.map((cat) => {
              const Icon = iconByName(cat.icon);
              const isSelected = selectedCatSlug === cat.slug;
              const catName = localizedText({ ...cat }, "name", locale) ?? cat.name;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCatSlug(cat.slug)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all ${
                    isSelected
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-cyan-500"
                  }`}
                >
                  {cat.image_url ? (
                    <img
                      src={resolveImageUrl(cat.image_url)}
                      alt=""
                      className="size-5 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`grid size-5 place-items-center rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-cyan-50 text-cyan-600"
                      }`}
                    >
                      <Icon className="size-3" />
                    </div>
                  )}
                  {catName}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollCatSlider("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 grid size-9 place-items-center rounded-full border border-slate-200 bg-white shadow-md text-slate-700 transition-all hover:bg-slate-50 hover:scale-105 active:scale-95"
          >
            {isAr ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
          </button>
        </div>

        {/* Clean 2-Column Mobile / 4-Column Desktop Popular Services Grid */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {displayServices.map((service) => {
            const catObj = categories.find((c) => c.id === service.category_id);
            const catName = catObj ? (localizedText({ ...catObj }, "name", locale) ?? catObj.name) : (isAr ? "خدمة منزلية" : "Home Service");
            return (
              <ServiceCard key={service.id} service={service} categoryName={catName} />
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-slate-300 font-extrabold text-slate-700 hover:bg-slate-100 px-8 py-3 text-xs"
            onClick={() => void navigate({ to: "/search", search: { q: "" } })}
          >
            {t("home.browseAll")}
          </Button>
        </div>
      </section>

      {/* Why Choose ServicePlus (4 Reason Cards) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("home.reasonsTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("home.reasonsSubtitle")}</p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                className="flex flex-col items-center text-center rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-transform hover:-translate-y-1"
              >
                <div className={`grid size-12 place-items-center rounded-2xl ${r.color} shadow-2xs`}>
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900 text-base">{r.title}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{r.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* The ServicePlus Promise Banner */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 p-8 text-white shadow-xl sm:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-xs">
                <ShieldCheck className="size-4" />
                {t("home.promiseChip")}
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
                {t("home.promiseHeading")}
              </h2>
              <p className="mt-3 text-sm text-cyan-50 leading-relaxed">
                {t("home.promiseIntro")}
              </p>

              <ul className="mt-6 space-y-2.5">
                {PROMISES.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-xs font-semibold text-white">
                    <div className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-cyan-700">
                      <Sparkles className="size-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  size="lg"
                  className="bg-white text-cyan-800 font-bold hover:bg-cyan-50 shadow-md"
                  onClick={() => void navigate({ to: "/search", search: { q: "" } })}
                >
                  {t("home.browseAll")}
                </Button>
              </div>
            </div>

            <div className="hidden md:flex justify-center">
              <div className="relative overflow-hidden rounded-2xl border-4 border-white/20 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80"
                  alt="Service Guarantee"
                  className="h-72 w-96 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Promotion Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">{isAr ? "حمل التطبيق المجاني" : "Download Our Free App"}</span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {t("home.appTitle")}
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {t("home.appBody")}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAppModalOpen(true)}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-slate-800 shadow-md"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                </button>
                <button
                  type="button"
                  onClick={() => setAppModalOpen(true)}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-slate-800 shadow-md"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                  </svg>
                  Google Play
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      <ComingSoonModal open={appModalOpen} onOpenChange={setAppModalOpen} />
    </div>
  );
}
