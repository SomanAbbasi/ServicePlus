import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminMaterial } from "@/frontend/lib/admin-mock-data";
import {
  getAdminMaterials,
  createAdminMaterial,
  updateAdminMaterial,
  deleteAdminMaterial,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/frontend/components/ui/dialog";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Download,
  Edit,
  Package,
  PackagePlus,
  Plus,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";

export const Route = createFileRoute("/admin/materials/")({ component: AdminMaterialsPage });

function AdminMaterialsPage() {
  const queryClient = useQueryClient();
  const { data: matsData } = useAdminQuery("materials", getAdminMaterials);
  const materials: AdminMaterial[] = (matsData as AdminMaterial[]) ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AdminMaterial["category"]>("Chemicals");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("50");
  const [unit, setUnit] = useState("bottles (1L)");
  const [minAlert, setMinAlert] = useState("20");
  const [unitPrice, setUnitPrice] = useState("25");

  // Adjust Stock Modal
  const [adjustMat, setAdjustMat] = useState<AdminMaterial | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("10");

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          (m.name || "").toLowerCase().includes(q) ||
          (m.sku || "").toLowerCase().includes(q) ||
          (m.category || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [materials, categoryFilter, searchTerm]);

  const totalPages = Math.ceil(filteredMaterials.length / pageSize) || 1;
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setCategory("Chemicals");
    setSku(`CHEM-${Math.floor(100 + Math.random() * 900)}`);
    setStock("50");
    setUnit("bottles (1L)");
    setMinAlert("20");
    setUnitPrice("25.00");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: AdminMaterial) => {
    setEditingId(m.id);
    setName(m.name);
    setCategory(m.category);
    setSku(m.sku);
    setStock(m.stock.toString());
    setUnit(m.unit);
    setMinAlert(m.minStockAlert.toString());
    setUnitPrice(m.unitPrice.toString());
    setIsModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Item Name is required.");
      return;
    }

    const stockNum = parseInt(stock) || 0;
    const minAlertNum = parseInt(minAlert) || 0;
    let status: AdminMaterial["status"] = "In Stock";
    if (stockNum <= 0) status = "Out of Stock";
    else if (stockNum <= minAlertNum) status = "Low Stock";

    if (editingId) {
      await updateAdminMaterial(editingId, {
        name,
        category,
        sku,
        stock: stockNum,
        unit,
        minStockAlert: minAlertNum,
        unitPrice: parseFloat(unitPrice) || 0,
        status,
      });
      toast.success(`Material ${name} updated!`);
    } else {
      await createAdminMaterial({
        name,
        category,
        sku,
        stock: stockNum,
        unit,
        minStockAlert: minAlertNum,
        unitPrice: parseFloat(unitPrice) || 0,
        status,
      });
      toast.success(`Material ${name} added to inventory!`);
    }

    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
  };

  const handleConfirmAdjustStock = async () => {
    if (!adjustMat) return;
    const delta = parseInt(adjustAmount) || 0;
    const newStock = Math.max(0, adjustMat.stock + delta);
    await updateAdminMaterial(adjustMat.id, { stock: newStock });
    toast.success(`Stock for ${adjustMat.name} adjusted to ${newStock} ${adjustMat.unit}`);
    setAdjustMat(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove inventory item "${name}"?`)) {
      await deleteAdminMaterial(id);
      toast.success(`${name} removed.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
    }
  };

  const handleExport = () => {
    downloadCsv(
      "serviceplus_inventory_materials.csv",
      filteredMaterials.map((m, i) => ({
        "#": i + 1,
        "Item Name": m.name,
        Category: m.category,
        SKU: m.sku,
        Stock: m.stock,
        Unit: m.unit,
        "Min Reorder Level": m.minStockAlert,
        "Unit Price (AED)": m.unitPrice.toFixed(2),
        Status: m.status,
      })),
    );
  };

  return (
    <div className="space-y-5 text-slate-800">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-600">Material Management</span>
          <span>/</span>
          <span className="text-slate-600">Material Inventory</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Material Management</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage stock levels, cleaning supplies, disinfectants, and specialized cleaning equipment.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs"
            >
              <Download className="size-3.5 me-1.5 text-slate-500" /> Export Inventory
            </Button>
            <Link to="/admin/materials/create">
              <Button
                type="button"
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm"
              >
                <Plus className="size-3.5 me-1.5" /> Add New Material
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card className="p-4 bg-white border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search materials by name or SKU…"
                className="ps-9 h-9 text-xs bg-slate-50/50"
              />
            </div>

            <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 text-xs w-40 bg-slate-50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Categories</SelectItem>
                <SelectItem value="Chemicals" className="text-xs">Chemicals</SelectItem>
                <SelectItem value="Equipment" className="text-xs">Equipment</SelectItem>
                <SelectItem value="Disposables" className="text-xs">Disposables</SelectItem>
                <SelectItem value="PPE" className="text-xs">PPE</SelectItem>
                <SelectItem value="Tools" className="text-xs">Tools</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20 text-xs bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="20" className="text-xs">20</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center text-slate-400">#</th>
                <th className="px-4 py-3 min-w-[220px]">Item / Material Name</th>
                <th className="px-3 py-3 min-w-[120px]">Category</th>
                <th className="px-4 py-3 min-w-[120px]">SKU</th>
                <th className="px-4 py-3 min-w-[130px]">Current Stock</th>
                <th className="px-4 py-3 min-w-[110px]">Unit Price</th>
                <th className="px-3 py-3 text-center min-w-[110px]">Status</th>
                <th className="px-4 py-3 text-center min-w-[130px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No material supplies found in inventory.
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((mat, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="size-4 text-cyan-600 shrink-0" />
                          <span className="font-bold text-slate-900">{mat.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {mat.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{mat.sku}</td>
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-slate-900">{mat.stock}</span>{" "}
                        <span className="text-slate-400 text-[11px]">{mat.unit}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">AED {mat.unitPrice.toFixed(2)}</td>
                      <td className="px-3 py-3 text-center">
                        {mat.status === "In Stock" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            In Stock
                          </span>
                        ) : mat.status === "Low Stock" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustMat(mat);
                              setAdjustAmount("10");
                            }}
                            title="Quick Adjust Stock"
                            className="text-emerald-600 hover:scale-110 transition-transform"
                          >
                            <PackagePlus className="size-4 text-emerald-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(mat)}
                            title="Edit Material"
                            className="text-cyan-600 hover:scale-110 transition-transform"
                          >
                            <Edit className="size-4 text-cyan-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(mat.id, mat.name)}
                            title="Delete Material"
                            className="text-rose-500 hover:scale-110 transition-transform"
                          >
                            <Trash2 className="size-4 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredMaterials.length)} of {filteredMaterials.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 px-2 text-xs"
            >
              ‹
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(p)}
                className={`h-8 w-8 p-0 text-xs font-bold ${
                  p === currentPage ? "bg-cyan-600 text-white hover:bg-cyan-700" : "text-slate-600"
                }`}
              >
                {p}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 px-2 text-xs"
            >
              ›
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Material Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <Boxes className="size-5 text-cyan-600" />
              {editingId ? "Edit Inventory Material" : "Add New Cleaning Supply / Material"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure inventory SKU, stock quantities, and replenish alert thresholds.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMaterial} autoComplete="off" className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Material / Product Name *</Label>
              <Input
                placeholder="Enter material or product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="off"
                name="mat_name_field"
                data-lpignore="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Category</Label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                  <SelectTrigger className="h-9 text-xs">
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

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">SKU Code</Label>
                <Input
                  placeholder="Enter SKU code"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  autoComplete="off"
                  name="mat_sku_field"
                  data-lpignore="true"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Current Stock</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Unit Description</Label>
                <Input
                  placeholder="Enter packaging unit (e.g. bottles, pcs, boxes)"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  autoComplete="off"
                  name="mat_unit_field"
                  data-lpignore="true"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Min. Alert Level</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAlert}
                  onChange={(e) => setMinAlert(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Unit Price (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold">
                Save Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Quick Modal */}
      <Dialog open={Boolean(adjustMat)} onOpenChange={(o) => !o && setAdjustMat(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PackagePlus className="size-4 text-emerald-600" /> Adjust Stock Count
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add restocked inventory for <span className="font-bold text-slate-800">{adjustMat?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p><span className="text-slate-500 font-medium">Current Stock:</span> <span className="font-bold text-slate-900">{adjustMat?.stock} {adjustMat?.unit}</span></p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Units to Add / Subtract</Label>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="+10 or -5"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setAdjustMat(null)} size="sm">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAdjustStock}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
