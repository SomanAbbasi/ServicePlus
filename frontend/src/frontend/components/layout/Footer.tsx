import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Logo } from "./Navbar";
import { useLocale } from "@/frontend/lib/locale";

type AreaLink = { kind: "service" | "category"; slug: string };

const SERVICE_AREAS: AreaLink[] = [
  { kind: "service", slug: "maid-service" },
  { kind: "service", slug: "carpet-cleaning" },
  { kind: "service", slug: "mattress-cleaning" },
  { kind: "service", slug: "sofa-cleaning" },
  { kind: "service", slug: "curtain-cleaning" },
  { kind: "category", slug: "home-cleaning" },
  { kind: "service", slug: "deep-cleaning" },
  { kind: "service", slug: "move-in-cleaning" },
  { kind: "service", slug: "house-cleaning" },
  { kind: "service", slug: "laundry-dry-cleaning" },
  { kind: "category", slug: "ac-cleaning" },
  { kind: "service", slug: "ac-cleaning" },
  { kind: "category", slug: "disinfection" },
  { kind: "service", slug: "disinfection-service" },
  { kind: "category", slug: "furniture-cleaning" },
  { kind: "service", slug: "furniture-cleaning" },
  { kind: "category", slug: "pest-control" },
  { kind: "service", slug: "pest-control-service" },
  { kind: "category", slug: "womens-salon" },
  { kind: "service", slug: "womens-salon" },
  { kind: "category", slug: "womens-spa" },
  { kind: "service", slug: "womens-spa" },
  { kind: "category", slug: "mens-grooming" },
  { kind: "service", slug: "mens-grooming" },
  { kind: "service", slug: "mens-salon" },
  { kind: "service", slug: "hair-salon" },
  { kind: "category", slug: "pcr-at-home" },
  { kind: "service", slug: "pcr-at-home" },
  { kind: "category", slug: "lab-at-home" },
  { kind: "service", slug: "lab-at-home" },
  { kind: "service", slug: "handyman-service" },
  { kind: "service", slug: "electrical-service" },
  { kind: "service", slug: "plumbing-service" },
  { kind: "service", slug: "home-painting" },
  { kind: "service", slug: "packers-and-movers" },
  { kind: "service", slug: "nurse-care-at-home" },
  { kind: "service", slug: "commercial-cleaning" },
  { kind: "service", slug: "office-cleaning" },
  { kind: "service", slug: "villa-cleaning" },
  { kind: "service", slug: "apartment-cleaning" },
];

const CATEGORIES = [
  { slug: "home-cleaning", labelKey: "footer.homeCleaning" },
  { slug: "pcr-at-home", labelKey: "area.pcr-at-home" },
  { slug: "womens-salon", labelKey: "footer.salonSpa" },
  { slug: "womens-spa", labelKey: "area.womens-spa" },
  { slug: "furniture-cleaning", labelKey: "area.furniture-cleaning" },
  { slug: "ac-cleaning", labelKey: "area.ac-cleaning" },
  { slug: "mens-grooming", labelKey: "area.premium-mens-grooming" },
  { slug: "lab-at-home", labelKey: "area.lab-at-home" },
  { slug: "pest-control", labelKey: "area.pest-control-service" },
  { slug: "disinfection", labelKey: "area.disinfection-service" },
];

const CITIES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"];

const chipClass =
  "inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs text-footer-foreground transition-colors hover:bg-white/20";

export function Footer() {
  const { t } = useLocale();

  const columns = [
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.about"), to: "/" as const },
        { label: t("footer.careers"), to: "/" as const },
        { label: t("footer.blog"), to: "/" as const },
        { label: t("footer.contactUs"), to: "/" as const },
      ],
    },
    {
      title: t("footer.services"),
      links: CATEGORIES.map((cat) => ({
        label: t(cat.labelKey),
        to: "/categories/$slug" as const,
        params: { slug: cat.slug },
      })),
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("footer.help"), to: "/" as const },
        { label: t("footer.terms"), to: "/" as const },
        { label: t("footer.privacy"), to: "/" as const },
      ],
    },
  ];

  return (
    <footer className="mt-16 bg-footer text-footer-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <h2 className="text-sm font-semibold">{t("footer.serviceAreas")}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {SERVICE_AREAS.map((area) => (
            <li key={`${area.kind}-${area.slug}`}>
              {area.kind === "service" ? (
                <Link to="/services/$slug" params={{ slug: area.slug }} className={chipClass}>
                  {t(`area.${area.slug}`)}
                </Link>
              ) : (
                <Link to="/categories/$slug" params={{ slug: area.slug }} className={chipClass}>
                  {t(`area.${area.slug}`)}
                </Link>
              )}
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

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="space-y-3">
          <span className="inline-flex rounded-lg bg-white p-2">
            <Logo />
          </span>
          <p className="max-w-xs text-sm text-footer-muted">{t("footer.tagline")}</p>
          <div className="flex gap-3 pt-1">
            {[Instagram, Facebook, Linkedin].map((Icon, i) => (
              <span
                key={i}
                className="grid size-9 place-items-center rounded-full bg-white/10"
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-footer-muted">
              {col.links.map((link) => (
                <li key={link.label}>
                  {"params" in link ? (
                    <Link
                      to={link.to}
                      params={link.params}
                      className="transition-colors hover:text-footer-foreground"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <Link to={link.to} className="transition-colors hover:text-footer-foreground">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-footer-muted sm:px-6">
          © {new Date().getFullYear()} ServicePlus. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
