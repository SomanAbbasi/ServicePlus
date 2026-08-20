import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "@/frontend/lib/locale";
import { Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";

export const Route = createFileRoute("/careers")({
  component: CareersPage,
});

function CareersPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-extrabold text-cyan-800">
          <Briefcase className="size-3.5 text-cyan-600" />
          {isAr ? "انضم إلى فريقنا" : "Join Our Team"}
        </span>
        <h1 className="text-3xl font-black text-slate-900">
          {isAr ? "فرص العمل والوظائف المتاحة" : "Careers at ServicePlus"}
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          {isAr
            ? "نحن نبحث دائمًا عن كفاءات ومحترفين شغوفين للانضمام إلى فريق العمل وتوفير أفضل تجربة خدمات في الإمارات."
            : "We're always looking for talented professionals and team members to help shape the future of home services in the UAE."}
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-xs text-center space-y-4">
        <Sparkles className="size-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">
          {isAr ? "هل أنت فني أو محترف خدمات؟" : "Are you a service professional?"}
        </h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          {isAr
            ? "انضم كشريك في سيرفس بلس واحصل على ساعات عمل مرنة ومصدر دخل ممتاز في دبي وجميع الإمارات."
            : "Partner with ServicePlus to enjoy flexible hours, competitive pay, and constant booking requests across Dubai and UAE."}
        </p>
        <Button className="bg-cyan-600 font-bold text-white hover:bg-cyan-700 rounded-full px-8 text-xs">
          {isAr ? "قدم الآن كشريك محترف" : "Apply as a Service Partner"}
        </Button>
      </div>
    </div>
  );
}
