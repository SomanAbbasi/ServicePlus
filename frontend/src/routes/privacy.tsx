import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "@/frontend/lib/locale";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-black text-slate-900 mb-6">
        {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
      </h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs text-slate-600 leading-relaxed">
        <p>
          {isAr
            ? "في سيرفس بلس، نولي أهمية قصوى لخصوصية بياناتك وسريتها وفقًا لقوانين حماية البيانات في الإمارات."
            : "At ServicePlus, we prioritize protecting your personal data and location privacy in compliance with UAE regulations."}
        </p>
        <h3 className="text-sm font-bold text-slate-900 pt-2">{isAr ? "جمع البيانات واستخدامها" : "Data Collection & Usage"}</h3>
        <p>
          {isAr
            ? "نستخدم رقم هاتفك وعنوانك لتسهيل وصول المحترفين وإتمام الحجوزات بأعلى جودة."
            : "We collect phone numbers and delivery addresses exclusively to deliver efficient home services and verify bookings."}
        </p>
      </div>
    </div>
  );
}
