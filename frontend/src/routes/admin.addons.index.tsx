import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAddon,
  deleteAddon,
  getAdminAddons,
  getAdminCatalog,
  setAddonService,
  updateAddon,
  uploadMedia,
} from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ErrorState, TableSkeleton } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/frontend/components/ui/dialog";
import {
  ArrowDown,
  ArrowUp,
  Edit,
  Filter,
  Layers,
  Loader2,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatMoney, num } from "@/frontend/lib/money";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/addons/")({ component: AdminAddons });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminAddons() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("addons", getAdminAddons);
  const catalog = useAdminQuery("catalog", getAdminCatalog);

  // Search & Filter State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchService, setSearchService] = useState("all");
  const [searchStatus, setSearchStatus] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    service: "all",
    status: "all",
  });

  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modal / Sheet State
  const [linking, setLinking] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  // Edit Multi-Language State
  const [editTab, setEditTab] = useState<"en" | "ar">("en");
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editDescEn, setEditDescEn] = useState("");
  const [editDescAr, setEditDescAr] = useState("");
  const [editIncludesEn, setEditIncludesEn] = useState("");
  const [editIncludesAr, setEditIncludesAr] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editDurationMinutes, setEditDurationMinutes] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin"] });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteAddon(id),
    onSuccess: () => {
      toast.success("Add-on deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linkMutation = useMutation({
    mutationFn: (vars: { addon_id: string; service_id: string; linked: boolean }) =>
      setAddonService(vars),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenEdit = (a: Row) => {
    setEditing(a);
    setEditTab("en");
    setEditNameEn(a.name || "");
    setEditNameAr(a.name_ar || a.nameAr || "");
    setEditDescEn(a.description || "");
    setEditDescAr(a.description_ar || a.descriptionAr || "");
    const inc = a.includes || [];
    setEditIncludesEn(Array.isArray(inc) ? inc.join("\n") : String(inc));
    const incAr = a.includes_ar || a.includesAr || [];
    setEditIncludesAr(Array.isArray(incAr) ? incAr.join("\n") : String(incAr));
    setEditPrice(String(a.price ?? 0));
    setEditOriginalPrice(a.original_price ? String(a.original_price) : "");
    setEditDurationMinutes(String(a.duration_minutes ?? 0));
    setEditImageUrl(a.image_url || a.imageUrl || "");
    setEditImageFile(null);
    setEditIsActive(a.is_active ?? a.isActive ?? true);
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      setEditImageFile(file);
      const compressed = await compressImageFile(file, { maxDimension: 800, quality: 0.85 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setEditImageUrl(dataUrl);
      toast.success("Image selected and compressed");
    } catch {
      toast.error("Failed to process image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editNameEn.trim() && !editNameAr.trim()) {
      toast.error("Add-on name is required.");
      return;
    }

    try {
      setIsEditSaving(true);

      let finalUrl = editImageUrl;
      if (editImageFile) {
        try {
          const compressed = await compressImageFile(editImageFile, { maxDimension: 800, quality: 0.85 });
          const res = await uploadMedia(compressed.filename, compressed.contentType, compressed.base64);
          if (res?.url) finalUrl = res.url;
        } catch {
          // Fallback
        }
      }

      const includesList = editIncludesEn
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const includesListAr = editIncludesAr
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await updateAddon({
        id: editing.id,
        name: editNameEn.trim() || editNameAr.trim(),
        name_ar: editNameAr.trim() || undefined,
        description: editDescEn.trim() || undefined,
        description_ar: editDescAr.trim() || undefined,
        includes: includesList.length > 0 ? includesList : undefined,
        includes_ar: includesListAr.length > 0 ? includesListAr : undefined,
        price: parseFloat(editPrice) || 0,
        original_price: editOriginalPrice ? parseFloat(editOriginalPrice) : null,
        duration_minutes: parseInt(editDurationMinutes) || 0,
        image_url: finalUrl || null,
        is_active: editIsActive,
      });

      toast.success(`Add-on "${editNameEn.trim() || editNameAr.trim()}" updated successfully!`);
      setEditing(null);
      invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update add-on");
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleToggleStatus = async (a: Row) => {
    const currentActive = a.is_active ?? a.isActive ?? true;
    const nextActive = !currentActive;
    try {
      await updateAddon({ id: a.id, is_active: nextActive });
      toast.success(`Add-on "${a.name}" is now ${nextActive ? "Activated" : "Deactivated"}`);
      invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: searchName.trim().toLowerCase(),
      service: searchService,
      status: searchStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchName("");
    setSearchService("all");
    setSearchStatus("all");
    setAppliedFilters({
      name: "",
      service: "all",
      status: "all",
    });
    setCurrentPage(1);
  };

  if (isError) return <ErrorState />;
  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-600">Add-ons</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add-on Facility Management</h1>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const rawAddons = (data.addons ?? []) as Row[];
  const links = (data.links ?? []) as Row[];
  const services = (catalog.data?.services ?? []) as Row[];

  // Sort by sort_order
  const sortedAddons = [...rawAddons].sort((a, b) => {
    const orderA = a.sort_order ?? a.sortOrder ?? 0;
    const orderB = b.sort_order ?? b.sortOrder ?? 0;
    return orderA - orderB;
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const nextList = [...sortedAddons];
    const [movedItem] = nextList.splice(draggedIndex, 1);
    nextList.splice(dropIndex, 0, movedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      for (let i = 0; i < nextList.length; i++) {
        const item = nextList[i];
        await updateAddon({
          id: item.id,
          sort_order: i,
        });
      }
      toast.success("Add-on order updated!");
      invalidate();
    } catch {
      toast.error("Failed to persist reordering");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sortedAddons.length) return;

    const nextList = [...sortedAddons];
    const [movedItem] = nextList.splice(index, 1);
    nextList.splice(targetIdx, 0, movedItem);

    try {
      for (let i = 0; i < nextList.length; i++) {
        const item = nextList[i];
        await updateAddon({
          id: item.id,
          sort_order: i,
        });
      }
      toast.success("Add-on order updated!");
      invalidate();
    } catch {
      toast.error("Failed to update sort order");
    }
  };

  // Filtered List
  const filteredAddons = sortedAddons.filter((a) => {
    if (appliedFilters.name) {
      const matchNameEn = (a.name || "").toLowerCase().includes(appliedFilters.name);
      const matchNameAr = (a.name_ar || a.nameAr || "").toLowerCase().includes(appliedFilters.name);
      const matchSlug = (a.slug || "").toLowerCase().includes(appliedFilters.name);
      if (!matchNameEn && !matchNameAr && !matchSlug) return false;
    }
    if (appliedFilters.service !== "all") {
      const hasLink = links.some((l) => l.addon_id === a.id && l.service_id === appliedFilters.service);
      if (!hasLink) return false;
    }
    if (appliedFilters.status !== "all") {
      const active = a.is_active ?? a.isActive ?? true;
      if (appliedFilters.status === "active" && !active) return false;
      if (appliedFilters.status === "inactive" && active) return false;
    }
    return true;
  });

  // Pagination calculation
  const totalItems = filteredAddons.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedAddons = filteredAddons.slice(startIndex, endIndex);

  return (
    <div className="space-y-5 text-slate-800">
      {/* Top Breadcrumb & Page Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-600">Add-on Facility</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add-on Facility Management</h1>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsSearchOpen((v) => !v)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-9 px-4 rounded-lg shadow-sm"
            >
              <Search className="size-3.5 me-1.5" /> Search
            </Button>
            <Link to="/admin/addons/create">
              <Button
                type="button"
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-9 px-4 rounded-lg shadow-sm"
              >
                <Plus className="size-3.5 me-1.5" /> Add Add-on
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Collapsible Search & Filter Panel */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Input
                  placeholder="Search Add-on Name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                  Applicable Service
                </label>
                <Select value={searchService} onValueChange={setSearchService}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Services
                    </SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs font-semibold">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                  Status
                </label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Status
                    </SelectItem>
                    <SelectItem value="active" className="text-xs text-emerald-600 font-bold">
                      Activated
                    </SelectItem>
                    <SelectItem value="inactive" className="text-xs text-rose-600 font-bold">
                      Deactivated
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 px-4 rounded-lg"
              >
                <RotateCcw className="size-3.5 me-1.5" /> Reset
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-9 px-5 rounded-lg shadow-sm"
              >
                <Filter className="size-3.5 me-1.5" /> Filter
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Sortable Table Card */}
      <Card className="overflow-hidden bg-white border-slate-200/90 rounded-2xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-14 text-center">#</th>
                <th className="px-3 py-3 w-16 text-center">Image</th>
                <th className="px-3 py-3">Add-on Item</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3 text-center">Duration</th>
                <th className="px-3 py-3 text-center">Offered With</th>
                <th className="px-3 py-3 text-center w-28">Status</th>
                <th className="px-3 py-3 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedAddons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold">No add-ons found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                paginatedAddons.map((a, idx) => {
                  const globalIdx = startIndex + idx;
                  const isActive = a.is_active ?? a.isActive ?? true;
                  const imgUrl = a.image_url || a.imageUrl;
                  const price = a.price ?? 0;
                  const duration = a.duration_minutes ?? a.durationMinutes ?? 0;
                  const linkedCount = links.filter((l) => l.addon_id === a.id).length;

                  return (
                    <tr
                      key={a.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, globalIdx)}
                      onDragOver={(e) => handleDragOver(e, globalIdx)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, globalIdx)}
                      className={`transition-all ${
                        draggedIndex === globalIdx
                          ? "opacity-35 bg-cyan-50/50"
                          : "hover:bg-slate-50/80"
                      } ${
                        dragOverIndex === globalIdx && draggedIndex !== globalIdx
                          ? "border-t-2 border-cyan-500 bg-cyan-50/40"
                          : ""
                      }`}
                    >
                      {/* Drag & Move Column */}
                      <td className="px-2 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={globalIdx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(globalIdx, "up");
                            }}
                            title="Move Up"
                            className="text-slate-400 hover:text-cyan-600 disabled:opacity-20 transition-colors p-0.5"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <div
                            title="Drag to reorder"
                            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-cyan-600 transition-colors"
                          >
                            <Menu className="size-4 shrink-0" />
                          </div>
                          <button
                            type="button"
                            disabled={globalIdx === sortedAddons.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(globalIdx, "down");
                            }}
                            title="Move Down"
                            className="text-slate-400 hover:text-cyan-600 disabled:opacity-20 transition-colors p-0.5"
                          >
                            <ArrowDown className="size-3" />
                          </button>
                        </div>
                      </td>

                      {/* Circular Image Column */}
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          {imgUrl ? (
                            <div className="size-10 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                              <img
                                src={resolveImageUrl(imgUrl)}
                                alt={a.name}
                                className="size-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="size-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs">
                              {a.name?.charAt(0) || "A"}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Add-on Name & Arabic Name */}
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{a.name}</div>
                        {(a.name_ar || a.nameAr) && (
                          <div className="text-xs text-slate-400 font-normal mt-0.5" dir="rtl">
                            {a.name_ar || a.nameAr}
                          </div>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3.5 font-medium text-slate-800 text-xs">
                        {formatMoney(num(price))}
                        {a.original_price && (
                          <span className="ms-1.5 text-[11px] font-normal text-slate-400 line-through">
                            AED {Number(a.original_price).toFixed(0)}
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-3 py-3.5 text-center text-slate-600 font-medium text-xs">
                        {duration > 0 ? `${duration} min` : "—"}
                      </td>

                      {/* Offered With Services */}
                      <td className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setLinking(a)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                        >
                          <Layers className="size-3" />
                          <span>{linkedCount} Services</span>
                        </button>
                      </td>

                      {/* Status Column with Soft Pill Badge */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(a)}
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition-all hover:opacity-85 ${
                            isActive
                              ? "bg-emerald-100/70 text-emerald-600 hover:bg-emerald-100"
                              : "bg-rose-100/70 text-rose-600 hover:bg-rose-100"
                          }`}
                        >
                          {isActive ? "Activated" : "Deactivated"}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(a)}
                            title="Edit Add-on"
                            className="size-8 p-0 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg"
                          >
                            <Edit className="size-3.5" />
                          </Button>

                          {/* Delete */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${a.name}"?`)) {
                                delMutation.mutate(a.id);
                              }
                            }}
                            title="Delete Add-on"
                            className="size-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
            <span className="text-slate-400 ms-2">
              Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0 border-slate-200 rounded-lg"
            >
              ‹
            </Button>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold">
              {validCurrentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 p-0 border-slate-200 rounded-lg"
            >
              ›
            </Button>
          </div>
        </div>
      </Card>

      {/* Multi-Language Edit Add-on Modal */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              Edit Add-on Facility
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update add-on details, English & Arabic descriptions, and pricing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {/* Circular Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Add-on Image</Label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center justify-center px-4 h-10 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition-colors shrink-0">
                  <Upload className="size-3.5 me-2 text-slate-500" />
                  {isCompressing ? "Processing..." : "Choose file"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleEditImageUpload}
                    className="hidden"
                  />
                </label>

                {editImageUrl && (
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                      <img src={resolveImageUrl(editImageUrl)} alt="" className="size-full object-cover" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditImageUrl("");
                        setEditImageFile(null);
                      }}
                      className="h-8 text-xs text-rose-600 hover:bg-rose-50 px-2"
                    >
                      <X className="size-3.5 me-1" /> Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Language Switcher Tabs */}
            <div className="border-b border-slate-200 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditTab("en")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                    editTab === "en"
                      ? "border-cyan-600 text-cyan-600 bg-cyan-50/40 rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
                  }`}
                >
                  <span className="text-sm">🇺🇸</span>
                  <span>English</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditTab("ar")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                    editTab === "ar"
                      ? "border-cyan-600 text-cyan-600 bg-cyan-50/40 rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
                  }`}
                >
                  <span className="text-sm">🇦🇪</span>
                  <span>عربي</span>
                </button>
              </div>
            </div>

            {/* Tab 1: English Fields */}
            {editTab === "en" && (
              <div className="space-y-3 animate-in fade-in-50 duration-150">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Add-on Name (English) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editNameEn}
                    onChange={(e) => setEditNameEn(e.target.value)}
                    placeholder="e.g. Fridge Cleaning"
                    className="h-10 text-xs"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Description (English)</Label>
                  <Input
                    value={editDescEn}
                    onChange={(e) => setEditDescEn(e.target.value)}
                    placeholder="e.g. We will clean the refrigerator inside out."
                    className="h-10 text-xs"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">What's Included (English)</Label>
                  <Textarea
                    value={editIncludesEn}
                    onChange={(e) => setEditIncludesEn(e.target.value)}
                    placeholder="One item per line"
                    rows={3}
                    className="text-xs"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Arabic Fields */}
            {editTab === "ar" && (
              <div className="space-y-3 animate-in fade-in-50 duration-150" dir="rtl">
                <div className="space-y-1 text-right">
                  <Label className="text-xs font-bold text-slate-700">
                    اسم الإضافة (عربي) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editNameAr}
                    onChange={(e) => setEditNameAr(e.target.value)}
                    placeholder="مثال: تنظيف الثلاجة"
                    className="h-10 text-xs text-right"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <Label className="text-xs font-bold text-slate-700">الوصف (عربي)</Label>
                  <Input
                    value={editDescAr}
                    onChange={(e) => setEditDescAr(e.target.value)}
                    placeholder="مثال: سنقوم بتنظيف الثلاجة من الداخل والخارج."
                    className="h-10 text-xs text-right"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <Label className="text-xs font-bold text-slate-700">ما تشمله الخدمة (عربي)</Label>
                  <Textarea
                    value={editIncludesAr}
                    onChange={(e) => setEditIncludesAr(e.target.value)}
                    placeholder="عنصر واحد في كل سطر"
                    rows={3}
                    className="text-xs text-right"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Price & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Price (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Original Price (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editOriginalPrice}
                  onChange={(e) => setEditOriginalPrice(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Duration (Minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editDurationMinutes}
                  onChange={(e) => setEditDurationMinutes(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-700">Active Status</p>
                <p className="text-[11px] text-slate-400">Enable or disable this add-on</p>
              </div>
              <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                className="h-9 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEditSaving || isCompressing}
                className="h-9 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isEditSaving ? (
                  <>
                    <Loader2 className="size-3.5 me-1.5 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Services Linking Sheet */}
      <Sheet open={Boolean(linking)} onOpenChange={(o) => !o && setLinking(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md bg-white p-6">
          <SheetHeader className="border-b border-slate-100 pb-4">
            <SheetTitle className="text-base font-extrabold text-slate-900">
              {linking?.name} — Link Services
            </SheetTitle>
            <p className="text-xs text-slate-500">
              Select which cleaning and home services show this add-on during booking.
            </p>
          </SheetHeader>
          {linking ? (
            <div className="mt-4 space-y-2.5">
              {services.map((s) => {
                const linked = links.some(
                  (l) => l.addon_id === linking.id && l.service_id === s.id,
                );
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800 truncate">{s.name}</span>
                    <Switch
                      checked={linked}
                      onCheckedChange={(v) =>
                        linkMutation.mutate({ addon_id: linking.id, service_id: s.id, linked: v })
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
