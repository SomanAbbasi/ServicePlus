import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminAddon, getAdminServices } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/addons/create")({ component: AddAddonPage });

function AddAddonPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: servicesData } = useAdminQuery("services", getAdminServices);
  const services = (servicesData as any[]) ?? [];

  const [name, setName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [price, setPrice] = useState("45.00");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serviceId || !price) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedService = services.find((s) => s.id === serviceId);
      await createAdminAddon({
        name: name.trim(),
        serviceId: serviceId,
        serviceName: selectedService?.name || "Cleaning Service",
        price: parseFloat(price) || 0,
        durationMinutes: parseInt(durationMinutes) || 30,
        description: description.trim(),
        status: "Activated",
      });

      toast.success(`Add-on ${name} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "addons"] });
      navigate({ to: "/admin/addons" });
    } catch {
      toast.error("Failed to create add-on");
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
          <Link to="/admin/addons" className="text-cyan-600 hover:underline font-semibold">
            Add-ons
          </Link>
          <span>/</span>
          <span className="text-slate-600">Create Add-on</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Service Add-on</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Add-on Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Add-on Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Balcony Deep Wash"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="addon_name_field"
                data-lpignore="true"
              />
            </div>

            {/* Applicable Service */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Applicable Service <span className="text-red-500">*</span>
              </Label>
              <Select value={serviceId} onValueChange={setServiceId} required>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue placeholder="Select parent cleaning service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs font-semibold">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Add-on Extra Price (AED) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="45.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Additional Duration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Additional Time (Minutes)</Label>
              <Input
                type="number"
                placeholder="30"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Description</Label>
              <Input
                placeholder="Enter add-on details and extra deliverables"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="addon_desc_field"
                data-lpignore="true"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/addons" })}
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
