import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteCategory,
  getAdminCatalog,
  setServiceListing,
  updateCategory,
  uploadMedia,
} from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { ErrorState, TableSkeleton, PageHeader, PageActions, StatusBadge, ActionIconButton, downloadCsv } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  Edit,
  Filter,
  Layers,
  Loader2,
  Menu,
  MoreVertical,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/categories/")({ component: AdminCategories });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminCategories() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("catalog", getAdminCatalog);

  // Search & Filter Panel State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    status: "all",
  });

  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modals & Sheets State
  const [editing, setEditing] = useState<Row | null>(null);
  const [listingFor, setListingFor] = useState<Row | null>(null);

  // Edit Form State
  const [editTab, setEditTab] = useState<"en" | "ar">("en");
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const listMutation = useMutation({
    mutationFn: (vars: { category_id: string; service_id: string; listed: boolean }) =>
      setServiceListing(vars),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenEdit = (c: Row) => {
    setEditing(c);
    setEditTab("en");
    setEditNameEn(c.name || "");
    setEditNameAr(c.name_ar || c.nameAr || "");
    setEditImageUrl(c.image_url || c.imageUrl || "");
    setEditImageFile(null);
    setEditIsActive(c.is_active ?? c.isActive ?? true);
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
      toast.error("Category name is required.");
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
          // Fallback to data URL
        }
      }

      await updateCategory({
        id: editing.id,
        name: editNameEn.trim() || editNameAr.trim(),
        name_ar: editNameAr.trim() || undefined,
        image_url: finalUrl || null,
        is_active: editIsActive,
      });

      toast.success(`Category "${editNameEn.trim() || editNameAr.trim()}" updated successfully!`);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update category");
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleToggleStatus = async (c: Row) => {
    const currentActive = c.is_active ?? c.isActive ?? true;
    const nextActive = !currentActive;
    try {
      await updateCategory({ id: c.id, is_active: nextActive });
      toast.success(`Category "${c.name}" is now ${nextActive ? "Activated" : "Deactivated"}`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: searchName.trim().toLowerCase(),
      status: searchStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchName("");
    setSearchStatus("all");
    setAppliedFilters({
      name: "",
      status: "all",
    });
    setCurrentPage(1);
  };

  if (isError) return <ErrorState />;
  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-primary hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-600">Category Management</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Category Management</h1>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const rawCategories = (data.categories ?? []) as Row[];
  const services = (data.services ?? []) as Row[];
  const listings = (data.listings ?? []) as Row[];

  // Sort by sort_order
  const sortedCategories = [...rawCategories].sort((a, b) => {
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

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const list = [...sortedCategories];
    const [moved] = list.splice(draggedIndex, 1);
    list.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);

    // Optimistically update query cache
    qc.setQueryData(["admin", "catalog"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        categories: list.map((cat, idx) => ({ ...cat, sort_order: idx, sortOrder: idx })),
      };
    });

    try {
      const promises = list.map((cat, idx) =>
        updateCategory({ id: cat.id, sort_order: idx }),
      );
      await Promise.all(promises);
      toast.success("Category order updated");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update category order");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const list = [...sortedCategories];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    // Optimistically update query cache
    qc.setQueryData(["admin", "catalog"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        categories: list.map((cat, idx) => ({ ...cat, sort_order: idx, sortOrder: idx })),
      };
    });

    try {
      const promises = list.map((cat, idx) =>
        updateCategory({ id: cat.id, sort_order: idx }),
      );
      await Promise.all(promises);
      toast.success("Category order updated");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update category order");
    }
  };

  // Filtered categories
  const filteredCategories = sortedCategories.filter((c) => {
    if (appliedFilters.name) {
      const matchEn = (c.name || "").toLowerCase().includes(appliedFilters.name);
      const matchAr = (c.name_ar || c.nameAr || "").toLowerCase().includes(appliedFilters.name);
      if (!matchEn && !matchAr) return false;
    }
    if (appliedFilters.status !== "all") {
      const isActive = c.is_active ?? c.isActive ?? true;
      if (appliedFilters.status === "Activated" && !isActive) return false;
      if (appliedFilters.status === "Deactivated" && isActive) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-5 text-slate-800">
      {/* Breadcrumbs & Header Actions matching Screenshot 3 */}
      <PageHeader
        title="Category Management"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Category Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen((v) => !v)}
            isSearchOpen={isSearchOpen}
            addNewLabel="Add Category"
            addNewTo="/admin/categories/create"
          />
        }
      />
      

      {/* Collapsible Search & Filter Panel */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  placeholder="Search Name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                  Status
                </label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">Select Status</SelectItem>
                    <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                    <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
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
                className="font-bold text-xs h-9 px-5 rounded-lg shadow-sm"
              >
                <Filter className="size-3.5 me-1.5" /> Filter
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Table Card matching Image 3 */}
      <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20 text-xs bg-slate-50 rounded-lg">
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
            Total {filteredCategories.length} categor{filteredCategories.length === 1 ? "y" : "ies"}
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-14 text-center">#</th>
                <th className="px-3 py-3 w-16 text-center">Image</th>
                <th className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-28">
                  <div className="flex items-center justify-center gap-1">
                    Status <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-24">
                  <div className="flex items-center justify-center gap-1 text-slate-600 font-bold">
                    Action <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No categories found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((c, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  const isActive = c.is_active ?? c.isActive ?? true;
                  const imgUrl = c.image_url || c.imageUrl;

                  return (
                    <tr
                      key={c.id}
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
                          ? "border-t-2 border-cyan-500 bg-primary/10"
                          : ""
                      }`}
                    >
                      {/* Reorder / Drag Handle Column */}
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
                            className="text-slate-400 hover:text-primary disabled:opacity-20 transition-colors p-0.5"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <div
                            title="Drag to reorder"
                            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                          >
                            <Menu className="size-4 shrink-0" />
                          </div>
                          <button
                            type="button"
                            disabled={globalIdx === sortedCategories.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(globalIdx, "down");
                            }}
                            title="Move Down"
                            className="text-slate-400 hover:text-primary disabled:opacity-20 transition-colors p-0.5"
                          >
                            <ArrowDown className="size-3" />
                          </button>
                        </div>
                      </td>

                      {/* Circular Image Column matching Screenshot 3 */}
                      <td className="px-3 py-3.5">
                        <div className="size-10 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-2xs">
                          {imgUrl ? (
                            <img
                              src={resolveImageUrl(imgUrl) || FALLBACK_IMAGE}
                              alt={c.name}
                              className="size-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                              }}
                            />
                          ) : (
                            <Sparkles className="size-4 text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Name Column */}
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                        {(c.name_ar || c.nameAr) && (
                          <div className="text-xs text-slate-400 font-normal mt-0.5">
                            {c.name_ar || c.nameAr}
                          </div>
                        )}
                      </td>

                      {/* Status Column with Soft Pill Badge */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <button type="button" onClick={() => handleToggleStatus(c)}><StatusBadge status={isActive ? "Activated" : "Deactivated"} /></button>
                      </td>

                      {/* Action Column matching Screenshot 3 */}
                      <td className="px-3 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          {/* Toggle status icon: Red X when active (to deactivate), Green check when inactive (to activate) */}
                          <ActionIconButton icon={isActive ? X : Check} label={isActive ? "Deactivate Category" : "Activate Category"} action={isActive ? "delete" : "view"} onClick={() => handleToggleStatus(c)} />

                          {/* Edit button */}
                          <Link
                            to="/admin/categories/edit"
                            search={{ id: c.id }}
                            title="Edit Category"
                            className="text-primary hover:scale-125 transition-transform inline-flex items-center justify-center"
                          >
                            <Sliders className="size-4 text-primary stroke-[2.5]" />
                          </Link>

                          {/* More menu (Manage Services, Delete) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                title="More actions"
                                className="text-slate-600 hover:scale-125 transition-transform p-0.5"
                              >
                                <MoreVertical className="size-4 text-slate-600 stroke-[2.5]" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-white border-slate-200">
                              <DropdownMenuItem
                                onClick={() => setListingFor(c)}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Layers className="size-3.5 me-2 text-primary" /> Manage Services
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(`Delete category "${c.name}"? This cannot be undone.`)) {
                                    delMutation.mutate(c.id);
                                  }
                                }}
                                className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="size-3.5 me-2 text-rose-600" /> Delete Category
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredCategories.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredCategories.length)} of {filteredCategories.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 px-2 text-xs rounded-lg"
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
                className={`h-8 w-8 p-0 text-xs font-bold rounded-lg ${ p === currentPage ? "" : "text-slate-600" }`}
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
              className="h-8 px-2 text-xs rounded-lg"
            >
              ›
            </Button>
          </div>
        </div>
      </Card>

      {/* Clean Edit Category Modal (Removed unused fields: intro, seo, sections, faqs, slug, sort_order) */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-xl bg-white rounded-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Edit Category
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update category title, description, image, and active status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Category Image</Label>
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
                    <div className="size-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center shadow-xs">
                      <img
                        src={resolveImageUrl(editImageUrl) || FALLBACK_IMAGE}
                        alt=""
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                      />
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

            {/* Language Tabs */}
            <div className="border-b border-slate-200 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditTab("en")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                    editTab === "en"
                      ? "border-primary text-primary bg-primary/10 rounded-t-lg"
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
                      ? "border-primary text-primary bg-primary/10 rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
                  }`}
                >
                  <span className="text-sm">🇦🇪</span>
                  <span>عربي</span>
                </button>
              </div>
            </div>

            {/* Tab 1: English */}
            {editTab === "en" && (
              <div className="space-y-3 animate-in fade-in-50 duration-150">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editNameEn}
                    onChange={(e) => setEditNameEn(e.target.value)}
                    placeholder="e.g. Home Cleaning"
                    className="h-10 text-xs"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Arabic */}
            {editTab === "ar" && (
              <div className="space-y-3 animate-in fade-in-50 duration-150" dir="rtl">
                <div className="space-y-1 text-right">
                  <Label className="text-xs font-bold text-slate-700">
                    الاسم <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editNameAr}
                    onChange={(e) => setEditNameAr(e.target.value)}
                    placeholder="مثال: تنظيف المنازل"
                    className="h-10 text-xs text-right"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Status Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-700">Active Status</p>
                <p className="text-[11px] text-slate-400">Enable or disable category availability in catalog</p>
              </div>
              <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                className="h-9 text-xs font-bold rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEditSaving || isCompressing}
                className="h-9 text-xs font-bold rounded-lg shadow-sm"
              >
                {isEditSaving ? (
                  <>
                    <Loader2 className="size-3.5 me-1.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5 me-1.5" /> Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Services Sheet */}
      <Sheet open={Boolean(listingFor)} onOpenChange={(o) => !o && setListingFor(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md bg-white">
          <SheetHeader>
            <SheetTitle className="text-base font-bold text-slate-900">
              {listingFor?.name} — Services
            </SheetTitle>
          </SheetHeader>
          {listingFor ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Toggle services that should be displayed under this category.
              </p>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                {services.map((s) => {
                  const primary = s.category_id === listingFor.id;
                  const listed = listings.some(
                    (l) => l.category_id === listingFor.id && l.service_id === s.id,
                  );
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-2.5 px-2 text-xs">
                      <span className="truncate font-semibold text-slate-800">
                        {s.name}
                        {primary ? (
                          <span className="ms-2 text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded font-bold">
                            Primary
                          </span>
                        ) : null}
                      </span>
                      <Switch
                        checked={primary || listed}
                        disabled={primary}
                        onCheckedChange={(v) =>
                          listMutation.mutate({
                            category_id: listingFor.id,
                            service_id: s.id,
                            listed: v,
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

