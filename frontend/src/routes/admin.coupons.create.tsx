import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminCoupon } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons/create")({ component: AddCouponPage });

function AddCouponPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("20");
  const [minOrderValue, setMinOrderValue] = useState("100");
  const [maxDiscount, setMaxDiscount] = useState("50");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [usageLimit, setUsageLimit] = useState("100");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Please fill in mandatory fields (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAdminCoupon({
        code: code.trim().toUpperCase(),
        discountType: discountType,
        discountValue: parseFloat(discountValue) || 0,
        minOrderAmount: parseFloat(minOrderValue) || 0,
        maxDiscountAmount: parseFloat(maxDiscount) || 0,
        validUntil: expiryDate,
        usageLimit: parseInt(usageLimit) || 100,
        status: "Active",
      });

      toast.success(`Coupon ${code} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      navigate({ to: "/admin/coupons" });
    } catch {
      toast.error("Failed to create coupon");
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
            Coupons
          </Link>
          <span>/</span>
          <span className="text-slate-600">Create Coupon</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Discount Promo Code</h1>
      </div>

      {/* Main Creation Card */}
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
                className="h-11 bg-white border-slate-200 rounded-lg text-xs font-mono uppercase"
                autoComplete="off"
                name="cpn_code_field"
                data-lpignore="true"
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Discount Type</Label>
              <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage" className="text-xs">Percentage (%) Off</SelectItem>
                  <SelectItem value="fixed" className="text-xs">Fixed Amount (AED) Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Discount Value ({discountType === "percentage" ? "%" : "AED"}) <span className="text-red-500">*</span>
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

            {/* Min Order Value */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Min. Order Value (AED)</Label>
              <Input
                type="number"
                placeholder="100"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Max Discount (for percentage) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Max Discount Limit (AED)</Label>
              <Input
                type="number"
                placeholder="50"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Valid Until / Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Usage Limit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Total Usage Limit</Label>
              <Input
                type="number"
                placeholder="100"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
