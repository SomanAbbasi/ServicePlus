import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Minus, Check, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";
import type { ServiceSummary, ServiceVariantSummary } from "@/frontend/lib/api-services";

interface ServiceOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceSummary;
}

export function ServiceOptionsModal({
  open,
  onOpenChange,
  service,
}: ServiceOptionsModalProps) {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const svcRecord = service as unknown as Record<string, unknown>;
  const serviceName = localizedText(svcRecord, "name", locale) ?? service.name;

  // Gather all variants from service
  const variants: ServiceVariantSummary[] = useMemo(() => {
    if (Array.isArray(service.variants) && service.variants.length > 0) {
      return service.variants;
    }
    // Check inside option groups if variants are nested
    const groups = service.option_groups || service.optionGroups || [];
    const fromGroups: ServiceVariantSummary[] = [];
    for (const g of groups) {
      if (Array.isArray(g.options)) {
        fromGroups.push(...g.options);
      }
    }
    return fromGroups;
  }, [service]);

  const handleUpdateQty = (variantId: string, delta: number, maxQty = 10) => {
    setQuantities((prev) => {
      const current = prev[variantId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      const copy = { ...prev };
      if (next === 0) {
        delete copy[variantId];
      } else {
        copy[variantId] = next;
      }
      return copy;
    });
  };

  const totalSelectedCount = useMemo(() => {
    return Object.values(quantities).reduce((sum, q) => sum + q, 0);
  }, [quantities]);

  const totalSelectedPrice = useMemo(() => {
    return Object.entries(quantities).reduce((sum, [id, qty]) => {
      const v = variants.find((item) => item.id === id);
      const price = Number(v?.price || 0);
      return sum + price * qty;
    }, 0);
  }, [quantities, variants]);

  const handleProceedToBooking = () => {
    // Construct variant string e.g. "id1:qty1,id2:qty2"
    const variantEntries = Object.entries(quantities).filter(([, q]) => q > 0);
    const variantsParam = variantEntries.map(([id, qty]) => `${id}:${qty}`).join(",");

    onOpenChange(false);
    navigate({
      to: "/booking/$slug",
      params: { slug: service.slug },
      search: variantsParam ? { variants: variantsParam } : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isAr ? "rtl" : "ltr"}
        className="max-w-lg w-full bg-white rounded-3xl p-0 overflow-hidden border-slate-200 shadow-2xl flex flex-col max-h-[88vh]"
      >
        {/* Modal Header Matching Reference Image 2 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {serviceName}
          </DialogTitle>
        </div>

        {/* Options List Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 min-h-0">
          {variants.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">
              {isAr ? "لا توجد خيارات متاحة حاليًا." : "No options available at the moment."}
            </div>
          ) : (
            variants.map((v) => {
              const vRecord = v as unknown as Record<string, unknown>;
              const optName = localizedText(vRecord, "name", locale) ?? v.name;
              const optDesc =
                localizedText(vRecord, "description", locale) ??
                localizedText(vRecord, "short_description", locale) ??
                v.description;
              const optImg = resolveImageUrl(v.image_url || v.imageUrl) || FALLBACK_IMAGE;
              const price = Number(v.price || 0);
              const originalPrice = v.original_price || v.originalPrice;
              const currentQty = quantities[v.id] || 0;
              const maxQty = v.max_quantity || v.maxQuantity || 10;

              return (
                <div
                  key={v.id}
                  className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    currentQty > 0
                      ? "border-cyan-500 bg-cyan-50/30 ring-1 ring-cyan-500/30 shadow-xs"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  {/* Left Graphic/Image & Title/Description */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="size-14 sm:size-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 flex items-center justify-center">
                      <img
                        src={optImg}
                        alt={optName}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                        {optName}
                      </h4>
                      {optDesc && (
                        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {optDesc}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                          AED {price.toFixed(0)}
                        </span>
                        {originalPrice && Number(originalPrice) > price && (
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                            AED {Number(originalPrice).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Button (Cyan Add+ / Quantity Stepper) */}
                  <div className="shrink-0">
                    {currentQty === 0 ? (
                      <Button
                        type="button"
                        onClick={() => handleUpdateQty(v.id, 1, maxQty)}
                        className="bg-[#00B4D8] hover:bg-[#0096c7] text-white font-extrabold text-xs px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-2xs active:scale-95 transition-all"
                      >
                        {isAr ? "إضافة +" : "Add +"}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full border border-cyan-500 bg-cyan-50 px-1.5 py-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(v.id, -1, maxQty)}
                          className="grid size-6 place-items-center rounded-full bg-white text-cyan-800 font-extrabold text-xs shadow-2xs hover:bg-slate-50 active:scale-90 transition-transform"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="text-xs font-black text-cyan-900 px-1.5">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(v.id, 1, maxQty)}
                          className="grid size-6 place-items-center rounded-full bg-cyan-600 text-white font-extrabold text-xs shadow-2xs hover:bg-cyan-700 active:scale-90 transition-transform"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Bottom Sticky Action Bar */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
            {totalSelectedCount > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 text-cyan-800 px-2.5 py-0.5 text-xs font-black">
                  <Check className="size-3" /> {totalSelectedCount} {isAr ? "محدد" : "selected"}
                </span>
                <span className="text-sm font-black text-slate-900">
                  AED {totalSelectedPrice.toFixed(0)}
                </span>
              </>
            ) : (
              <span className="text-slate-500 font-semibold">
                {isAr ? "اختر باقة للمتابعة" : "Select an option to proceed"}
              </span>
            )}
          </div>

          <Button
            type="button"
            disabled={totalSelectedCount === 0}
            onClick={handleProceedToBooking}
            className="w-full sm:w-auto bg-[#FFC836] hover:bg-[#f5be29] text-slate-900 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{isAr ? "متابعة الحجز" : "Continue to Booking"}</span>
            {isAr ? <ArrowLeft className="size-4 ms-1" /> : <ArrowRight className="size-4 ms-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
