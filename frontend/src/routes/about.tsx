import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocale } from "@/frontend/lib/locale";
import { CheckCircle2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-extrabold text-cyan-800">
          <Sparkles className="size-3.5 text-cyan-600" />
          {isAr ? "عن سيرفس بلس" : "About ServicePlus"}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {isAr
            ? "المنصة الرائدة للخدمات المنزلية في دولة الإمارات"
            : "The UAE's Premier Home Services Platform"}
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-slate-600 leading-relaxed">
          {isAr
            ? "نحن نربط العائلات في جميع أنحاء الإمارات بمحترفين مؤهلين ومفحوصين لتقديم أفضل خدمات التنظيف، الصيانة، مكافحة الحشرات والعناية الشخصية."
            : "We connect families across the UAE with background-checked professionals to deliver top-tier home cleaning, maintenance, pest control, and wellness services."}
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
          <ShieldCheck className="size-8 text-cyan-600" />
          <h3 className="text-base font-bold text-slate-900">
            {isAr ? "محترفون موثوقون" : "Vetted Professionals"}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isAr
              ? "جميع الفنيين وعاملات المنازل يخضعون لفحص خلفية شامل وتدريب عالي المستوى."
              : "Every professional undergoes rigorous background checks, training, and continuous rating."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
          <CheckCircle2 className="size-8 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            {isAr ? "أسعار شفافة" : "Transparent Pricing"}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isAr
              ? "أسعار واضحة بالدرهم الإماراتي بدون أي رسوم خفية."
              : "Clear prices in AED with zero hidden fees. Know exactly what you pay before booking."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
          <Users className="size-8 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">
            {isAr ? "دعم على مدار الساعة" : "24/7 Support"}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isAr
              ? "فريق خدمة العملاء لدينا مستعد دائمًا لمساعدتك وضمان رضاك الكامل."
              : "Our dedicated support team is available around the clock to assist with your bookings."}
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link to="/">
          <Button className="bg-cyan-600 font-bold text-white hover:bg-cyan-700 rounded-full px-8">
            {isAr ? "تصفح جميع الخدمات" : "Browse All Services"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
