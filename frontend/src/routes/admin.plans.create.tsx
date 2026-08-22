import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminPlan } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plans/create")({ component: AddPlanPage });

function AddPlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [price, setPrice] = useState("299.00");
  const [interval, setInterval] = useState<"Weekly" | "Bi-Weekly" | "Monthly" | "Annual">("Monthly");
  const [hoursIncluded, setHoursIncluded] = useState("16");
  const [discountPercent, setDiscountPercent] = useState("15");
  const [featuresStr, setFeaturesStr] = useState("Dedicated Cleaner\nFree eco chemicals\nPriority weekend booking\nFree rescheduling");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast.error("Please fill in mandatory fields (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      const featureList = featuresStr.split("\n").map((f) => f.trim()).filter(Boolean);
      await createAdminPlan({
        name: name.trim(),
        nameAr: nameAr.trim(),
        description: featureList.join(", "),
        price: parseFloat(price) || 0,
        interval: interval,
        hoursIncluded: parseInt(hoursIncluded) || 0,
        discountPercentage: parseInt(discountPercent) || 0,
        features: featureList,
        isActive: true,
      });

      toast.success(`Subscription plan ${name} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      navigate({ to: "/admin/plans" });
    } catch {
      toast.error("Failed to create subscription plan");
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
            Subscription Plans
          </Link>
          <span>/</span>
          <span className="text-slate-600">Create Plan</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Subscription Package</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Plan Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Plan Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter subscription plan title"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="plan_name_field"
                data-lpignore="true"
              />
            </div>

            {/* Arabic Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Arabic Title</Label>
              <Input
                placeholder="أدخل اسم الباقة بالعربية"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="plan_name_ar_field"
                data-lpignore="true"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Price (AED) <span className="text-red-500">*</span>
              </Label>
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

            {/* Billing Interval */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Billing Interval</Label>
              <Select value={interval} onValueChange={(v: any) => setInterval(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly" className="text-xs">Weekly</SelectItem>
                  <SelectItem value="Bi-Weekly" className="text-xs">Bi-Weekly</SelectItem>
                  <SelectItem value="Monthly" className="text-xs">Monthly</SelectItem>
                  <SelectItem value="Annual" className="text-xs">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hours Included */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Hours Included (Per Period)</Label>
              <Input
                type="number"
                placeholder="16"
                value={hoursIncluded}
                onChange={(e) => setHoursIncluded(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Discount Percent */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Discount Savings (%)</Label>
              <Input
                type="number"
                placeholder="15"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Features List */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Included Perks & Features (1 per line)</Label>
              <textarea
                rows={4}
                value={featuresStr}
                onChange={(e) => setFeaturesStr(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Enter plan perks line by line"
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
