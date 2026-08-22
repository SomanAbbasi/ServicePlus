import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { upsertCoupon } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import { Loader2, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons/create")({ component: AddCouponPage });

function AddCouponPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"en" | "ar">("en");

  // Basic Info
  const [code, setCode] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");

  // Discount & Limits
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [firstBookingOnly, setFirstBookingOnly] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Please enter Promo Code and Discount Value (*)");
      return;
    }

    try {
      setIsSubmitting(true);

      // Combine descriptions if Arabic is provided
      let finalDescription = descEn.trim();
      if (descAr.trim()) {
        finalDescription = descEn.trim() ? `${descEn.trim()} | ${descAr.trim()}` : descAr.trim();
      }

      await upsertCoupon({
        code: code.trim().toUpperCase(),
        description: finalDescription || undefined,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        min_amount: minAmount ? parseFloat(minAmount) : 0,
        max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
        expires_at: expiresAt || null,
        max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
        per_user_limit: parseInt(perUserLimit) || 1,
        first_booking_only: firstBookingOnly,
        is_active: isActive,
      });

      toast.success(`Coupon "${code.toUpperCase()}" created successfully!`);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/admin/coupons" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 max-w-4xl">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <Link to="/admin/coupons" className="text-cyan-600 hover:underline font-semibold">
            Coupon Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Create Coupon</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Discount Promo Code</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/90 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          {/* Promo Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Promo Code <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs font-mono uppercase font-bold tracking-wider"
                autoComplete="off"
                name="coupon_code"
                data-lpignore="true"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Discount Type</Label>
              <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage" className="text-xs font-semibold">Percentage (%) Off</SelectItem>
                  <SelectItem value="fixed" className="text-xs font-semibold">Fixed Amount (AED) Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language Switcher Tabs for Description */}
          <div className="border-b border-slate-200 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("en")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                  activeTab === "en"
                    ? "border-cyan-600 text-cyan-600 bg-cyan-50/40 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
                }`}
              >
                <span className="text-sm">🇺🇸</span>
                <span>English Content</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ar")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                  activeTab === "ar"
                    ? "border-cyan-600 text-cyan-600 bg-cyan-50/40 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
                }`}
              >
                <span className="text-sm">🇦🇪</span>
                <span>المحتوى العربي</span>
              </button>
            </div>
          </div>

          {/* English Tab */}
          {activeTab === "en" && (
            <div className="space-y-3 animate-in fade-in-50 duration-150">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Coupon Description (English)</Label>
                <Input
                  placeholder="e.g. 20% off on all home cleaning services"
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* Arabic Tab */}
          {activeTab === "ar" && (
            <div className="space-y-3 animate-in fade-in-50 duration-150" dir="rtl">
              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-700">وصف الكوبون (عربي)</Label>
                <Input
                  placeholder="مثال: خصم 20% على جميع خدمات تنظيف المنازل"
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs text-right"
                />
              </div>
            </div>
          )}

          {/* Pricing & Limits Grid */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Discount Values & Limits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Discount Value */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Discount Value ({discountType === "percentage" ? "%" : "AED"}) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 20"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                  className="h-10 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Min Spend */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Min. Spend (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="h-10 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Max Discount */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Max Discount (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No limit"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  className="h-10 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Expires On</Label>
                <AdminDateInput
                  placeholder="Expires On"
                  value={expiresAt}
                  onChange={setExpiresAt}
                />
              </div>

              {/* Max Total Redemptions */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Total Redemptions Limit</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 1000"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  className="h-10 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Per User Limit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Per User Limit</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(e.target.value)}
                  className="h-10 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">First Booking Only</p>
                <p className="text-[11px] text-slate-400">Only eligible for new customer first orders</p>
              </div>
              <Switch checked={firstBookingOnly} onCheckedChange={setFirstBookingOnly} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Active Status</p>
                <p className="text-[11px] text-slate-400">Enable or disable this promo code</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/coupons" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 me-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Send className="size-3.5 me-1.5" /> Save Coupon
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
