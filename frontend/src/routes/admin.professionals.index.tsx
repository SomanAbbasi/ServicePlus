import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminProfessional } from "@/frontend/lib/admin-mock-data";
import {
  getAdminProfessionals,
  updateProfessional,
  deleteProfessional,
  getAdminCompanies,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { ProfessionalActionModal } from "@/frontend/components/admin/ProfessionalActionModal";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import {
  Check,
  ChevronsUpDown,
  Eye,
  KeyRound,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  PageActions,
  StatusBadge,
  ActionIconButton,
  TablePagination,
  downloadCsv,
} from "@/frontend/components/admin/shell";
import { TYPOGRAPHY } from "@/frontend/lib/design-tokens";

export const Route = createFileRoute("/admin/professionals/")({ component: AdminProfessionalsPage });

function AdminProfessionalsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: prosData, isPending } = useAdminQuery("professionals", getAdminProfessionals);
  const { data: companiesData } = useAdminQuery("companies", getAdminCompanies);
  const professionals: AdminProfessional[] = (prosData as unknown as AdminProfessional[]) ?? [];
  const companies = (companiesData as any[]) ?? [];

  // Search & Filter state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCompanyId, setSearchCompanyId] = useState("all");
  const [searchStatus, setSearchStatus] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    email: "",
    phone: "",
    companyId: "all",
    status: "all",
  });

  // Sorting
  const [sortField, setSortField] = useState<string>("registeredOn");
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Preferred & Status Optimistic Overrides
  const [preferredOverrides, setPreferredOverrides] = useState<Record<string, boolean>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});

  // Modal Actions state
  const [selectedPro, setSelectedPro] = useState<AdminProfessional | null>(null);
  const [activeAction, setActiveAction] = useState<
    "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status" | null
  >(null);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: searchName.trim().toLowerCase(),
      email: searchEmail.trim().toLowerCase(),
      phone: searchPhone.trim().toLowerCase(),
      companyId: searchCompanyId,
      status: searchStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchName("");
    setSearchEmail("");
    setSearchPhone("");
    setSearchCompanyId("all");
    setSearchStatus("all");
    setAppliedFilters({
      name: "",
      email: "",
      phone: "",
      companyId: "all",
      status: "all",
    });
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredPros = useMemo(() => {
    const list = professionals.filter((p: any) => {
      const pName = (p.fullName || p.name || "").toLowerCase();
      const pEmail = (p.email || "").toLowerCase();
      const pPhone = (p.phone || "").toLowerCase();
      const pCompId = p.companyId || (p.company && p.company.id) || "";
      const isAct = statusOverrides[p.id] !== undefined
        ? statusOverrides[p.id]
        : p.status === "Activated" || p.status === "AVAILABLE" || p.isActive;
      const pStatus = isAct ? "Activated" : "Deactivated";

      if (appliedFilters.name && !pName.includes(appliedFilters.name)) return false;
      if (appliedFilters.email && !pEmail.includes(appliedFilters.email)) return false;
      if (appliedFilters.phone && !pPhone.includes(appliedFilters.phone)) return false;
      if (appliedFilters.companyId !== "all" && pCompId !== appliedFilters.companyId) return false;
      if (appliedFilters.status !== "all" && pStatus !== appliedFilters.status) return false;
      return true;
    });

    return list.sort((a: any, b: any) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "name") {
        valA = (a.fullName || a.name || "").toLowerCase();
        valB = (b.fullName || b.name || "").toLowerCase();
      } else if (sortField === "companyName") {
        valA = (typeof a.company === "object" && a.company ? a.company.name : a.companyName || "").toLowerCase();
        valB = (typeof b.company === "object" && b.company ? b.company.name : b.companyName || "").toLowerCase();
      } else if (sortField === "email") {
        valA = (a.email || "").toLowerCase();
        valB = (b.email || "").toLowerCase();
      } else if (sortField === "phone") {
        valA = (a.phone || "").toLowerCase();
        valB = (b.phone || "").toLowerCase();
      } else if (sortField === "status") {
        valA = a.status || "";
        valB = b.status || "";
      } else if (sortField === "registeredOn") {
        valA = a.registeredOn || a.createdAt || "";
        valB = b.registeredOn || b.createdAt || "";
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [professionals, appliedFilters, sortField, sortAsc, statusOverrides]);

  const totalPages = Math.ceil(filteredPros.length / pageSize) || 1;
  const paginatedPros = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPros.slice(start, start + pageSize);
  }, [filteredPros, currentPage, pageSize]);

  // Actions
  const handleToggleStatus = async (pro: AdminProfessional) => {
    const isCurrentlyActive = statusOverrides[pro.id] !== undefined
      ? statusOverrides[pro.id]
      : pro.status === "Activated" || (pro as any).status === "AVAILABLE" || Boolean((pro as any).isActive);
    const nextIsActive = !isCurrentlyActive;
    const nextStatus = nextIsActive ? "Activated" : "Deactivated";

    // Immediate optimistic update
    setStatusOverrides((prev) => ({ ...prev, [pro.id]: nextIsActive }));

    try {
      await updateProfessional({ id: pro.id, status: nextStatus, isActive: nextIsActive });
      toast.success(`${pro.name || pro.fullName || "Professional"} status updated to ${nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
    } catch {
      // Revert if failed
      setStatusOverrides((prev) => ({ ...prev, [pro.id]: isCurrentlyActive }));
      toast.error("Failed to update status");
    }
  };

  const handleTogglePreferred = async (pro: AdminProfessional, checked: boolean) => {
    setPreferredOverrides((prev) => ({ ...prev, [pro.id]: checked }));
    await updateProfessional({ id: pro.id, isPreferred: checked });
    toast.success(
      checked
        ? `${pro.name || pro.fullName || "Professional"} marked as Preferred ★`
        : `${pro.name || pro.fullName || "Professional"} un-marked as Preferred`
    );
    queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
  };

  const handleSaveEdit = async (proId: string, updated: Partial<AdminProfessional>) => {
    await updateProfessional({ id: proId, ...updated });
    toast.success("Professional details saved successfully!");
    queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
  };

  const handleDelete = async (id: string) => {
    await deleteProfessional(id);
    toast.success("Professional removed from roster");
    queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
  };

  const handleExportCsv = () => {
    const exportData = filteredPros.map((p: any, index) => {
      const isAct = statusOverrides[p.id] !== undefined
        ? statusOverrides[p.id]
        : p.status === "Activated" || p.status === "AVAILABLE" || p.isActive;
      const compName = typeof p.company === "object" && p.company ? p.company.name : (p.companyName || "ServicePlus Network");
      return {
        "#": index + 1,
        "Preferred": p.isPreferred ? "Yes" : "No",
        "Company Name": compName,
        "Name": p.fullName || p.name || "Professional",
        "Email": p.email || "—",
        "Phone Number": p.phone || "—",
        "Status": isAct ? "Activated" : "Deactivated",
        "Registered On": p.registeredOn || p.createdAt?.slice(0, 10) || "—",
      };
    });
    downloadCsv(`professionals_export_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success(`Exported ${exportData.length} records to CSV`);
  };

  const handleOpenAction = (
    pro: AdminProfessional,
    action: "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status"
  ) => {
    setSelectedPro(pro);
    if (action === "toggle_status") {
      handleToggleStatus(pro);
    } else {
      setActiveAction(action);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Professionals Management"
        description="Roster, performance compliance, and status management for field service staff"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Professionals Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen((v) => !v)}
            isSearchOpen={isSearchOpen}
            onExport={handleExportCsv}
            addNewLabel="Add Professional"
            addNewTo="/admin/professionals/create"
          />
        }
      />

      {/* Expandable Search & Filter Bar */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in-50 duration-150">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Professionals
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="h-7 text-xs text-slate-400 hover:text-slate-700"
              >
                <X className="size-3.5 me-1" /> Close
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Name</Label>
                <Input
                  placeholder="Filter by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Email</Label>
                <Input
                  placeholder="Filter by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Phone</Label>
                <Input
                  placeholder="Filter by phone..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Company</Label>
                <Select value={searchCompanyId} onValueChange={setSearchCompanyId}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Companies
                    </SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Status</Label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Statuses
                    </SelectItem>
                    <SelectItem value="Activated" className="text-xs font-semibold">
                      Activated
                    </SelectItem>
                    <SelectItem value="Deactivated" className="text-xs font-semibold">
                      Deactivated
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilter}
                className="h-10 px-4 text-xs font-bold border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                <RotateCcw className="size-3.5 me-1.5" /> Reset
              </Button>
              <Button
                type="submit"
                className="h-10 px-5 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-xs"
              >
                <Search className="size-3.5 me-1.5" /> Apply Filters
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Professionals Table Card with Sticky Action Column */}
      <Card className="bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-semibold text-[13px]">
                <th className="px-3.5 py-3.5 text-center w-12">#</th>
                <th className="px-3.5 py-3.5 text-center w-24">Preferred</th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("companyName")}
                >
                  <div className="flex items-center gap-1">
                    Company Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    E-mail <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center gap-1">
                    Phone Number <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-center cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("registeredOn")}
                >
                  <div className="flex items-center gap-1">
                    Registered On <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>

                {/* Sticky Pinned Actions Column on Right */}
                <th className="sticky end-0 bg-slate-50 z-10 px-4 py-3.5 text-center min-w-[210px] border-s border-slate-200">
                  <div className="flex items-center justify-center gap-1 text-slate-700 font-bold">
                    Action
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
              {isPending ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Loading professionals roster...
                  </td>
                </tr>
              ) : paginatedPros.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No professional records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedPros.map((pro: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = statusOverrides[pro.id] !== undefined
                    ? statusOverrides[pro.id]
                    : pro.status === "Activated" || pro.status === "AVAILABLE" || Boolean(pro.isActive);
                  const isPref = preferredOverrides[pro.id] !== undefined ? preferredOverrides[pro.id] : Boolean(pro.isPreferred);
                  const companyDisplayName = typeof pro.company === "object" && pro.company !== null
                    ? pro.company.name
                    : (pro.companyName || "Dabas Beauty Center");
                  const proDisplayName = pro.fullName || pro.name || "Professional";

                  // Registered On formatted
                  const rawDate = pro.registeredOn || pro.createdAt || "";
                  const formattedDate = rawDate
                    ? rawDate.includes("T")
                      ? new Date(rawDate).toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        }) +
                        " " +
                        new Date(rawDate).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : rawDate
                    : "08-04-2026 6:38 PM";

                  return (
                    <tr key={pro.id} className="group hover:bg-slate-50/80 transition-colors">
                      {/* 1. # */}
                      <td className="px-3.5 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>

                      {/* 2. Mark as Preferred Checkbox */}
                      <td className="px-3.5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePreferred(pro, !isPref)}
                          className={`size-5 rounded flex items-center justify-center transition-all ${
                            isPref
                              ? "bg-blue-600 border border-blue-600 text-white shadow-xs"
                              : "bg-white border-2 border-slate-300 hover:border-blue-400"
                          } mx-auto`}
                          title={isPref ? "Unmark as Preferred" : "Mark as Preferred"}
                        >
                          {isPref && <Check className="size-3.5 text-white stroke-[3]" />}
                        </button>
                      </td>

                      {/* 3. Company Name */}
                      <td className="px-3.5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {companyDisplayName}
                      </td>

                      {/* 4. Name */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{proDisplayName}</span>
                          {isPref && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                              title="Preferred Professional"
                            >
                              ★ Preferred
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. E-mail */}
                      <td className="px-3.5 py-3.5 text-slate-600 whitespace-nowrap">
                        {pro.email || "—"}
                      </td>

                      {/* 6. Phone Number */}
                      <td className="px-3.5 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {pro.phone || "—"}
                      </td>

                      {/* 7. Status Badge (Instant Toggle) */}
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={isActivated ? "Activated" : "Deactivated"} />
                      </td>

                      {/* 8. Registered On */}
                      <td className="px-3.5 py-3.5 text-slate-700 text-xs whitespace-nowrap font-mono">
                        {formattedDate}
                      </td>

                      {/* 9. Sticky Actions Column on Right */}
                      <td className="sticky end-0 bg-white group-hover:bg-slate-50/90 z-10 px-3 py-3 text-center align-middle border-s border-slate-200/80 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-center gap-1">
                          <ActionIconButton
                            icon={isActivated ? X : Check}
                            label={isActivated ? "Deactivate" : "Activate"}
                            action={isActivated ? "toggle_off" : "toggle_on"}
                            onClick={() => handleToggleStatus(pro)}
                          />
                          <ActionIconButton
                            icon={Sliders}
                            label="Edit"
                            action="edit"
                            to="/admin/professionals/edit"
                            search={{ id: pro.id }}
                          />
                          <ActionIconButton
                            icon={Eye}
                            label="View Info"
                            action="view"
                            onClick={() => handleOpenAction(pro, "info")}
                          />
                          <ActionIconButton
                            icon={KeyRound}
                            label="Change Password"
                            action="password"
                            onClick={() => handleOpenAction(pro, "password")}
                          />
                          <ActionIconButton
                            icon={Trash2}
                            label="Delete"
                            action="delete"
                            onClick={() => handleOpenAction(pro, "delete")}
                          />
                          <ActionIconButton
                            icon={Send}
                            label="Send Credentials"
                            action="send"
                            onClick={() => handleOpenAction(pro, "send_credentials")}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredPros.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Connected 6-Action Modals Component */}
      <ProfessionalActionModal
        professional={selectedPro}
        activeAction={activeAction}
        companies={companies}
        onClose={() => {
          setActiveAction(null);
          setSelectedPro(null);
        }}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus as any}
      />
    </div>
  );
}
