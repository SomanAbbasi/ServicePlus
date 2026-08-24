import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminSupervisor } from "@/frontend/lib/admin-mock-data";
import {
  getAdminSupervisors,
  updateAdminSupervisor,
  deleteAdminSupervisor,
  getAdminCompanies,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { SupervisorActionModal } from "@/frontend/components/admin/SupervisorActionModal";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import {
  Check,
  ChevronsUpDown,
  Eye,
  KeyRound,
  RotateCcw,
  Search,
  Send,
  Sliders,
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

export const Route = createFileRoute("/admin/supervisors/")({ component: AdminSupervisorsPage });

function AdminSupervisorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: supsData, isPending } = useAdminQuery("supervisors", getAdminSupervisors);
  const { data: companiesData } = useAdminQuery("companies", getAdminCompanies);
  const supervisors: AdminSupervisor[] = (supsData as AdminSupervisor[]) ?? [];
  const companies = (companiesData as any[]) ?? [];

  // Search & Filter Panel State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchCompany, setSearchCompany] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    status: "all",
    startDate: "",
    endDate: "",
  });

  // Sorting
  const [sortField, setSortField] = useState<string>("registeredOn");
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Status overrides for optimistic UI
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});

  // Modal Actions state
  const [selectedSup, setSelectedSup] = useState<AdminSupervisor | null>(null);
  const [activeAction, setActiveAction] = useState<
    "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status" | null
  >(null);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      company: searchCompany.trim().toLowerCase(),
      name: searchName.trim().toLowerCase(),
      email: searchEmail.trim().toLowerCase(),
      phone: searchPhone.trim().toLowerCase(),
      status: searchStatus,
      startDate: startDate,
      endDate: endDate,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchCompany("");
    setSearchName("");
    setSearchEmail("");
    setSearchPhone("");
    setSearchStatus("all");
    setStartDate("");
    setEndDate("");
    setAppliedFilters({
      company: "",
      name: "",
      email: "",
      phone: "",
      status: "all",
      startDate: "",
      endDate: "",
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

  const filteredSups = useMemo(() => {
    const list = supervisors.filter((s: any) => {
      const sName = (s.fullName || s.name || "").toLowerCase();
      const sEmail = (s.email || "").toLowerCase();
      const sPhone = (s.phone || "").toLowerCase();
      const sCompName = (typeof s.company === "object" && s.company ? s.company.name : (s.companyName || "")).toLowerCase();
      const isAct = statusOverrides[s.id] !== undefined
        ? statusOverrides[s.id]
        : s.status === "Activated" || s.status === "AVAILABLE" || s.isActive;
      const sStatus = isAct ? "Activated" : "Deactivated";

      if (appliedFilters.company && !sCompName.includes(appliedFilters.company)) return false;
      if (appliedFilters.name && !sName.includes(appliedFilters.name)) return false;
      if (appliedFilters.email && !sEmail.includes(appliedFilters.email)) return false;
      if (appliedFilters.phone && !sPhone.includes(appliedFilters.phone)) return false;
      if (appliedFilters.status !== "all" && sStatus !== appliedFilters.status) return false;
      if (appliedFilters.startDate) {
        const regDate = s.registeredOn || s.createdAt?.slice(0, 10) || "";
        if (regDate && regDate < appliedFilters.startDate) return false;
      }
      if (appliedFilters.endDate) {
        const regDate = s.registeredOn || s.createdAt?.slice(0, 10) || "";
        if (regDate && regDate > appliedFilters.endDate) return false;
      }
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
  }, [supervisors, appliedFilters, sortField, sortAsc, statusOverrides]);

  const totalPages = Math.ceil(filteredSups.length / pageSize) || 1;
  const paginatedSups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSups.slice(start, start + pageSize);
  }, [filteredSups, currentPage, pageSize]);

  // Actions
  const handleToggleStatus = async (sup: AdminSupervisor) => {
    const isCurrentlyActive = statusOverrides[sup.id] !== undefined
      ? statusOverrides[sup.id]
      : sup.status === "Activated" || (sup as any).status === "AVAILABLE" || (sup as any).isActive;
    const nextIsActive = !isCurrentlyActive;
    const nextStatus = nextIsActive ? "Activated" : "Deactivated";

    // Immediate optimistic update
    setStatusOverrides((prev) => ({ ...prev, [sup.id]: nextIsActive }));

    try {
      await updateAdminSupervisor(sup.id, { status: nextStatus });
      toast.success(`Supervisor status updated to ${nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "supervisors"] });
    } catch {
      setStatusOverrides((prev) => ({ ...prev, [sup.id]: isCurrentlyActive }));
      toast.error("Failed to update status");
    }
  };

  const handleSaveEdit = async (supId: string, updated: Partial<AdminSupervisor>) => {
    await updateAdminSupervisor(supId, updated);
    toast.success("Supervisor details updated successfully!");
    queryClient.invalidateQueries({ queryKey: ["admin", "supervisors"] });
  };

  const handleDelete = async (id: string) => {
    await deleteAdminSupervisor(id);
    toast.success("Supervisor removed from roster");
    queryClient.invalidateQueries({ queryKey: ["admin", "supervisors"] });
  };

  const handleExportCsv = () => {
    const exportData = filteredSups.map((s: any, index) => {
      const isAct = statusOverrides[s.id] !== undefined
        ? statusOverrides[s.id]
        : s.status === "Activated" || s.status === "AVAILABLE" || s.isActive;
      const compName = typeof s.company === "object" && s.company ? s.company.name : (s.companyName || "ServicePlus Network");
      return {
        "#": index + 1,
        "Company Name": compName,
        "Name": s.fullName || s.name || "Supervisor",
        "Email": s.email || "—",
        "Phone Number": s.phone || "—",
        "Status": isAct ? "Activated" : "Deactivated",
        "Registered On": s.registeredOn || s.createdAt?.slice(0, 10) || "—",
      };
    });
    downloadCsv(`supervisors_export_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success(`Exported ${exportData.length} records to CSV`);
  };

  const handleOpenAction = (
    sup: AdminSupervisor,
    action: "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status"
  ) => {
    setSelectedSup(sup);
    if (action === "toggle_status") {
      handleToggleStatus(sup);
    } else {
      setActiveAction(action);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Supervisors Management"
        description="Field audit supervisors, quality compliance officers, and site inspectors"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Supervisors Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen((v) => !v)}
            isSearchOpen={isSearchOpen}
            onExport={handleExportCsv}
            addNewLabel="Add New Supervisor"
            addNewTo="/admin/supervisors/create"
          />
        }
      />

      {/* Expandable Search & Filter Bar */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in-50 duration-150">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Supervisors
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Company Name</Label>
                <Input
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  placeholder="Filter company..."
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Supervisor Name</Label>
                <Input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Filter name..."
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Email</Label>
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Filter email..."
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
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

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Registered From</Label>
                <AdminDateInput value={startDate} onChange={setStartDate} placeholder="Start date" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Registered To</Label>
                <AdminDateInput value={endDate} onChange={setEndDate} placeholder="End date" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
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

      {/* Main Table Card */}
      <Card className="bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-semibold text-[13px]">
                <th className="px-3.5 py-3.5 w-12 text-center">#</th>
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

                {/* Sticky Actions Column */}
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
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading supervisors roster...
                  </td>
                </tr>
              ) : paginatedSups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No supervisor records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedSups.map((sup: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = statusOverrides[sup.id] !== undefined
                    ? statusOverrides[sup.id]
                    : sup.status === "Activated" || sup.status === "AVAILABLE" || sup.isActive;
                  const companyDisplayName = typeof sup.company === "object" && sup.company !== null
                    ? sup.company.name
                    : (sup.companyName || "ServicePlus Network");
                  const supDisplayName = sup.fullName || sup.name || "Supervisor";

                  // Registered On formatted
                  const rawDate = sup.registeredOn || sup.createdAt || "";
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
                    : "07-29-2026 5:12 PM";

                  return (
                    <tr key={sup.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-3.5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {companyDisplayName}
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-medium text-slate-900">
                        {supDisplayName}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 whitespace-nowrap">
                        {sup.email || "—"}
                      </td>
                      <td className="px-3.5 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {sup.phone || "—"}
                      </td>
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={isActivated ? "Activated" : "Deactivated"} />
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-700 text-xs whitespace-nowrap font-mono">
                        {formattedDate}
                      </td>

                      {/* Sticky Actions */}
                      <td className="sticky end-0 bg-white group-hover:bg-slate-50/90 z-10 px-3 py-3 text-center align-middle border-s border-slate-200/80 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-center gap-1">
                          <ActionIconButton
                            icon={isActivated ? X : Check}
                            label={isActivated ? "Deactivate" : "Activate"}
                            action={isActivated ? "toggle_off" : "toggle_on"}
                            onClick={() => handleToggleStatus(sup)}
                          />
                          <ActionIconButton
                            icon={Sliders}
                            label="Edit"
                            action="edit"
                            to="/admin/supervisors/edit"
                            search={{ id: sup.id }}
                          />
                          <ActionIconButton
                            icon={Eye}
                            label="View Info"
                            action="view"
                            onClick={() => handleOpenAction(sup, "info")}
                          />
                          <ActionIconButton
                            icon={KeyRound}
                            label="Change Password"
                            action="password"
                            onClick={() => handleOpenAction(sup, "password")}
                          />
                          <ActionIconButton
                            icon={Trash2}
                            label="Delete"
                            action="delete"
                            onClick={() => handleDelete(sup.id)}
                          />
                          <ActionIconButton
                            icon={Send}
                            label="Send Credentials"
                            action="send"
                            onClick={() => handleOpenAction(sup, "send_credentials")}
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
          totalItems={filteredSups.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Connected 6-Action Modals Component */}
      <SupervisorActionModal
        supervisor={selectedSup}
        activeAction={activeAction}
        companies={companies}
        onClose={() => {
          setActiveAction(null);
          setSelectedSup(null);
        }}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus as any}
      />
    </div>
  );
}
