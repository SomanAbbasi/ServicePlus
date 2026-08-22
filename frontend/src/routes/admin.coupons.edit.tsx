import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminCoupons, upsertCoupon } from "@/frontend/lib/api-services";
import { AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditCouponPage,
});

function EditCouponPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: couponsData } = useAdminQuery("coupons", getAdminCoupons);
  const coupons = (couponsData as any[]) ?? [];

  const coupon = coupons.find((c) => c.id === id || c.code === id || String(c.id) === String(id)) ?? (AdminDataStore as any).getCoupons?.().find((c: any) => c.id === id || c.code === id || String(c.id) === String(id));

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("0");
  const [minAmount, setMinAmount] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code || "");
      setDescription(coupon.description || "");
      setDiscountType(coupon.discount_type || coupon.discountType || "percentage");
      setDiscountValue(String(coupon.discount_value ?? coupon.discountValue ?? 0));
      setMinAmount(String(coupon.min_amount ?? coupon.minAmount ?? 0));
      setExpiresAt(coupon.expires_at ? coupon.expires_at.slice(0, 10) : coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "");
      setIsActive(coupon.is_active ?? coupon.isActive ?? true);
    }
  }, [coupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Please enter Promo Code and Discount Value (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      await upsertCoupon({
        id: coupon?.id || id,
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        min_amount: parseFloat(minAmount) || 0,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      });

      toast.success(`Coupon "${code}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      navigate({ to: "/admin/coupons" });
    } catch {
      toast.error("Failed to update coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 max-w-5xl">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <Link to="/admin/coupons" className="text-cyan-600 hover:underline font-semibold">
            Coupons Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit Coupon</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Coupon</h1>
      </div>

      {/* Main Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Promo Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Promo Code <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. SUMMER25"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Discount Type</Label>
              <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage" className="text-xs">Percentage (%)</SelectItem>
                  <SelectItem value="fixed" className="text-xs">Fixed Amount (AED)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Discount Value <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="20"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Minimum Order Value */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Minimum Order Amount (AED)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="100"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Expiration Date</Label>
              <AdminDateInput
                placeholder="Expiration Date"
                value={expiresAt}
                onChange={setExpiresAt}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Coupon Terms & Description</Label>
              <Textarea
                rows={3}
                placeholder="Details of the promotion"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Status Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 md:col-span-2">
              <div>
                <Label className="text-xs font-bold text-slate-900">Coupon Status</Label>
                <p className="text-xs text-slate-500">When active, users can apply this coupon code at checkout.</p>
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
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              <Save className="size-3.5 me-1.5" /> {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
