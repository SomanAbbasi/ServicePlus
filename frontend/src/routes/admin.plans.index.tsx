import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPlan } from "@/frontend/lib/admin-mock-data";
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/frontend/components/ui/dialog";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Check, Edit, Plus, Sliders, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageActions, StatusBadge, ActionIconButton } from "@/frontend/components/admin/shell";

export const Route = createFileRoute("/admin/plans/")({ component: AdminPlansPage });

function AdminPlansPage() {
  const queryClient = useQueryClient();
  const { data: plansData } = useAdminQuery("plans", getAdminPlans);
  const plans: AdminPlan[] = (plansData as AdminPlan[]) ?? [];

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("499");
  const [interval, setInterval] = useState<AdminPlan["interval"]>("Monthly");
  const [hoursIncluded, setHoursIncluded] = useState("16");
  const [discountPercentage, setDiscountPercentage] = useState("20");
  const [featuresText, setFeaturesText] = useState(
    "4 visits per month (4 hours each)\nPreferred professional priority\nFree hospital-grade cleaning materials\nFlexible rescheduling up to 12h prior",
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setNameAr("");
    setDescription("");
    setPrice("399");
    setInterval("Monthly");
    setHoursIncluded("12");
    setDiscountPercentage("15");
    setFeaturesText("3 visits per month\nDedicated professional\nStandard tools included");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: AdminPlan) => {
    setEditingId(plan.id);
    setName(plan.name);
    setNameAr(plan.nameAr || "");
    setDescription(plan.description);
    setPrice(plan.price.toString());
    setInterval(plan.interval);
    setHoursIncluded(plan.hoursIncluded.toString());
    setDiscountPercentage(plan.discountPercentage.toString());
    setFeaturesText(plan.features.join("\n"));
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Plan Name is required.");
      return;
    }

    const featuresList = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingId) {
      await updateAdminPlan(editingId, {
        name,
        nameAr,
        description,
        price: parseFloat(price) || 0,
        interval,
        hoursIncluded: parseInt(hoursIncluded) || 0,
        discountPercentage: parseInt(discountPercentage) || 0,
        features: featuresList,
      });
      toast.success(`Plan "${name}" updated successfully!`);
    } else {
      await createAdminPlan({
        name,
        nameAr,
        description,
        price: parseFloat(price) || 0,
        interval,
        hoursIncluded: parseInt(hoursIncluded) || 0,
        discountPercentage: parseInt(discountPercentage) || 0,
        features: featuresList,
        isActive: true,
      });
      toast.success(`Plan "${name}" created!`);
    }

    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
  };

  const handleToggleActive = async (plan: AdminPlan) => {
    const next = !plan.isActive;
    await updateAdminPlan(plan.id, { isActive: next });
    toast.success(`Plan "${plan.name}" is now ${next ? "Active" : "Inactive"}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete subscription plan "${name}"?`)) {
      await deleteAdminPlan(id);
      toast.success(`Plan "${name}" removed.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Plans Management"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Service Management" }, { label: "Plans Management" }]}
        actions={
          <PageActions
            addNewLabel="Create Subscription Plan"
            addNewTo="/admin/plans/create"
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`p-5 bg-white rounded-2xl border shadow-xs flex flex-col justify-between transition-all ${
              plan.popular ? "border-cyan-400 ring-2 ring-cyan-100" : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800">
                    {plan.interval} Plan
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{plan.name}</h3>
                  {plan.nameAr && <p className="text-xs text-slate-400 font-medium">{plan.nameAr}</p>}
                </div>
                <button type="button" onClick={() => handleToggleActive(plan)}><StatusBadge status={plan.isActive ? "Active" : "Inactive"} /></button>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">AED {plan.price || 0}</span>
                <span className="text-xs text-slate-400 font-medium">/{(plan.interval || "Monthly").toLowerCase()}</span>
                {plan.discountPercentage > 0 && (
                  <span className="ms-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Save {plan.discountPercentage}%
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-2 font-medium">{plan.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Included Features ({plan.hoursIncluded} hrs/mo):
                </p>
                <ul className="space-y-1.5 font-medium text-slate-600">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="size-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
              <ActionIconButton icon={Sliders} label="Edit Plan" action="edit" to="/admin/plans/edit" search={{ id: plan.id }} />
              <ActionIconButton icon={Trash2} label="Delete Plan" action="delete" onClick={() => handleDelete(plan.id, plan.name)} />
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Plan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Sparkles className="size-5 text-primary" />
              {editingId ? "Edit Subscription Plan" : "Create Cleaning Subscription Plan"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Set monthly billing rates, included service hours, and perk checklists.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} autoComplete="off" className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Plan Title *</Label>
              <Input
                placeholder="Enter subscription plan title"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="off"
                name="plan_name_field"
                data-lpignore="true"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Arabic Title</Label>
              <Input
                placeholder="أدخل اسم الباقة بالعربية"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                autoComplete="off"
                name="plan_name_ar_field"
                data-lpignore="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Price (AED) *</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Billing Interval</Label>
                <Select value={interval} onValueChange={(v: any) => setInterval(v)}>
                  <SelectTrigger className="h-9 text-xs">
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
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Hours Included (Monthly)</Label>
                <Input
                  type="number"
                  value={hoursIncluded}
                  onChange={(e) => setHoursIncluded(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Discount Percentage (%)</Label>
                <Input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Description</Label>
              <Input
                placeholder="Brief plan summary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Features Checklist (1 per line)</Label>
              <textarea
                rows={3}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-bold">
                Save Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
