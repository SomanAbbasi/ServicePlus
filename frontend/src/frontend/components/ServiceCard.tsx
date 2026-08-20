import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { formatMoney, num } from "@/frontend/lib/money";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import type { ServiceSummary } from "@/frontend/lib/api-services";

export function ServiceCard({
  service,
  categoryName,
  className = "",
}: {
  service: ServiceSummary;
  categoryName?: string;
  className?: string;
}) {
  const { locale, t } = useLocale();
  const isAr = locale === "ar";
  const name = localizedText({ ...service }, "name", locale) ?? service.name;
  const description =
    service.short_description ??
    (isAr ? "خدمة منزلية احترافية وموثوقة." : "Professional home service.");
  const imageUrl = resolveImageUrl(service.image_url) || FALLBACK_IMAGE;
  const price = num(service.base_price);
  const rating = service.rating ?? 4.8;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-cyan-500/40 ${className}`}
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top-Left Category Badge */}
        {categoryName ? (
          <span className="absolute top-3 start-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-2xs backdrop-blur-xs">
            {categoryName}
          </span>
        ) : null}

        {/* Bottom-Right Star Rating Badge */}
        <div className="absolute bottom-3 end-3 flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
        </div>
      </div>

      {/* Content & Action */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-1">
            {name}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              FROM
            </span>
            <span className="text-base font-black text-slate-900">
              {formatMoney(price)}
            </span>
          </div>

          <Link
            to="/booking/$slug"
            params={{ slug: service.slug }}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-cyan-600 shadow-sm active:scale-95"
          >
            {t("bookNow")}
            {isAr ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-slate-200" />
          <div className="h-3 w-full animate-pulse rounded-md bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded-md bg-slate-100" />
        </div>
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="h-6 w-16 animate-pulse rounded-md bg-slate-200" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-900/10" />
        </div>
      </div>
    </div>
  );
}
