import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminPlans, updateAdminPlan } from "@/frontend/lib/api-services";
import { AdminPlan, AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plans/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditPlanPage,
});

function EditPlanPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: plansData } = useAdminQuery("plans", getAdminPlans);
  const plans: AdminPlan[] = (plansData as AdminPlan[]) ?? AdminDataStore.getPlans();

  const plan = plans.find((p) => p.id === id || String(p.id) === String(id)) ?? AdminDataStore.getPlans().find((p) => p.id === id || String(p.id) === String(id));

  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [interval, setInterval] = useState<"Weekly" | "Bi-Weekly" | "Monthly" | "Annual">("Monthly");
  const [hoursIncluded, setHoursIncluded] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [featuresStr, setFeaturesStr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name || "");
      setPrice(String(plan.price || "0"));
      setInterval((plan.interval as any) || "Monthly");
      setHoursIncluded(String(plan.hoursIncluded || "0"));
      setDiscountPercent(String(plan.discountPercentage || "0"));
      setFeaturesStr(Array.isArray(plan.features) ? plan.features.join("\n") : plan.description || "");
      setIsActive(plan.isActive ?? true);
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast.error("Please fill in mandatory fields (*)");
      return;
    }

    if (!id) {
      toast.error("Missing plan ID");
      return;
    }

    try {
      setIsSubmitting(true);
      const featureList = featuresStr.split("\n").map((f) => f.trim()).filter(Boolean);
      await updateAdminPlan(id, {
        name: name.trim(),
        description: featureList.join(", "),
        price: parseFloat(price) || 0,
        interval: interval,
        hoursIncluded: parseInt(hoursIncluded, 10) || 0,
        discountPercentage: parseInt(discountPercent, 10) || 0,
        features: featureList,
        isActive: isActive,
      });

      toast.success(`Plan "${name}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      navigate({ to: "/admin/plans" });
    } catch {
      toast.error("Failed to update plan");
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
          <Link to="/admin/plans" className="text-cyan-600 hover:underline font-semibold">
            Plans Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit Plan</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Plan</h1>
      </div>

      {/* Main Edit Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Plan Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Plan Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Silver Home Plan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Billing Interval */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Billing Cycle</Label>
              <Select value={interval} onValueChange={(v: any) => setInterval(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly" className="text-xs">Weekly</SelectItem>
                  <SelectItem value="Bi-Weekly" className="text-xs">Bi-Weekly</SelectItem>
                  <SelectItem value="Monthly" className="text-xs font-bold">Monthly</SelectItem>
                  <SelectItem value="Annual" className="text-xs">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Price (AED) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Included Hours */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Hours Included</Label>
              <Input
                type="number"
                placeholder="16"
                value={hoursIncluded}
                onChange={(e) => setHoursIncluded(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Discount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Discount Percentage (%)</Label>
              <Input
                type="number"
                placeholder="15"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Account Status</Label>
              <Select value={isActive ? "Activated" : "Deactivated"} onValueChange={(val: string) => setIsActive(val === "Activated")}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                  <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Features list */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Included Features (1 per line)</Label>
              <Textarea
                rows={4}
                value={featuresStr}
                onChange={(e) => setFeaturesStr(e.target.value)}
                className="bg-white border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/plans" })}
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
