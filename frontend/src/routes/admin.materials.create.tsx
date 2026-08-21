import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminMaterial } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/materials/create")({ component: AddMaterialPage });

function AddMaterialPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Chemicals");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [unit, setUnit] = useState("bottles (1L)");
  const [minAlert, setMinAlert] = useState("10");
  const [unitPrice, setUnitPrice] = useState("25.00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a material name (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAdminMaterial({
        name: name.trim(),
        category: category,
        sku: sku.trim() || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
        currentStock: parseInt(stock) || 0,
        unit: unit.trim() || "pcs",
        minAlertLevel: parseInt(minAlert) || 5,
        unitPrice: parseFloat(unitPrice) || 0,
      });

      toast.success(`Material ${name} added to inventory!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      navigate({ to: "/admin/materials" });
    } catch {
      toast.error("Failed to add material");
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
            Material Inventory
          </Link>
          <span>/</span>
          <span className="text-slate-600">Add New Material</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add New Cleaning Supply / Material</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Material Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Material / Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter material or chemical name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="mat_name_field"
                data-lpignore="true"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chemicals" className="text-xs">Chemicals</SelectItem>
                  <SelectItem value="Equipment" className="text-xs">Equipment</SelectItem>
                  <SelectItem value="Disposables" className="text-xs">Disposables</SelectItem>
                  <SelectItem value="PPE" className="text-xs">PPE</SelectItem>
                  <SelectItem value="Tools" className="text-xs">Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SKU Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">SKU Code</Label>
              <Input
                placeholder="Enter SKU (e.g. SKU-CHM-001)"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="mat_sku_field"
                data-lpignore="true"
              />
            </div>

            {/* Packaging Unit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Unit Description</Label>
              <Input
                placeholder="Enter packaging unit (e.g. bottles, pcs, boxes)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="mat_unit_field"
                data-lpignore="true"
              />
            </div>

            {/* Current Stock */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Initial Stock Quantity</Label>
              <Input
                type="number"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Min Alert Level */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Low Stock Alert Threshold</Label>
              <Input
                type="number"
                placeholder="10"
                value={minAlert}
                onChange={(e) => setMinAlert(e.target.value)}
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
