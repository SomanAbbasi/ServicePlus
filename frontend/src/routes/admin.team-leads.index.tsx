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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import {
  Check,
  ChevronsUpDown,
  Download,
  Eye,
  Filter,
  Lock,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageActions, StatusBadge, ActionIconButton, downloadCsv } from "@/frontend/components/admin/shell";

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
      const isAct = l.status === "Activated" || l.status === "AVAILABLE" || l.isActive;
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
  }, [teamLeads, appliedFilters, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Actions
  const handleToggleStatus = async (lead: AdminTeamLead) => {
    const isCurrentlyActive = lead.status === "Activated" || (lead as any).status === "AVAILABLE" || (lead as any).isActive;
    const nextStatus = isCurrentlyActive ? "Deactivated" : "Activated";
    await updateAdminTeamLead(lead.id, { status: nextStatus });
    toast.success(`Team Lead status updated to ${nextStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "team_leads"] });
  };

  const handleSaveEdit = async (leadId: string, updated: Partial<AdminTeamLead>) => {
    await updateAdminTeamLead(leadId, updated);
    queryClient.invalidateQueries({ queryKey: ["admin", "team_leads"] });
  };

  const handleDelete = async (id: string) => {
    await deleteAdminTeamLead(id);
    toast.success("Team Lead removed from roster");
    queryClient.invalidateQueries({ queryKey: ["admin", "team_leads"] });
  };

  const handleExportCsv = () => {
    const exportData = filteredLeads.map((l: any, index) => {
      const isAct = l.status === "Activated" || l.status === "AVAILABLE" || l.isActive;
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
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Team Lead Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen(v => !v)}
            isSearchOpen={isSearchOpen}
            onExport={handleExportCsv}
            addNewLabel="Add New Team Lead"
            addNewTo="/admin/team-leads/create"
          />
        }
      />

      {/* Collapsible Search Drawer / Filter Form */}
      {isSearchOpen && (
        <Card className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs transition-all animate-in fade-in-50 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Name</Label>
                <Input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Search Name"
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search E-mail</Label>
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search E-mail"
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Phone Number</Label>
                <Input
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Search Phone Number"
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Company</Label>
                <Select value={searchCompanyId} onValueChange={setSearchCompanyId}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">All Companies</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Status</Label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select Status (All)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">Select Status (All)</SelectItem>
                    <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">
                      Activated
                    </SelectItem>
                    <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">
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
                className="font-bold text-xs h-9 px-4 rounded-lg"
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

      {/* Main Table Card matching reference screenshot */}
      <Card className="p-4 sm:p-6 bg-white border-slate-200/80 rounded-2xl shadow-xs space-y-4">
        {/* Table Page Size Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
              <SelectTrigger className="h-8 w-16 text-xs bg-slate-50 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="100" className="text-xs">100</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total {filteredLeads.length} team lead{filteredLeads.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("companyName")}
                >
                  <div className="flex items-center gap-1">
                    Company Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    E-mail <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center gap-1">
                    Phone Number <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-center cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("registeredOn")}
                >
                  <div className="flex items-center gap-1">
                    Registered On <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-16">
                  <div className="flex items-center justify-center gap-1 text-slate-600 font-bold">
                    Action <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isPending ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading team leads roster...
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No team lead records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = lead.status === "Activated" || lead.status === "AVAILABLE" || lead.isActive;
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
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. # */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>

                      {/* 2. Company Name */}
                      <td className="px-3 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {companyDisplayName}
                      </td>

                      {/* 3. Name */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-medium text-slate-900">
                        {leadDisplayName}
                      </td>

                      {/* 4. E-mail */}
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                        {lead.email || "—"}
                      </td>

                      {/* 5. Phone Number */}
                      <td className="px-3 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {lead.phone || "—"}
                      </td>

                      {/* 6. Status */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            isActivated
                              ? "bg-emerald-100/70 text-emerald-700"
                              : "bg-rose-100/70 text-rose-700"
                          }`}
                        >
                          {isActivated ? "Activated" : "Deactivated"}
                        </span>
                      </td>

                      {/* 7. Registered On */}
                      <td className="px-3 py-3.5 text-slate-700 text-xs whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* 8. Action (Horizontal Row) */}
                      <td className="px-3 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <ActionIconButton
                            icon={isActivated ? X : Check} 
                            label={isActivated ? "Deactivate" : "Activate"}
                            action="toggle_status"
                            onClick={() => handleOpenAction(lead, "toggle_status")}
                          />
                          <ActionIconButton
                            icon={Sliders}
                            label="Edit"
                            action="edit"
                            to="/admin/team-leads/edit"
                            search={{ id: lead.id }}
                          />
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
                                onClick={() => handleOpenAction(lead, "info")}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Eye className="size-3.5 me-2 text-primary" /> Team Lead Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenAction(lead, "password")}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Lock className="size-3.5 me-2 text-teal-600" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenAction(lead, "send_credentials")}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Send className="size-3.5 me-2 text-indigo-600" /> Send Credentials
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenAction(lead, "delete")}
                                className="text-xs font-medium text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5 me-2 text-destructive" /> Delete Team Lead
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
            Showing {filteredLeads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} entries
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs px-2.5 font-semibold"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                  <Button
                    key={p}
                    type="button"
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    className={`h-8 w-8 text-xs font-bold p-0`}
                  >
                    {p}
                  </Button>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 text-xs px-2.5 font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
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
