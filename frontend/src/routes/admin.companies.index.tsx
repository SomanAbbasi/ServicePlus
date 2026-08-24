import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminCompany } from "@/frontend/lib/admin-mock-data";
import {
  getAdminCompanies,
  updateAdminCompany,
  deleteAdminCompany,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { CompanyActionModal } from "@/frontend/components/admin/CompanyActionModal";
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

export const Route = createFileRoute("/admin/companies/")({ component: AdminCompaniesPage });

function AdminCompaniesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isPending } = useAdminQuery("companies", getAdminCompanies);
  const companies: AdminCompany[] = (data as AdminCompany[]) ?? [];

  // Search & Filter state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    email: "",
    phone: "",
    status: "all",
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
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [activeAction, setActiveAction] = useState<
    "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status" | null
  >(null);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: searchName.trim().toLowerCase(),
      email: searchEmail.trim().toLowerCase(),
      phone: searchPhone.trim().toLowerCase(),
      status: searchStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchName("");
    setSearchEmail("");
    setSearchPhone("");
    setSearchStatus("all");
    setAppliedFilters({
      name: "",
      email: "",
      phone: "",
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

  const filteredCompanies = useMemo(() => {
    const list = companies.filter((c: any) => {
      const cName = (c.name || "").toLowerCase();
      const cEmail = (c.email || "").toLowerCase();
      const cPhone = (c.phone || "").toLowerCase();
      const isAct = statusOverrides[c.id] !== undefined
        ? statusOverrides[c.id]
        : c.status === "Activated" || c.status === "AVAILABLE" || c.isActive;
      const cStatus = isAct ? "Activated" : "Deactivated";

      if (appliedFilters.name && !cName.includes(appliedFilters.name)) return false;
      if (appliedFilters.email && !cEmail.includes(appliedFilters.email)) return false;
      if (appliedFilters.phone && !cPhone.includes(appliedFilters.phone)) return false;
      if (appliedFilters.status !== "all" && cStatus !== appliedFilters.status) return false;
      return true;
    });

    return list.sort((a: any, b: any) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
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
  }, [companies, appliedFilters, sortField, sortAsc, statusOverrides]);

  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  // Actions
  const handleToggleStatus = async (comp: AdminCompany) => {
    const isCurrentlyActive = statusOverrides[comp.id] !== undefined
      ? statusOverrides[comp.id]
      : comp.status === "Activated" || (comp as any).status === "AVAILABLE" || (comp as any).isActive;
    const nextIsActive = !isCurrentlyActive;
    const nextStatus = nextIsActive ? "Activated" : "Deactivated";

    // Immediate optimistic update
    setStatusOverrides((prev) => ({ ...prev, [comp.id]: nextIsActive }));

    try {
      await updateAdminCompany(comp.id, { status: nextStatus });
      toast.success(`Company status updated to ${nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
    } catch {
      setStatusOverrides((prev) => ({ ...prev, [comp.id]: isCurrentlyActive }));
      toast.error("Failed to update company status");
    }
  };

  const handleSaveEdit = async (companyId: string, updated: Partial<AdminCompany>) => {
    await updateAdminCompany(companyId, updated);
    toast.success("Company details updated successfully!");
    queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
  };

  const handleDelete = async (id: string) => {
    await deleteAdminCompany(id);
    toast.success("Company removed from partner list");
    queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
  };

  const handleExportCsv = () => {
    const exportData = filteredCompanies.map((c: any, index) => {
      const isAct = statusOverrides[c.id] !== undefined
        ? statusOverrides[c.id]
        : c.status === "Activated" || c.status === "AVAILABLE" || c.isActive;
      return {
        "#": index + 1,
        "Company Name": c.name || "Company",
        "Email": c.email || "—",
        "Phone Number": c.phone || "—",
        "Status": isAct ? "Activated" : "Deactivated",
        "Registered On": c.registeredOn || c.createdAt?.slice(0, 10) || "—",
      };
    });
    downloadCsv(`companies_export_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success(`Exported ${exportData.length} records to CSV`);
  };

  const handleOpenAction = (
    comp: AdminCompany,
    action: "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status"
  ) => {
    setSelectedCompany(comp);
    if (action === "toggle_status") {
      handleToggleStatus(comp);
    } else {
      setActiveAction(action);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Company Management"
        description="Partner service vendors, contractor organizations, and compliance documents"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Company Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen(v => !v)}
            isSearchOpen={isSearchOpen}
            onExport={handleExportCsv}
            addNewLabel="Add New Company"
            addNewTo="/admin/companies/create"
          />
        }
      />

      {/* Collapsible Search Drawer / Filter Form */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in-50 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Partner Companies
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
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Search Name..."
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Search Email</Label>
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search Email..."
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Search Phone</Label>
                <Input
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Search Phone..."
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
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Company Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
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

                {/* Sticky Action Column */}
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
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Loading partner companies...
                  </td>
                </tr>
              ) : paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No company records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((comp: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = statusOverrides[comp.id] !== undefined
                    ? statusOverrides[comp.id]
                    : comp.status === "Activated" || comp.status === "AVAILABLE" || comp.isActive;
                  const compDisplayName = comp.name || "Company";

                  // Registered On formatted
                  const rawDate = comp.registeredOn || comp.createdAt || "";
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
                    : "07-22-2026 7:34 PM";

                  return (
                    <tr key={comp.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-3.5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {compDisplayName}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 whitespace-nowrap">
                        {comp.email || "—"}
                      </td>
                      <td className="px-3.5 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {comp.phone || "—"}
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
                            onClick={() => handleToggleStatus(comp)}
                          />
                          <ActionIconButton
                            icon={Sliders}
                            label="Edit"
                            action="edit"
                            to="/admin/companies/edit"
                            search={{ id: comp.id }}
                          />
                          <ActionIconButton
                            icon={Eye}
                            label="View Info"
                            action="view"
                            onClick={() => handleOpenAction(comp, "info")}
                          />
                          <ActionIconButton
                            icon={KeyRound}
                            label="Change Password"
                            action="password"
                            onClick={() => handleOpenAction(comp, "password")}
                          />
                          <ActionIconButton
                            icon={Trash2}
                            label="Delete"
                            action="delete"
                            onClick={() => handleDelete(comp.id)}
                          />
                          <ActionIconButton
                            icon={Send}
                            label="Send Credentials"
                            action="send"
                            onClick={() => handleOpenAction(comp, "send_credentials")}
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
          totalItems={filteredCompanies.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Connected 6-Action Modals Component */}
      <CompanyActionModal
        company={selectedCompany}
        activeAction={activeAction}
        onClose={() => {
          setActiveAction(null);
          setSelectedCompany(null);
        }}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus as any}
      />
    </div>
  );
}
