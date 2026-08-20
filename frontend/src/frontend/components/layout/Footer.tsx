import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Logo } from "./Navbar";
import { useLocale } from "@/frontend/lib/locale";

type AreaLink = { kind: "service" | "category"; slug: string };

const CATEGORIES = [
  { slug: "home-cleaning", labelKey: "footer.homeCleaning" },
  { slug: "laundry-dry-cleaning", labelKey: "area.laundry-dry-cleaning" },
  { slug: "pest-control", labelKey: "area.pest-control-service" },
  { slug: "handyman", labelKey: "footer.handyman" },
  { slug: "pcr-at-home", labelKey: "area.pcr-at-home" },
  { slug: "womens-salon", labelKey: "footer.salonSpa" },
  { slug: "womens-spa", labelKey: "area.womens-spa" },
  { slug: "furniture-cleaning", labelKey: "area.furniture-cleaning" },
  { slug: "ac-cleaning", labelKey: "area.ac-cleaning" },
  { slug: "mens-grooming", labelKey: "area.premium-mens-grooming" },
  { slug: "lab-at-home", labelKey: "area.lab-at-home" },
  { slug: "disinfection", labelKey: "area.disinfection-service" },
  { slug: "deep-cleaning", labelKey: "area.deep-cleaning" },
  { slug: "carpet-cleaning", labelKey: "area.carpet-cleaning" },
  { slug: "sofa-cleaning", labelKey: "area.sofa-cleaning" },
  { slug: "mattress-cleaning", labelKey: "area.mattress-cleaning" },
];

const CITIES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"];

const chipClass =
  "inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs text-footer-foreground transition-colors hover:bg-white/20";

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export function Footer() {
  const { t } = useLocale();

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
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <h2 className="text-sm font-semibold">{t("footer.serviceAreas")}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <Link to="/categories/$slug" params={{ slug: cat.slug }} className={chipClass}>
                {t(cat.labelKey)}
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="mt-8 text-sm font-semibold">{t("footer.uae")}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <li key={city} className="rounded-full bg-white/10 px-3 py-1.5 text-xs">
              {t(`city.${city}`)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-12 grid max-w-7xl gap-10 border-t border-white/10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="space-y-4">
          <span className="inline-flex rounded-lg bg-white p-2">
            <Logo />
          </span>
          <p className="max-w-xs text-sm leading-relaxed text-footer-muted">{t("footer.tagline")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{t("footer.company")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-footer-muted">
            {companyLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="transition-colors hover:text-footer-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{t("footer.services")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-footer-muted">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to="/categories/$slug"
                  params={{ slug: cat.slug }}
                  className="transition-colors hover:text-footer-foreground"
                >
                  {t(cat.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{t("footer.support")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-footer-muted">
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

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <p className="text-xs text-footer-muted">
            &copy; {new Date().getFullYear()} ServicePlus. {t("footer.rights")}
          </p>
          <div className="flex gap-3">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid size-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
