import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "@/frontend/lib/locale";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

function HelpPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const faqs = [
    {
      q: isAr ? "كيف يمكنني إعادة جدولة حجز خدمة؟" : "How do I reschedule or cancel a booking?",
      a: isAr ? "يمكنك إعادة جدولة أو إلغاء حجزك بسهولة حتى 12 ساعة قبل الموعد المحدد من خلال صفحة 'حجوزاتي'." : "You can reschedule or cancel your appointment for free up to 12 hours before the start time directly from 'My Bookings'.",
    },
    {
      q: isAr ? "هل نحتاج لتوفير أدوات ومواد التنظيف؟" : "Do I need to supply cleaning products or materials?",
      a: isAr ? "يمكنك اختيار خيار 'إحضار مواد التنظيف' أثناء الحجز وسيصل المحترف مع كافة المواد والمعدات اللازمة." : "You can simply select 'Bring cleaning materials' during booking, and our professional will arrive fully equipped.",
    },
    {
      q: isAr ? "ما هي طرق الدفع المتاحة؟" : "What payment options are accepted?",
      a: isAr ? "نقبل الدفع نقدًا عند الاستلام، وبطاقات الائتمان والخصم (Visa / Mastercard)." : "We accept Cash on Delivery and online payments via Visa or Mastercard credit/debit cards.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-extrabold text-cyan-800">
          <HelpCircle className="size-3.5 text-cyan-600" />
          {isAr ? "مركز المساعدة" : "Help Centre"}
        </span>
        <h1 className="text-3xl font-black text-slate-900">
          {isAr ? "كيف يمكننا مساعدتك اليوم؟" : "Frequently Asked Questions"}
        </h1>
      </div>

      <div className="mt-10 space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900">{f.q}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
