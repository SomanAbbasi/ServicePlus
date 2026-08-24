import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Plus, Star } from "lucide-react";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { formatMoney, num } from "@/frontend/lib/money";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ServiceOptionsModal } from "@/frontend/components/ServiceOptionsModal";
import type { ServiceSummary, ServiceVariantSummary } from "@/frontend/lib/api-services";

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
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);

  const svcRecord = service as unknown as Record<string, unknown>;
  const name = localizedText(svcRecord, "name", locale) ?? service.name;
  const description =
    localizedText(svcRecord, "shortDescription", locale) ??
    localizedText(svcRecord, "short_description", locale) ??
    service.short_description ??
    (isAr ? "خدمة منزلية احترافية وموثوقة." : "Professional home service.");
  const imageUrl = resolveImageUrl(service.image_url) || FALLBACK_IMAGE;
  const rating = service.rating ?? 4.8;

  // Extract all variants to determine option count and starting price
  const variants: ServiceVariantSummary[] = useMemo(() => {
    if (Array.isArray(service.variants) && service.variants.length > 0) {
      return service.variants;
    }
    const groups = service.option_groups || service.optionGroups || [];
    const fromGroups: ServiceVariantSummary[] = [];
    for (const g of groups) {
      if (Array.isArray(g.options)) {
        fromGroups.push(...g.options);
      }
    }
    return fromGroups;
  }, [service]);

  const optionCount = variants.length;
  const hasOptions = optionCount > 0 || service.booking_type === "variant";

  // Calculate starting price
  const minPrice = useMemo(() => {
    if (variants.length > 0) {
      const prices = variants.map((v) => Number(v.price || 0)).filter((p) => p > 0);
      if (prices.length > 0) {
        return Math.min(...prices);
      }
    }
    return Number(service.base_price || 0);
  }, [variants, service.base_price]);

  return (
    <Link
      to="/booking/$slug"
      params={{ slug: service.slug }}
      className={`group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-500/40 cursor-pointer ${className}`}
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

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
          {/* Price section: "Starts at AED X" or standard price */}
          {hasOptions && minPrice > 0 ? (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {isAr ? "يبدأ من" : "Starts at"}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                AED {minPrice.toFixed(0)}
              </span>
            </div>
          ) : service.base_price && Number(service.base_price) > 0 ? (
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              AED {Number(service.base_price).toFixed(0)}
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-bold text-cyan-700">Best Price</span>
          )}

          {/* Consistent "Book now ->" Action button for all services */}
          <div className="inline-flex items-center justify-center gap-1 rounded-full bg-cyan-500 hover:bg-cyan-600 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-extrabold text-white transition-all shadow-xs group-hover:bg-cyan-600 active:scale-95 shrink-0">
            <span>{t("bookNow")}</span>
            {isAr ? <ArrowLeft className="size-3" /> : <ArrowRight className="size-3" />}
          </div>
        </div>
      </div>
    </Link>
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
