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
  const svcRecord = service as unknown as Record<string, unknown>;
  const name = localizedText(svcRecord, "name", locale) ?? service.name;
  const description =
    localizedText(svcRecord, "shortDescription", locale) ??
    localizedText(svcRecord, "short_description", locale) ??
    service.short_description ??
    (isAr ? "خدمة منزلية احترافية وموثوقة." : "Professional home service.");
  const imageUrl = resolveImageUrl(service.image_url) || FALLBACK_IMAGE;
  const rating = service.rating ?? 4.8;
  const durationText = (service as any).duration_minutes ? `⚡ ${(service as any).duration_minutes} mins` : "⚡ 30 mins";

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-500/40 ${className}`}
    >
      {/* Image Container with Badges (Matching Image 2 Reference UI) */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top-Left Duration Badge (⚡ 30 mins) */}
        <span className="absolute top-2 start-2 sm:top-3 sm:start-3 rounded-md bg-amber-400/95 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-extrabold text-slate-900 shadow-2xs backdrop-blur-xs">
          {durationText}
        </span>

        {/* Bottom-Right Star Rating Badge */}
        <div className="absolute bottom-2 end-2 sm:bottom-3 sm:end-3 flex items-center gap-1 rounded-full bg-slate-900/85 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-extrabold text-white shadow-md">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
        </div>
      </div>

      {/* Content & Action */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-xs sm:text-base font-extrabold text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-1">
            {name}
          </h3>
          <p className="hidden sm:block text-xs text-slate-500 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
          {service.base_price && Number(service.base_price) > 0 ? (
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              AED {Number(service.base_price).toFixed(0)}
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-bold text-cyan-700">Best Price</span>
          )}

          <Link
            to="/booking/$slug"
            params={{ slug: service.slug }}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-cyan-500 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-extrabold text-white transition-all hover:bg-cyan-600 shadow-xs active:scale-95 shrink-0"
          >
            <span>{t("bookNow")}</span>
            {isAr ? <ArrowLeft className="size-3" /> : <ArrowRight className="size-3" />}
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
