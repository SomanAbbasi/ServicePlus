import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteCoupon,
  getAdminCoupons,
  setCouponActive,
  upsertCoupon,
} from "@/frontend/lib/api-services";
import { ErrorState, TableSkeleton, PageHeader, PageActions, StatusBadge, ActionIconButton, downloadCsv } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/frontend/components/ui/dialog";
import {
  Check,
  ChevronsUpDown,
  Edit,
  Filter,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Sliders,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/coupons/")({ component: AdminCoupons });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminCoupons() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("coupons", getAdminCoupons);

  // Search & Filter State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [searchStatus, setSearchStatus] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    code: "",
    type: "all",
    status: "all",
  });

  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Modal State
  const [editing, setEditing] = useState<Row | null>(null);
  const [editTab, setEditTab] = useState<"en" | "ar">("en");
  const [editCode, setEditCode] = useState("");
  const [editDescEn, setEditDescEn] = useState("");
  const [editDescAr, setEditDescAr] = useState("");
  const [editDiscountType, setEditDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [editDiscountValue, setEditDiscountValue] = useState("");
  const [editMinAmount, setEditMinAmount] = useState("");
  const [editMaxDiscount, setEditMaxDiscount] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editMaxRedemptions, setEditMaxRedemptions] = useState("");
  const [editPerUserLimit, setEditPerUserLimit] = useState("1");
  const [editFirstBookingOnly, setEditFirstBookingOnly] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin"] });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      toast.success("Coupon deleted successfully");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete coupon"),
  });

  const handleToggleStatus = async (r: Row) => {
    const currentActive = r.is_active ?? r.isActive ?? true;
    const nextActive = !currentActive;
    try {
      await setCouponActive(r.id, nextActive);
      toast.success(`Coupon "${r.code}" is now ${nextActive ? "Activated" : "Deactivated"}`);
      invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleOpenEdit = (r: Row) => {
    setEditing(r);
    setEditTab("en");
    setEditCode(r.code || "");
    const rawDesc = String(r.description || "");
    if (rawDesc.includes("|")) {
      const parts = rawDesc.split("|").map((s) => s.trim());
      setEditDescEn(parts[0] || "");
      setEditDescAr(parts[1] || "");
    } else {
      setEditDescEn(rawDesc);
      setEditDescAr("");
    }
    setEditDiscountType((r.discount_type || r.discountType || "percentage") as "percentage" | "fixed");
    setEditDiscountValue(String(r.discount_value ?? r.discountValue ?? 0));
    setEditMinAmount(r.min_amount != null ? String(r.min_amount) : (r.minAmount != null ? String(r.minAmount) : ""));
    setEditMaxDiscount(r.max_discount != null ? String(r.max_discount) : (r.maxDiscount != null ? String(r.maxDiscount) : ""));
    const rawDate = r.expires_at || r.expiresAt;
    setEditExpiresAt(rawDate ? String(rawDate).slice(0, 10) : "");
    setEditMaxRedemptions(r.max_redemptions != null ? String(r.max_redemptions) : (r.maxRedemptions != null ? String(r.maxRedemptions) : ""));
    setEditPerUserLimit(String(r.per_user_limit ?? r.perUserLimit ?? 1));
    setEditFirstBookingOnly(Boolean(r.first_booking_only ?? r.firstBookingOnly ?? false));
    setEditIsActive(r.is_active ?? r.isActive ?? true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editCode.trim() || !editDiscountValue) {
      toast.error("Promo Code and Discount Value are required (*)");
      return;
    }

    try {
      setIsSaving(true);
      let finalDescription = editDescEn.trim();
      if (editDescAr.trim()) {
        finalDescription = editDescEn.trim() ? `${editDescEn.trim()} | ${editDescAr.trim()}` : editDescAr.trim();
      }

      await upsertCoupon({
        id: editing.id,
        code: editCode.trim().toUpperCase(),
        description: finalDescription || undefined,
        discount_type: editDiscountType,
        discount_value: parseFloat(editDiscountValue) || 0,
        min_amount: editMinAmount ? parseFloat(editMinAmount) : 0,
        max_discount: editMaxDiscount ? parseFloat(editMaxDiscount) : null,
        expires_at: editExpiresAt || null,
        max_redemptions: editMaxRedemptions ? parseInt(editMaxRedemptions) : null,
        per_user_limit: parseInt(editPerUserLimit) || 1,
        first_booking_only: editFirstBookingOnly,
        is_active: editIsActive,
      });

      toast.success(`Coupon "${editCode.toUpperCase()}" updated successfully!`);
      setEditing(null);
      invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update coupon");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      code: searchCode.trim().toLowerCase(),
      type: searchType,
      status: searchStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchCode("");
    setSearchType("all");
    setSearchStatus("all");
    setAppliedFilters({
      code: "",
      type: "all",
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
          <span className="text-slate-600">Coupons</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Coupon Management</h1>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const rawRows = (data ?? []) as Row[];

  // Filtered Rows
  const filteredRows = rawRows.filter((r) => {
    if (appliedFilters.code) {
      const matchCode = (r.code || "").toLowerCase().includes(appliedFilters.code);
      const matchDesc = (r.description || "").toLowerCase().includes(appliedFilters.code);
      if (!matchCode && !matchDesc) return false;
    }
    if (appliedFilters.type !== "all") {
      const type = r.discount_type || r.discountType || "percentage";
      if (type !== appliedFilters.type) return false;
    }
    if (appliedFilters.status !== "all") {
      const active = r.is_active ?? r.isActive ?? true;
      if (appliedFilters.status === "active" && !active) return false;
      if (appliedFilters.status === "inactive" && active) return false;
    }
    return true;
  });

  // Pagination calculation
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  return (
    <div className="space-y-5 text-slate-800">
      {/* Top Breadcrumb & Page Header */}
      <PageHeader
        title="Coupon Management"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Coupon Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen((v) => !v)}
            isSearchOpen={isSearchOpen}
            addNewLabel="Add Coupon"
            addNewTo="/admin/coupons/create"
          />
        }
      />
      

      {/* Collapsible Search & Filter Panel */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Input
                  placeholder="Search Coupon Code or Description..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                  Discount Type
                </label>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg font-semibold">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Discount Types
                    </SelectItem>
                    <SelectItem value="percentage" className="text-xs font-semibold">
                      Percentage (%) Off
                    </SelectItem>
                    <SelectItem value="fixed" className="text-xs font-semibold">
                      Fixed Amount (AED) Off
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                  Status
                </label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg font-semibold">
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
                <th className="px-3 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    Code <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    Description <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    Discount <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    Min Spend <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    Redemptions <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    Expires <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
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
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold">No coupons found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => {
                  const globalIdx = startIndex + idx;
                  const isActive = r.is_active ?? r.isActive ?? true;
                  const discountType = r.discount_type || r.discountType || "percentage";
                  const discountVal = num(r.discount_value ?? r.discountValue ?? 0);
                  const minAmount = num(r.min_amount ?? r.minAmount ?? 0);
                  const redemptionCount = r.redemption_count ?? r.redemptionCount ?? 0;
                  const maxRedemptions = r.max_redemptions ?? r.maxRedemptions;
                  const expiresAt = r.expires_at || r.expiresAt;

                  // Parse description
                  const rawDesc = String(r.description || "");
                  let enDesc = rawDesc;
                  let arDesc = "";
                  if (rawDesc.includes("|")) {
                    const parts = rawDesc.split("|").map((s) => s.trim());
                    enDesc = parts[0] || "";
                    arDesc = parts[1] || "";
                  }

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Index Column */}
                      <td className="px-3 py-3.5 text-center text-slate-400 font-semibold">
                        {globalIdx + 1}
                      </td>

                      {/* Code Badge */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/80 font-mono font-bold text-slate-900 text-xs tracking-wider">
                          <Tag className="size-3 text-primary" />
                          <span>{r.code}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-xs">
                            {enDesc || "—"}
                          </span>
                          {arDesc && (
                            <span className="text-[11px] text-slate-400 font-normal mt-0.5" dir="rtl">
                              {arDesc}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="px-3 py-3.5 font-bold text-slate-900">
                        {discountType === "percentage" ? `${discountVal}%` : formatMoney(discountVal)}
                      </td>

                      {/* Min Spend */}
                      <td className="px-3 py-3.5 font-medium text-slate-700">
                        {minAmount > 0 ? formatMoney(minAmount) : "—"}
                      </td>

                      {/* Redemptions */}
                      <td className="px-3 py-3.5 text-center text-slate-600 font-medium">
                        {redemptionCount} / {maxRedemptions ? maxRedemptions : "∞"}
                      </td>

                      {/* Expires */}
                      <td className="px-3 py-3.5 text-center text-slate-600 font-medium">
                        {expiresAt ? String(expiresAt).slice(0, 10) : "—"}
                      </td>

                      {/* Status Column */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={isActive ? "Activated" : "Deactivated"} />
                      </td>

                      {/* Action Horizontal Row */}
                      <td className="px-3 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <ActionIconButton icon={isActive ? X : Check} label={isActive ? "Deactivate Coupon" : "Activate Coupon"} action={isActive ? "delete" : "view"} onClick={() => handleToggleStatus(r)} />
                          <Link
                            to="/admin/coupons/edit"
                            search={{ id: r.id }}
                            title="Edit Coupon"
                            className="text-primary hover:scale-125 transition-transform inline-flex items-center justify-center"
                          >
                            <Sliders className="size-4 text-primary stroke-[2.5]" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete coupon code "${r.code}"?`)) {
                                delMutation.mutate(r.id);
                              }
                            }}
                            title="Delete Coupon"
                            className="text-rose-500 hover:scale-125 transition-transform"
                          >
                            <Trash2 className="size-4 text-rose-500 stroke-[2.5]" />
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

      {/* Multi-Language Edit Coupon Modal */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Edit Coupon Code
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update discount rates, usage limits, and description in English & Arabic.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {/* Promo Code & Discount Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Promo Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  required
                  className="h-10 text-xs font-mono uppercase font-bold tracking-wider"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Discount Type</Label>
                <Select
                  value={editDiscountType}
                  onValueChange={(v: any) => setEditDiscountType(v)}
                >
                  <SelectTrigger className="h-10 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage" className="text-xs font-semibold">
                      Percentage (%) Off
                    </SelectItem>
                    <SelectItem value="fixed" className="text-xs font-semibold">
                      Fixed Amount (AED) Off
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Language Switcher Tabs for Description */}
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

            {/* Tab 1: English Content */}
            {editTab === "en" && (
              <div className="space-y-3 animate-in fade-in-50 duration-150">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Description (English)</Label>
                  <Input
                    value={editDescEn}
                    onChange={(e) => setEditDescEn(e.target.value)}
                    placeholder="e.g. 20% discount on entire cart"
                    className="h-10 text-xs"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Arabic Content */}
            {editTab === "ar" && (
              <div className="space-y-3 animate-in fade-in-50 duration-150" dir="rtl">
                <div className="space-y-1 text-right">
                  <Label className="text-xs font-bold text-slate-700">الوصف (عربي)</Label>
                  <Input
                    value={editDescAr}
                    onChange={(e) => setEditDescAr(e.target.value)}
                    placeholder="مثال: خصم 20% على إجمالي الطلب"
                    className="h-10 text-xs text-right"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Pricing & Limits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Discount ({editDiscountType === "percentage" ? "%" : "AED"}) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editDiscountValue}
                  onChange={(e) => setEditDiscountValue(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Min. Spend (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editMinAmount}
                  onChange={(e) => setEditMinAmount(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Max Discount (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editMaxDiscount}
                  onChange={(e) => setEditMaxDiscount(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Expiry Date</Label>
                <AdminDateInput
                  placeholder="Expiry Date"
                  value={editExpiresAt}
                  onChange={setEditExpiresAt}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Total Redemptions</Label>
                <Input
                  type="number"
                  min="1"
                  value={editMaxRedemptions}
                  onChange={(e) => setEditMaxRedemptions(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Per User Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={editPerUserLimit}
                  onChange={(e) => setEditPerUserLimit(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">First Booking Only</p>
                  <p className="text-[11px] text-slate-400">Only eligible for new customer first orders</p>
                </div>
                <Switch checked={editFirstBookingOnly} onCheckedChange={setEditFirstBookingOnly} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">Active Status</p>
                  <p className="text-[11px] text-slate-400">Enable or disable this promo code</p>
                </div>
                <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
              </div>
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
                disabled={isSaving}
                className="h-9 text-xs font-bold "
              >
                {isSaving ? (
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
    </div>
  );
}
