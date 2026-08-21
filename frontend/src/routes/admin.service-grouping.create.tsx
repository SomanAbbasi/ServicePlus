import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminBundle, getAdminServices } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/service-grouping/create")({ component: AddBundlePage });

function AddBundlePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: servicesData } = useAdminQuery("services", getAdminServices);
  const services = (servicesData as any[]) ?? [];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState("199.00");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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

    try {
      setIsSubmitting(true);
      await createAdminBundle({
        name: name.trim(),
        description: description.trim(),
        bundlePrice: parseFloat(bundlePrice) || 0,
        serviceIds: selectedServiceIds,
        status: "Activated",
      });

      toast.success(`Service bundle ${name} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
      navigate({ to: "/admin/service-grouping" });
    } catch {
      toast.error("Failed to create service bundle");
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
            Service Grouping / Bundles
          </Link>
          <span>/</span>
          <span className="text-slate-600">Create Package</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Promotional Bundle Package</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Package Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Package Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter package or bundle name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="pkg_name_field"
                data-lpignore="true"
              />
            </div>

            {/* Bundle Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Bundle Price (AED) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Description</Label>
              <Input
                placeholder="Enter package description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="pkg_desc_field"
                data-lpignore="true"
              />
            </div>

            {/* Bundled Services Selection */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">
                Included Cleaning Services <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/50 max-h-60 overflow-y-auto">
                {services.map((svc) => (
                  <label
                    key={svc.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <Checkbox
                      checked={selectedServiceIds.includes(svc.id)}
                      onCheckedChange={() => toggleService(svc.id)}
                    />
                    <span className="font-semibold text-slate-800 truncate">{svc.name}</span>
                  </label>
                ))}
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
