import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminMaterials, updateAdminMaterial } from "@/frontend/lib/api-services";
import { AdminMaterial, AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/materials/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditMaterialPage,
});

function EditMaterialPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: materialsData } = useAdminQuery("materials", getAdminMaterials);
  const materials: AdminMaterial[] = (materialsData as AdminMaterial[]) ?? AdminDataStore.getMaterials();

  const material = materials.find((m) => m.id === id || String(m.id) === String(id)) ?? AdminDataStore.getMaterials().find((m) => m.id === id || String(m.id) === String(id));

  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Chemicals" | "Equipment" | "Disposables" | "PPE" | "Tools">("Chemicals");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [unit, setUnit] = useState("pcs");
  const [minAlert, setMinAlert] = useState("5");
  const [unitPrice, setUnitPrice] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (material) {
      setName(material.name || "");
      setCategory(material.category || "Chemicals");
      setSku(material.sku || "");
      setStock(String(material.stock || "0"));
      setUnit(material.unit || "pcs");
      setMinAlert(String(material.minStockAlert || "5"));
      setUnitPrice(String(material.unitPrice || "0"));
    }
  }, [material]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a material name (*)");
      return;
    }

    if (!id) {
      toast.error("Missing material ID");
      return;
    }

    try {
      setIsSubmitting(true);
      const currentStock = parseInt(stock, 10) || 0;
      const minStockAlert = parseInt(minAlert, 10) || 5;
      const status: "In Stock" | "Low Stock" | "Out of Stock" =
        currentStock === 0 ? "Out of Stock" : currentStock <= minStockAlert ? "Low Stock" : "In Stock";

      await updateAdminMaterial(id, {
        name: name.trim(),
        category: category,
        sku: sku.trim(),
        stock: currentStock,
        unit: unit.trim() || "pcs",
        minStockAlert: minStockAlert,
        unitPrice: parseFloat(unitPrice) || 0,
        status: status,
      });

      toast.success(`Material "${name}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      navigate({ to: "/admin/materials" });
    } catch {
      toast.error("Failed to update material");
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
          <Link to="/admin/materials" className="text-cyan-600 hover:underline font-semibold">
            Materials Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit Material</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Material</h1>
      </div>

      {/* Main Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Material Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Glass Cleaner Concentrated"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Category Classification</Label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chemicals" className="text-xs">Chemicals & Detergents</SelectItem>
                  <SelectItem value="Equipment" className="text-xs">Heavy Equipment</SelectItem>
                  <SelectItem value="Disposables" className="text-xs">Disposables</SelectItem>
                  <SelectItem value="PPE" className="text-xs">PPE Safety Gear</SelectItem>
                  <SelectItem value="Tools" className="text-xs">Hand Tools & Mops</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">SKU / Barcode Code</Label>
              <Input
                placeholder="e.g. MAT-1001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            {/* Current Stock */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Current Stock Quantity</Label>
              <Input
                type="number"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Packaging Unit</Label>
              <Input
                placeholder="e.g. bottles (1L), pcs, boxes"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Unit Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Unit Price (AED)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Min Alert */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Low Stock Alert Threshold</Label>
              <Input
                type="number"
                placeholder="5"
                value={minAlert}
                onChange={(e) => setMinAlert(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/materials" })}
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
