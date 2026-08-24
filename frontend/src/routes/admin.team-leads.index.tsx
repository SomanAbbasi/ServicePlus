import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminTeamLead } from "@/frontend/lib/admin-mock-data";
import {
  getAdminTeamLeads,
  updateAdminTeamLead,
  deleteAdminTeamLead,
  getAdminCompanies,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { TeamLeadActionModal } from "@/frontend/components/admin/TeamLeadActionModal";
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

export const Route = createFileRoute("/admin/team-leads/")({ component: AdminTeamLeadsPage });

function AdminTeamLeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: leadsData, isPending } = useAdminQuery("team_leads", getAdminTeamLeads);
  const { data: companiesData } = useAdminQuery("companies", getAdminCompanies);
  const teamLeads: AdminTeamLead[] = (leadsData as AdminTeamLead[]) ?? [];
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

  // Optimistic Status overrides
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});

  // Modal Actions state
  const [selectedLead, setSelectedLead] = useState<AdminTeamLead | null>(null);
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

  const filteredLeads = useMemo(() => {
    const list = teamLeads.filter((l: any) => {
      const lName = (l.fullName || l.name || "").toLowerCase();
      const lEmail = (l.email || "").toLowerCase();
      const lPhone = (l.phone || "").toLowerCase();
      const lCompId = l.companyId || (l.company && l.company.id) || "";
      const isAct = statusOverrides[l.id] !== undefined
        ? statusOverrides[l.id]
        : l.status === "Activated" || l.status === "AVAILABLE" || l.isActive;
      const lStatus = isAct ? "Activated" : "Deactivated";

      if (appliedFilters.name && !lName.includes(appliedFilters.name)) return false;
      if (appliedFilters.email && !lEmail.includes(appliedFilters.email)) return false;
      if (appliedFilters.phone && !lPhone.includes(appliedFilters.phone)) return false;
      if (appliedFilters.companyId !== "all" && lCompId !== appliedFilters.companyId) return false;
      if (appliedFilters.status !== "all" && lStatus !== appliedFilters.status) return false;
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
  }, [teamLeads, appliedFilters, sortField, sortAsc, statusOverrides]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Actions
  const handleToggleStatus = async (lead: AdminTeamLead) => {
    const isCurrentlyActive = statusOverrides[lead.id] !== undefined
      ? statusOverrides[lead.id]
      : lead.status === "Activated" || (lead as any).status === "AVAILABLE" || (lead as any).isActive;
    const nextIsActive = !isCurrentlyActive;
    const nextStatus = nextIsActive ? "Activated" : "Deactivated";

    // Immediate optimistic update
    setStatusOverrides((prev) => ({ ...prev, [lead.id]: nextIsActive }));

    try {
      await updateAdminTeamLead(lead.id, { status: nextStatus });
      toast.success(`Team Lead status updated to ${nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "team_leads"] });
    } catch {
      setStatusOverrides((prev) => ({ ...prev, [lead.id]: isCurrentlyActive }));
      toast.error("Failed to update status");
    }
  };

  const handleSaveEdit = async (leadId: string, updated: Partial<AdminTeamLead>) => {
    await updateAdminTeamLead(leadId, updated);
    toast.success("Team Lead details saved successfully!");
    queryClient.invalidateQueries({ queryKey: ["admin", "team_leads"] });
  };

  const handleDelete = async (id: string) => {
    await deleteAdminTeamLead(id);
    toast.success("Team Lead removed from roster");
    queryClient.invalidateQueries({ queryKey: ["admin", "team_leads"] });
  };

  const handleExportCsv = () => {
    const exportData = filteredLeads.map((l: any, index) => {
      const isAct = statusOverrides[l.id] !== undefined
        ? statusOverrides[l.id]
        : l.status === "Activated" || l.status === "AVAILABLE" || l.isActive;
      const compName = typeof l.company === "object" && l.company ? l.company.name : (l.companyName || "ServicePlus Network");
      return {
        "#": index + 1,
        "Company Name": compName,
        "Name": l.fullName || l.name || "Team Lead",
        "Email": l.email || "—",
        "Phone Number": l.phone || "—",
        "Status": isAct ? "Activated" : "Deactivated",
        "Registered On": l.registeredOn || l.createdAt?.slice(0, 10) || "—",
      };
    });
    downloadCsv(`team_leads_export_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success(`Exported ${exportData.length} records to CSV`);
  };

  const handleOpenAction = (
    lead: AdminTeamLead,
    action: "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status"
  ) => {
    setSelectedLead(lead);
    if (action === "toggle_status") {
      handleToggleStatus(lead);
    } else {
      setActiveAction(action);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Team Lead Management"
        description="Field leaders, operational supervisory staff, and direct territory managers"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Team Lead Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen((v) => !v)}
            isSearchOpen={isSearchOpen}
            onExport={handleExportCsv}
            addNewLabel="Add Team Lead"
            addNewTo="/admin/team-leads/create"
          />
        }
      />

      {/* Expandable Search & Filter Bar */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in-50 duration-150">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Team Leads
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
                <Label className="text-xs font-bold text-slate-700">Search Name</Label>
                <Input
                  placeholder="Filter by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Search Email</Label>
                <Input
                  placeholder="Filter by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Search Phone</Label>
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
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading team leads roster...
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No team lead records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = statusOverrides[lead.id] !== undefined
                    ? statusOverrides[lead.id]
                    : lead.status === "Activated" || lead.status === "AVAILABLE" || lead.isActive;
                  const companyDisplayName = typeof lead.company === "object" && lead.company !== null
                    ? lead.company.name
                    : (lead.companyName || "ServicePlus Network");
                  const leadDisplayName = lead.fullName || lead.name || "Team Lead";

                  // Registered On formatted
                  const rawDate = lead.registeredOn || lead.createdAt || "";
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
                    <tr key={lead.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-3.5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {companyDisplayName}
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-medium text-slate-900">
                        {leadDisplayName}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 whitespace-nowrap">
                        {lead.email || "—"}
                      </td>
                      <td className="px-3.5 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {lead.phone || "—"}
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
                            onClick={() => handleToggleStatus(lead)}
                          />
                          <ActionIconButton
                            icon={Sliders}
                            label="Edit"
                            action="edit"
                            to="/admin/team-leads/edit"
                            search={{ id: lead.id }}
                          />
                          <ActionIconButton
                            icon={Eye}
                            label="View Info"
                            action="view"
                            onClick={() => handleOpenAction(lead, "info")}
                          />
                          <ActionIconButton
                            icon={KeyRound}
                            label="Change Password"
                            action="password"
                            onClick={() => handleOpenAction(lead, "password")}
                          />
                          <ActionIconButton
                            icon={Trash2}
                            label="Delete"
                            action="delete"
                            onClick={() => handleOpenAction(lead, "delete")}
                          />
                          <ActionIconButton
                            icon={Send}
                            label="Send Credentials"
                            action="send"
                            onClick={() => handleOpenAction(lead, "send_credentials")}
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
          totalItems={filteredLeads.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Connected 6-Action Modals Component */}
      <TeamLeadActionModal
        teamLead={selectedLead}
        activeAction={activeAction}
        companies={companies}
        onClose={() => {
          setActiveAction(null);
          setSelectedLead(null);
        }}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus as any}
      />
    </div>
  );
}
