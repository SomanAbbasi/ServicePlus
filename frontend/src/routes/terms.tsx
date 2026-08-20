import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "@/frontend/lib/locale";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-black text-slate-900 mb-6">
        {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
      </h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs text-slate-600 leading-relaxed">
        <p>
          {isAr
            ? "أهلاً بك في منصة سيرفس بلس. باستخدامك لخدماتنا وموقعنا الإلكتروني، فإنك توافق على الالتزام بالشروط والأحكام التالية."
            : "Welcome to ServicePlus. By accessing or using our platform and services across the UAE, you agree to be bound by these terms."}
        </p>
        <h3 className="text-sm font-bold text-slate-900 pt-2">{isAr ? "1. الحجوزات والدفع" : "1. Bookings & Payments"}</h3>
        <p>
          {isAr
            ? "يتم تسعير جميع الخدمات بالدرهم الإماراتي (AED). ينطبق الدفع إما نقدًا عند الاستلام أو بواسطة البطاقة البنكية."
            : "All service prices are quoted in AED. Payment can be settled via Cash on Delivery or credit/debit card."}
        </p>
        <h3 className="text-sm font-bold text-slate-900 pt-2">{isAr ? "2. سياسة الإلغاء" : "2. Cancellation Policy"}</h3>
        <p>
          {isAr
            ? "يمكن إلغاء الحجز مجانًا قبل 12 ساعة من موعد الخدمة المحدد."
            : "Free cancellation is permitted up to 12 hours prior to the scheduled service start time."}
        </p>
      </div>
    </div>
  );
}
