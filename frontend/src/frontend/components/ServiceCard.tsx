import { Link } from "@tanstack/react-router";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { formatMoney, num } from "@/frontend/lib/money";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import type { ServiceSummary } from "@/frontend/lib/api-services";

export function ServiceCard({
  service,
  className = "",
}: {
  service: ServiceSummary;
  className?: string;
}) {
  const { locale } = useLocale();
  const name = localizedText({ ...service }, "name", locale) ?? service.name;
  return (
    <Link
      to="/services/$slug"
      params={{ slug: service.slug }}
      className={`group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${className}`}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={resolveImageUrl(service.image_url) || FALLBACK_IMAGE}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {locale === "ar" ? "يبدأ من" : "From"} {formatMoney(num(service.base_price))}
        </p>
      </div>
    </Link>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
