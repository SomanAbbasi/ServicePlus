import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Logo } from "./Navbar";
import { useLocale } from "@/frontend/lib/locale";

export function Footer() {
  const { t, locale } = useLocale();
  const isAr = locale === "ar";

  const CITIES = [
    { name: "Dubai", labelAr: "دبي" },
    { name: "Abu Dhabi", labelAr: "أبوظبي" },
    { name: "Sharjah", labelAr: "الشارقة" },
    { name: "Ajman", labelAr: "عجمان" },
  ];

  const companyLinks = [
    { label: t("footer.about"), to: "/about" as const },
    { label: t("footer.careers"), to: "/careers" as const },
    { label: t("footer.blog"), to: "/blog" as const },
    { label: t("footer.contactUs"), to: "/contact" as const },
  ];

  const supportLinks = [
    { label: t("footer.help"), to: "/help" as const },
    { label: t("footer.terms"), to: "/terms" as const },
    { label: t("footer.privacy"), to: "/privacy" as const },
  ];

  return (
    <footer className="mt-16 bg-footer text-footer-foreground">
      {/* UAE Service Coverage Banner */}
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <h2 className="text-sm font-semibold">{isAr ? "مناطق الخدمة في الإمارات" : "Service Areas in UAE"}</h2>
        <ul className="mt-3 flex flex-wrap gap-2.5">
          {CITIES.map((city) => (
            <li
              key={city.name}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-footer-foreground border border-white/10"
            >
              <MapPin className="size-3.5 text-cyan-400" />
              {isAr ? city.labelAr : city.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Main Links Grid (Clean 3-column layout without long Services list) */}
      <div className="mx-auto mt-10 grid max-w-7xl gap-10 border-t border-white/10 px-4 py-12 sm:px-6 md:grid-cols-3">
        {/* Brand & Tagline */}
        <div className="space-y-4">
          <span className="inline-flex rounded-lg bg-white p-2">
            <Logo />
          </span>
          <p className="max-w-xs text-sm leading-relaxed text-footer-muted">{t("footer.tagline")}</p>
        </div>

        {/* Company Section */}
        <div>
          <h3 className="text-sm font-semibold">{t("footer.company")}</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-footer-muted">
            {companyLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="transition-colors hover:text-footer-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support Section */}
        <div>
          <h3 className="text-sm font-semibold">{t("footer.support")}</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-footer-muted">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="transition-colors hover:text-footer-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Rights */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <p className="text-xs text-footer-muted">
            &copy; {new Date().getFullYear()} Service Plus FMP — A Division of Resources For Employment L.L.C. | info@serviceplus.ae
          </p>
          <div className="flex items-center gap-4 text-xs text-footer-muted">
            <Link to="/terms" className="hover:text-footer-foreground transition-colors">
              {t("footer.terms")}
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-footer-foreground transition-colors">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
