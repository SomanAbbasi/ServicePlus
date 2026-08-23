import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createService,
  deleteService,
  duplicateService,
  getAdminCatalog,
  updateService,
  uploadMedia,
} from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ErrorState, TableSkeleton, PageHeader, PageActions, StatusBadge, ActionIconButton, downloadCsv } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { OptionsManager } from "@/frontend/components/admin/OptionsManager";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
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
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  Copy,
  Edit,
  Filter,
  Info,
  Loader2,
  Menu,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Sliders,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatMoney, num } from "@/frontend/lib/money";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/services/")({ component: AdminServices });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminServices() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("catalog", getAdminCatalog);

  // Search & Filter State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchStatus, setSearchStatus] = useState("all");
  const [searchType, setSearchType] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    category: "all",
    status: "all",
    type: "all",
  });

  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sheet / Modal State
  const [optionsFor, setOptionsFor] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  // Edit Form Multi-Language State
  const [editTab, setEditTab] = useState<"en" | "ar">("en");
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editShortDescEn, setEditShortDescEn] = useState("");
  const [editShortDescAr, setEditShortDescAr] = useState("");
  const [editDescEn, setEditDescEn] = useState("");
  const [editDescAr, setEditDescAr] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editBookingType, setEditBookingType] = useState("hourly");
  const [editBasePrice, setEditBasePrice] = useState("0");
  const [editDurationMinutes, setEditDurationMinutes] = useState("0");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin"] });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("Service deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dupMutation = useMutation({
    mutationFn: (id: string) => duplicateService(id),
    onSuccess: () => {
      toast.success("Copy created");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenEdit = (s: Row) => {
    setEditing(s);
    setEditTab("en");
    setEditNameEn(s.name || "");
    setEditNameAr(s.name_ar || s.nameAr || "");
    setEditShortDescEn(s.short_description || s.shortDescription || "");
    setEditShortDescAr(s.short_description_ar || s.shortDescriptionAr || "");
    setEditDescEn(s.description || "");
    setEditDescAr(s.description_ar || s.descriptionAr || "");
    setEditCategoryId(s.category_id || s.categoryId || "");
    setEditBookingType(s.booking_type || s.bookingType || "hourly");
    setEditBasePrice(String(s.base_price ?? s.basePrice ?? 0));
    setEditDurationMinutes(String(s.duration_minutes ?? s.durationMinutes ?? 0));
    setEditImageUrl(s.image_url || s.imageUrl || "");
    setEditImageFile(null);
    setEditIsActive(s.is_active ?? s.isActive ?? true);
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
      toast.error("Service name is required.");
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

      await updateService({
        id: editing.id,
        name: editNameEn.trim() || editNameAr.trim(),
        name_ar: editNameAr.trim() || undefined,
        category_id: editCategoryId,
        short_description: editShortDescEn.trim() || undefined,
        short_description_ar: editShortDescAr.trim() || undefined,
        description: editDescEn.trim() || undefined,
        description_ar: editDescAr.trim() || undefined,
        booking_type: editBookingType,
        base_price: parseFloat(editBasePrice) || 0,
        duration_minutes: parseInt(editDurationMinutes) || 0,
        image_url: finalUrl || null,
        is_active: editIsActive,
      });

      toast.success(`Service "${editNameEn.trim() || editNameAr.trim()}" updated successfully!`);
      setEditing(null);
      invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update service");
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleToggleStatus = async (s: Row) => {
    const currentActive = s.is_active ?? s.isActive ?? true;
    const nextActive = !currentActive;
    try {
      await updateService({ id: s.id, is_active: nextActive });
      toast.success(`Service "${s.name}" is now ${nextActive ? "Activated" : "Deactivated"}`);
      invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: searchName.trim().toLowerCase(),
      category: searchCategory,
      status: searchStatus,
      type: searchType,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchName("");
    setSearchCategory("all");
    setSearchStatus("all");
    setSearchType("all");
    setAppliedFilters({
      name: "",
      category: "all",
      status: "all",
      type: "all",
    });
    setCurrentPage(1);
  };

  const rawServices = (data?.services ?? []) as Row[];
  const categories = (data?.categories ?? []) as Row[];
  const activeCategories = useMemo(
    () =>
      categories.filter((c) => {
        if (c.status === "Deactivated") return false;
        if (c.is_active === false || c.isActive === false) return false;
        return true;
      }),
    [categories],
  );
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  if (isError) return <ErrorState />;
  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Services Management"
          breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Services" }]}
        />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  // Sort by sort_order
  const sortedServices = [...rawServices].sort((a, b) => {
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

    const nextList = [...sortedServices];
    const [movedItem] = nextList.splice(draggedIndex, 1);
    nextList.splice(dropIndex, 0, movedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);

    // Save sort_order sequentially
    try {
      for (let i = 0; i < nextList.length; i++) {
        const item = nextList[i];
        await updateService({
          id: item.id,
          sort_order: i,
        });
      }
      toast.success("Service order updated!");
      invalidate();
    } catch {
      toast.error("Failed to persist reordering");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sortedServices.length) return;

    const nextList = [...sortedServices];
    const [movedItem] = nextList.splice(index, 1);
    nextList.splice(targetIdx, 0, movedItem);

    try {
      for (let i = 0; i < nextList.length; i++) {
        const item = nextList[i];
        await updateService({
          id: item.id,
          sort_order: i,
        });
      }
      toast.success("Service order updated!");
      invalidate();
    } catch {
      toast.error("Failed to update sort order");
    }
  };

  // Filtered List
  const filteredServices = sortedServices.filter((s) => {
    if (appliedFilters.name) {
      const matchNameEn = (s.name || "").toLowerCase().includes(appliedFilters.name);
      const matchNameAr = (s.name_ar || s.nameAr || "").toLowerCase().includes(appliedFilters.name);
      const matchSlug = (s.slug || "").toLowerCase().includes(appliedFilters.name);
      if (!matchNameEn && !matchNameAr && !matchSlug) return false;
    }
    if (appliedFilters.category !== "all") {
      const catId = s.category_id || s.categoryId;
      if (catId !== appliedFilters.category) return false;
    }
    if (appliedFilters.status !== "all") {
      const active = s.is_active ?? s.isActive ?? true;
      if (appliedFilters.status === "active" && !active) return false;
      if (appliedFilters.status === "inactive" && active) return false;
    }
    if (appliedFilters.type !== "all") {
      const type = s.booking_type || s.bookingType || "hourly";
      if (type !== appliedFilters.type) return false;
    }
    return true;
  });

  // Pagination calculation
  const totalItems = filteredServices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  return (
    <div className="space-y-5 text-slate-800">
      {/* Breadcrumbs & Header Actions matching Category Management */}
      <PageHeader
        title="Services Management"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Services Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen((v) => !v)}
            isSearchOpen={isSearchOpen}
            addNewLabel="Add Service"
            addNewTo="/admin/services/create"
          />
        }
      />
      

      {/* Collapsible Search & Filter Panel matching Category Management */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Input
                  placeholder="Search Service Name or Slug..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                  Category
                </label>
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Categories
                    </SelectItem>
                    {activeCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                        {c.name}
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

              <div className="relative">
                <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                  Booking Type
                </label>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Types
                    </SelectItem>
                    <SelectItem value="hourly" className="text-xs font-semibold">
                      Hourly
                    </SelectItem>
                    <SelectItem value="fixed" className="text-xs font-semibold">
                      Fixed Price
                    </SelectItem>
                    <SelectItem value="variant" className="text-xs font-semibold">
                      Variants
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
                className="font-bold text-xs h-9 px-5 rounded-lg shadow-sm"
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
                <th className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    Service Offering <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    Category <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    Booking Type <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    Base Price <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    Duration <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
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
              {paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold">No services found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                paginatedServices.map((s, idx) => {
                  const globalIdx = startIndex + idx;
                  const isActive = s.is_active ?? s.isActive ?? true;
                  const imgUrl = s.image_url || s.imageUrl;
                  const bookingType = s.booking_type || s.bookingType || "hourly";
                  const price = s.base_price ?? s.basePrice ?? 0;
                  const duration = s.duration_minutes ?? s.durationMinutes ?? 0;

                  return (
                    <tr
                      key={s.id}
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
                            disabled={globalIdx === sortedServices.length - 1}
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

                      {/* Circular Image Column */}
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          {imgUrl ? (
                            <div className="size-10 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                              <img
                                src={resolveImageUrl(imgUrl)}
                                alt={s.name}
                                className="size-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="size-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs">
                              {s.name?.charAt(0) || "S"}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Service Name & Arabic Name */}
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                        {(s.name_ar || s.nameAr) && (
                          <div className="text-xs text-slate-400 font-normal mt-0.5" dir="rtl">
                            {s.name_ar || s.nameAr}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="px-3 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {catName(s.category_id || s.categoryId)}
                        </span>
                      </td>

                      {/* Booking Type */}
                      <td className="px-3 py-3.5">
                        <span className="capitalize font-medium text-slate-600 text-xs">
                          {bookingType}
                        </span>
                      </td>

                      {/* Base Price */}
                      <td className="px-3 py-3.5 font-medium text-slate-800 text-xs">
                        {Number(price) === 0 ? (
                          <div className="flex flex-col">
                            <span className="text-slate-500 font-semibold">AED 0.00</span>
                            <span className="text-[10px] text-primary font-medium">Option-based</span>
                          </div>
                        ) : (
                          formatMoney(num(price))
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-3 py-3.5 text-center text-slate-600 font-medium text-xs">
                        {Number(duration) === 0 ? (
                          <span className="text-slate-400 text-[11px]">Dynamic</span>
                        ) : (
                          `${duration} min`
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={isActive ? "Activated" : "Deactivated"} />
                      </td>

                      {/* Action Horizontal Row */}
                      <td className="px-3 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <ActionIconButton icon={isActive ? X : Check} label={isActive ? "Deactivate Service" : "Activate Service"} action={isActive ? "delete" : "view"} onClick={() => handleToggleStatus(s)} />
                          <Link
                            to="/admin/services/edit"
                            search={{ id: s.id }}
                            title="Edit Service"
                            className="text-primary hover:scale-125 transition-transform inline-flex items-center justify-center"
                          >
                            <Sliders className="size-4 text-primary stroke-[2.5]" />
                          </Link>
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
                            <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200">
                              <DropdownMenuItem
                                onClick={() => setOptionsFor(s)}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <SlidersHorizontal className="size-3.5 me-2 text-primary" /> Manage Options
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => dupMutation.mutate(s.id)}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Copy className="size-3.5 me-2 text-indigo-600" /> Duplicate Service
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${s.name}"?`)) {
                                    delMutation.mutate(s.id);
                                  }
                                }}
                                className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="size-3.5 me-2 text-rose-600" /> Delete Service
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

      {/* Multi-Language Edit Service Modal */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Edit Service Offering
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update service details, English & Arabic descriptions, and pricing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {/* Circular Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Service Image</Label>
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

            {/* Tab 1: English Fields */}
            {editTab === "en" && (
              <div className="space-y-3 animate-in fade-in-50 duration-150">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Service Name (English) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editNameEn}
                    onChange={(e) => setEditNameEn(e.target.value)}
                    placeholder="e.g. Standard Home Cleaning"
                    className="h-10 text-xs"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Short Description (English)</Label>
                  <Input
                    value={editShortDescEn}
                    onChange={(e) => setEditShortDescEn(e.target.value)}
                    placeholder="Brief summary for listings"
                    className="h-10 text-xs"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Full Description (English)</Label>
                  <Textarea
                    value={editDescEn}
                    onChange={(e) => setEditDescEn(e.target.value)}
                    placeholder="Detailed description of inclusions and service scope"
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
                    اسم الخدمة (عربي) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editNameAr}
                    onChange={(e) => setEditNameAr(e.target.value)}
                    placeholder="مثال: تنظيف المنازل القياسي"
                    className="h-10 text-xs text-right"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <Label className="text-xs font-bold text-slate-700">الوصف المختصر (عربي)</Label>
                  <Input
                    value={editShortDescAr}
                    onChange={(e) => setEditShortDescAr(e.target.value)}
                    placeholder="ملخص موجز لبطاقات العرض"
                    className="h-10 text-xs text-right"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <Label className="text-xs font-bold text-slate-700">الوصف التفصيلي (عربي)</Label>
                  <Textarea
                    value={editDescAr}
                    onChange={(e) => setEditDescAr(e.target.value)}
                    placeholder="وصف تفصيلي للخدمة وما تشمله من مزايا"
                    rows={3}
                    className="text-xs text-right"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Category & Booking Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                  <SelectTrigger className="h-10 text-xs font-semibold">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => (c.is_active ?? c.isActive ?? true) || c.id === editCategoryId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Booking Type</Label>
                <Select value={editBookingType} onValueChange={setEditBookingType}>
                  <SelectTrigger className="h-10 text-xs font-semibold">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly" className="text-xs font-semibold">
                      Hourly
                    </SelectItem>
                    <SelectItem value="fixed" className="text-xs font-semibold">
                      Fixed Price
                    </SelectItem>
                    <SelectItem value="variant" className="text-xs font-semibold">
                      Options & Variants
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Base Price (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editBasePrice}
                  onChange={(e) => setEditBasePrice(e.target.value)}
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
                <p className="text-[11px] text-slate-400">Enable or disable this service offering</p>
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
                className="h-9 text-xs font-bold "
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

      {/* Options Manager Sheet */}
      <OptionsManager service={optionsFor} onClose={() => setOptionsFor(null)} />
    </div>
  );
}
