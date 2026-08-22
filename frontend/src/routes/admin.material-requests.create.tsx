import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  createAdminMaterialRequest,
  getAdminProfessionals,
  getAdminCompanies,
  getAdminMaterials,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/material-requests/create")({ component: AddMaterialRequestPage });

function AddMaterialRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: prosData } = useAdminQuery("professionals", getAdminProfessionals);
  const { data: matsData } = useAdminQuery("materials", getAdminMaterials);
  const { data: compData } = useAdminQuery("companies", getAdminCompanies);

  const pros = (prosData as any[]) ?? [];
  const materials = (matsData as any[]) ?? [];
  const companies = (compData as any[]) ?? [];

  const [proId, setProId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proId || !materialId || !quantity) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    const professional = pros.find((p) => p.id === proId);
    const material = materials.find((m) => m.id === materialId);
    const company = companies.find((c) => c.id === professional?.companyId);

    try {
      setIsSubmitting(true);
      await createAdminMaterialRequest({
        requestedBy: professional?.name || "Professional",
        requesterRole: "Professional",
        companyName: company?.name || professional?.companyName || "Partner Company",
        items: [
          {
            materialId: materialId,
            materialName: material?.name || "Material",
            quantity: parseInt(quantity) || 1,
          },
        ],
        urgency: urgency,
        status: "Pending",
        notes: notes.trim(),
      });

      toast.success("Material restock request submitted!");
      queryClient.invalidateQueries({ queryKey: ["admin", "material_requests"] });
      navigate({ to: "/admin/material-requests" });
    } catch {
      toast.error("Failed to submit material request");
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
          <Link to="/admin/material-requests" className="text-cyan-600 hover:underline font-semibold">
            Material Requests
          </Link>
          <span>/</span>
          <span className="text-slate-600">New Request</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Request Cleaning Material Restock</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Professional */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Requesting Professional <span className="text-red-500">*</span>
              </Label>
              <Select value={proId} onValueChange={setProId} required>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue placeholder="Select verified professional" />
                </SelectTrigger>
                <SelectContent>
                  {pros.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-semibold">
                      {p.name} ({p.companyName || "Service Partner"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Material */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Material / Supply Item <span className="text-red-500">*</span>
              </Label>
              <Select value={materialId} onValueChange={setMaterialId} required>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue placeholder="Select inventory item" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs font-semibold">
                      {m.name} (Stock: {m.currentStock} {m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Quantity Units <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Urgency */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Urgency Level</Label>
              <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal" className="text-xs">Normal (Standard Restock)</SelectItem>
                  <SelectItem value="Urgent" className="text-xs text-rose-600 font-bold">Urgent (Tomorrow Morning Shift)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Operational Notes */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Operational Notes / Reason</Label>
              <Input
                placeholder="Enter operational notes or project reason (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="mat_req_notes"
                data-lpignore="true"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/material-requests" })}
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
