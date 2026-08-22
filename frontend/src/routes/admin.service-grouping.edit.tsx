import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminBundles, updateAdminBundle, getAdminServices } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/service-grouping/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditBundlePage,
});

function EditBundlePage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: bundlesData } = useAdminQuery("bundles", getAdminBundles);
  const bundles = (bundlesData as any[]) ?? [];
  const { data: servicesData } = useAdminQuery("services", getAdminServices);
  const services = (servicesData as any[]) ?? [];

  const bundle = bundles.find((b) => b.id === id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState("0");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"Activated" | "Deactivated">("Activated");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bundle) {
      setName(bundle.name || "");
      setDescription(bundle.description || "");
      setBundlePrice(String(bundle.bundlePrice || bundle.price || "0"));
      setSelectedServiceIds(bundle.serviceIds || bundle.items?.map((it: any) => it.serviceId || it.id) || []);
      setStatus(bundle.status || "Activated");
    }
  }, [bundle]);

  const toggleService = (sId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(sId) ? prev.filter((x) => x !== sId) : [...prev, sId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bundlePrice) {
      toast.error("Please fill in mandatory fields (*)");
      return;
    }
    if (selectedServiceIds.length === 0) {
      toast.error("Please select at least one bundled service");
      return;
    }

    if (!id) {
      toast.error("Missing bundle ID");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateAdminBundle(id, {
        name: name.trim(),
        description: description.trim(),
        bundlePrice: parseFloat(bundlePrice) || 0,
        serviceIds: selectedServiceIds,
        status: status,
      });

      toast.success(`Service bundle "${name}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
      navigate({ to: "/admin/service-grouping" });
    } catch {
      toast.error("Failed to update service bundle");
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
          <Link to="/admin/service-grouping" className="text-cyan-600 hover:underline font-semibold">
            Service Grouping
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit Bundle Group</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Bundle Group</h1>
      </div>

      {/* Main Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Group Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Bundle Group Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Move-in Deep Cleaning Package"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Combined Bundle Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Combined Bundle Price (AED) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Account Status</Label>
              <Select value={status} onValueChange={(val: "Activated" | "Deactivated") => setStatus(val)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                  <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Description & Highlights</Label>
              <Textarea
                rows={3}
                placeholder="Describe why customers should choose this bundled offer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Included Services Selector */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">
                Included Services in Bundle <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 max-h-60 overflow-y-auto">
                {services.map((s) => {
                  const isChecked = selectedServiceIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "bg-cyan-50 border-cyan-300 text-cyan-900 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleService(s.id)}
                        className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                      <span className="truncate">{s.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/service-grouping" })}
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
