import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "@/frontend/lib/locale";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-slate-900">
          {isAr ? "اتصل بنا" : "Contact Us"}
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {isAr
            ? "نحن هنا لمساعدتك والإجابة على أي استفسارات حول حجوزاتك وخدماتنا."
            : "We're here to help! Reach out with any questions about your bookings or custom service needs."}
        </p>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <Mail className="size-6 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">{isAr ? "البريد الإلكتروني" : "Email Us"}</h4>
              <p className="text-xs text-slate-600 mt-1 font-mono">somanabbasi305@gmail.com</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <Phone className="size-6 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">{isAr ? "الهاتف والواتساب" : "Call / WhatsApp"}</h4>
              <p className="text-xs text-slate-600 mt-1 font-mono">+971 50 123 4567</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <MapPin className="size-6 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">{isAr ? "الموقع" : "Location"}</h4>
              <p className="text-xs text-slate-600 mt-1">Al Wasl, Dubai, United Arab Emirates</p>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">{isAr ? "أرسل لنا رسالة" : "Send a Message"}</h3>
          <Input placeholder={isAr ? "الاسم الكامل" : "Full Name"} className="text-xs" />
          <Input type="email" placeholder={isAr ? "البريد الإلكتروني" : "Email Address"} className="text-xs" />
          <Textarea placeholder={isAr ? "رسالتك…" : "How can we help you?"} className="text-xs min-h-[100px]" />
          <Button className="w-full bg-cyan-600 font-bold text-white hover:bg-cyan-700 text-xs">
            {isAr ? "إرسال الرسالة" : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
