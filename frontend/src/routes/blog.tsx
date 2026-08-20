import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "@/frontend/lib/locale";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
});

function BlogPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const posts = [
    {
      title: isAr ? "نصائح للتنظيف العميق وتطهير المنازل قبل الصيف" : "Essential Deep Cleaning Tips for UAE Homes Before Summer",
      desc: isAr ? "كيف تحافظ على انتعاش منزلك وجودة الهواء مع بدء موسم الحرارة في دبي." : "Keep your indoor air fresh and living space sparkling during peak Dubai heat.",
      date: "18 Aug 2026",
    },
    {
      title: isAr ? "كيف تختار خدمة مكافحة الحشرات المناسبة لشقتك" : "How to Choose the Right Pest Control Solution for Your Apartment",
      desc: isAr ? "دليل شامل للتعامل مع مكافحة الصراصير والنمل وبق الفراش بأمان." : "A complete guide to safe eco-friendly pest extermination for apartments and villas.",
      date: "14 Aug 2026",
    },
    {
      title: isAr ? "فوائد تنظيف غسيل المكيفات بانتظام في الإمارات" : "Why Regular AC Coil Cleaning Saves Energy & Money in Dubai",
      desc: isAr ? "تعرف على كيفية تحسين كفاءة التكييف وتقليل فواتير الكهرباء." : "Learn how professional AC sanitization improves cooling efficiency and lowers DEWA bills.",
      date: "10 Aug 2026",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-extrabold text-cyan-800">
          <BookOpen className="size-3.5 text-cyan-600" />
          {isAr ? "مدونة سيرفس بلس" : "ServicePlus Journal"}
        </span>
        <h1 className="text-3xl font-black text-slate-900">
          {isAr ? "نصائح وإرشادات العناية بالمنزل" : "Home Care Tips & Guides"}
        </h1>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {posts.map((p, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-cyan-600">{p.date}</span>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
