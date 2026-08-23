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
  ChevronsUpDown,
  Download,
  Edit2,
  Package,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  X,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";

export const Route = createFileRoute("/admin/materials/")({ component: AdminMaterialsPage });

function AdminMaterialsPage() {
  const queryClient = useQueryClient();
  const { data: matsData } = useAdminQuery("materials", getAdminMaterials);
  const materials: AdminMaterial[] = (matsData as AdminMaterial[]) ?? [];

  // Search box closed by default
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Quick Edit Modal
  const [editModalMat, setEditModalMat] = useState<AdminMaterial | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editNameUr, setEditNameUr] = useState("");
  const [editStatus, setEditStatus] = useState<"Activated" | "Deactivated">("Activated");

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== "ALL");

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (statusFilter !== "ALL") {
        const isAct = m.status === "Activated" || m.isActive;
        if (statusFilter === "Activated" && !isAct) return false;
        if (statusFilter === "Deactivated" && isAct) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          (m.name || "").toLowerCase().includes(q) ||
          (m.nameAr || "").toLowerCase().includes(q) ||
          (m.nameUr || "").toLowerCase().includes(q) ||
          (m.sku || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [materials, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredMaterials.length / pageSize) || 1;
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, currentPage, pageSize]);

  const handleToggleStatus = async (mat: AdminMaterial) => {
    const isCurrentlyActive = mat.status === "Activated" || mat.isActive !== false;
    const newStatus = isCurrentlyActive ? "Deactivated" : "Activated";
    await updateAdminMaterial(mat.id, {
      status: newStatus,
      isActive: !isCurrentlyActive,
    });
    toast.success(`Material ${mat.name} marked as ${newStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
  };

  const handleOpenEdit = (m: AdminMaterial) => {
    setEditModalMat(m);
    setEditName(m.name);
    setEditNameAr(m.nameAr || "");
    setEditNameUr(m.nameUr || "");
    setEditStatus((m.status === "Deactivated" ? "Deactivated" : "Activated") as any);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalMat) return;
    if (!editName.trim()) {
      toast.error("Material Name is required.");
      return;
    }

    await updateAdminMaterial(editModalMat.id, {
      name: editName.trim(),
      nameAr: editNameAr.trim(),
      nameUr: editNameUr.trim(),
      status: editStatus,
      isActive: editStatus === "Activated",
    });

    toast.success(`Material ${editName} updated!`);
    setEditModalMat(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteAdminMaterial(id);
      toast.success(`${name} deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
    }
  };

  const handleExport = () => {
    downloadCsv(
      "serviceplus_materials.csv",
      filteredMaterials.map((m, i) => ({
        "#": i + 1,
        Name: m.name,
        "Name (Arabic)": m.nameAr || "—",
        "Name (Urdu)": m.nameUr || "—",
        Status: m.status || "Activated",
        "Created On": m.createdOn || "09-01-2026 12:00 PM",
      })),
    );
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-600">Material Management</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Material Management</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage equipment, cleaning chemicals, disposables, and supplies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`font-semibold text-xs h-9 px-4 rounded-lg shadow-sm transition-all gap-1.5 ${
                showFilters
                  ? "bg-slate-800 hover:bg-slate-900 text-white"
                  : "bg-[#0088cc] hover:bg-[#0077b5] text-white"
              }`}
            >
              <Search className="size-3.5" />
              <span>Search</span>
              {hasActiveFilters && <span className="size-2 rounded-full bg-amber-400" />}
            </Button>
            <Link to="/admin/materials/create">
              <Button
                type="button"
                className="bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs h-9 px-4 rounded-lg shadow-sm"
              >
                <Plus className="size-4 me-1" /> Add Material
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs">
        {/* Search / Filter Drawer (Closed by default) */}
        {showFilters && (
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 mb-4 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by Material Name…"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="Activated" className="text-xs text-emerald-700 font-bold">Activated</SelectItem>
                    <SelectItem value="Deactivated" className="text-xs text-slate-500 font-bold">Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs font-semibold text-slate-600"
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="h-9 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <Download className="size-3.5 mr-1.5 text-slate-500" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page Size & Table Header */}
        <div className="flex justify-between items-center mb-3">
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

          <div className="text-xs text-slate-400 font-medium">
            Total {filteredMaterials.length} materials
          </div>
        </div>

        {/* Table Matching Reference Screenshot 1 */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 font-semibold bg-slate-50/70 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-12 text-center text-slate-400">#</th>
                <th className="px-4 py-3 w-20 text-center">Image</th>
                <th className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    Name <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center w-32">
                  <div className="flex items-center justify-center gap-1">
                    Status <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 w-48">
                  <div className="flex items-center gap-1">
                    Created On <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center w-28">
                  <div className="flex items-center justify-center gap-1 text-slate-600 font-bold">
                    Action
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No material supplies found.
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((mat, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = mat.status === "Activated" || mat.isActive !== false;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      
                      {/* Material Image Thumbnail */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-block size-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                          {mat.imageUrl ? (
                            <img
                              src={mat.imageUrl}
                              alt={mat.name}
                              className="size-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="size-full grid place-items-center text-cyan-600">
                              <Package className="size-5" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Material Name */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 text-xs">{mat.name}</p>
                        {mat.nameUr && (
                          <p className="text-[11px] text-slate-400 font-normal">{mat.nameUr}</p>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 text-center">
                        {isActivated ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#e8f8f0] text-[#1bb366]">
                            Activated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Created On Date */}
                      <td className="px-4 py-3.5 text-slate-600 font-normal text-xs whitespace-nowrap">
                        {mat.createdOn || "09-01-2026 12:10 PM"}
                      </td>

                      {/* Actions: Red Power/Cross, Blue Edit Pen, Red Trash */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          {/* Toggle Status (Red X / Power icon) */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(mat)}
                            title={isActivated ? "Deactivate Material" : "Activate Material"}
                            className="text-rose-500 hover:text-rose-700 transition-colors p-1 cursor-pointer"
                          >
                            <X className="size-4 stroke-[2.5]" />
                          </button>

                          {/* Edit Pen */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(mat)}
                            title="Edit Material"
                            className="text-[#0088cc] hover:text-[#006699] transition-colors p-1 cursor-pointer"
                          >
                            <Edit2 className="size-4 stroke-[2.2]" />
                          </button>

                          {/* Delete Trash */}
                          <button
                            type="button"
                            onClick={() => handleDelete(mat.id, mat.name)}
                            title="Delete Material"
                            className="text-rose-500 hover:text-rose-700 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="size-4 stroke-[2.2]" />
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

        {/* Footer Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredMaterials.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
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
                  p === currentPage ? "bg-[#0088cc] text-white hover:bg-[#0077b5]" : "text-slate-600"
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

      {/* Quick Edit Material Modal */}
      <Dialog open={Boolean(editModalMat)} onOpenChange={(o) => !o && setEditModalMat(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Edit Material
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Material Name (English) *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Sanitizers"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Material Name (Arabic / عربي)</Label>
              <Input
                value={editNameAr}
                onChange={(e) => setEditNameAr(e.target.value)}
                placeholder="e.g. معقمات"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Material Name (Urdu / اردو)</Label>
              <Input
                value={editNameUr}
                onChange={(e) => setEditNameUr(e.target.value)}
                placeholder="e.g. سینیٹائزرز"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Status</Label>
              <Select value={editStatus} onValueChange={(val: any) => setEditStatus(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activated" className="text-xs">Activated</SelectItem>
                  <SelectItem value="Deactivated" className="text-xs">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalMat(null)}
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

