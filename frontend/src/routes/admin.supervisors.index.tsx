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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import {
  Calendar,
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
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";

export const Route = createFileRoute("/admin/supervisors/")({ component: AdminSupervisorsPage });

function AdminSupervisorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: supsData, isPending } = useAdminQuery("supervisors", getAdminSupervisors);
  const { data: companiesData } = useAdminQuery("companies", getAdminCompanies);
  const supervisors: AdminSupervisor[] = (supsData as AdminSupervisor[]) ?? [];
  const companies = (companiesData as any[]) ?? [];

  // Search & Filter Panel State matching reference screenshot
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
      const isAct = s.status === "Activated" || s.status === "AVAILABLE" || s.isActive;
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
  }, [supervisors, appliedFilters, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredSups.length / pageSize) || 1;
  const paginatedSups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSups.slice(start, start + pageSize);
  }, [filteredSups, currentPage, pageSize]);

  // Actions
  const handleToggleStatus = async (sup: AdminSupervisor) => {
    const isCurrentlyActive = sup.status === "Activated" || (sup as any).status === "AVAILABLE" || (sup as any).isActive;
    const nextStatus = isCurrentlyActive ? "Deactivated" : "Activated";
    await updateAdminSupervisor(sup.id, { status: nextStatus });
    toast.success(`Supervisor status updated to ${nextStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "supervisors"] });
  };

  const handleSaveEdit = async (supId: string, updated: Partial<AdminSupervisor>) => {
    await updateAdminSupervisor(supId, updated);
    queryClient.invalidateQueries({ queryKey: ["admin", "supervisors"] });
  };

  const handleDelete = async (id: string) => {
    await deleteAdminSupervisor(id);
    toast.success("Supervisor removed from roster");
    queryClient.invalidateQueries({ queryKey: ["admin", "supervisors"] });
  };

  const handleExportCsv = () => {
    const exportData = filteredSups.map((s: any, index) => {
      const isAct = s.status === "Activated" || s.status === "AVAILABLE" || s.isActive;
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
      {/* Breadcrumb matching reference screenshot */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-600">Super Visors Management</span>
      </div>

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Supervisors Management
        </h1>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant={isSearchOpen ? "default" : "outline"}
            onClick={() => setIsSearchOpen((v) => !v)}
            className={`font-bold text-xs h-9 sm:h-10 px-4 rounded-xl shadow-2xs transition-all ${
              isSearchOpen
                ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Search className="size-3.5 me-1.5" /> Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 sm:h-10 px-4 rounded-xl shadow-2xs"
          >
            <Download className="size-3.5 me-1.5" /> Export
          </Button>
          <Button
            asChild
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-9 sm:h-10 px-5 rounded-xl shadow-sm"
          >
            <Link to="/admin/supervisors/create">
              <Plus className="size-3.5 me-1.5" /> Add New Supervisor
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Form Card */}
      {isSearchOpen && (
        <Card className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs transition-all">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Company</Label>
                <Input
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  placeholder="Search Company"
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

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
                <Label className="text-xs font-semibold text-slate-600">Search Email</Label>
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search Email"
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

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Start Date</Label>
                <AdminDateInput
                  placeholder="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">End Date</Label>
                <AdminDateInput
                  placeholder="End Date"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
            </div>

            {/* Filter Action Buttons */}
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
            Total {filteredSups.length} supervisor{filteredSups.length === 1 ? "" : "s"}
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
                    Loading supervisors roster...
                  </td>
                </tr>
              ) : paginatedSups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No supervisor records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedSups.map((sup: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = sup.status === "Activated" || sup.status === "AVAILABLE" || sup.isActive;
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
                    : "08-07-2026 4:26 PM";

                  return (
                    <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. # */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>

                      {/* 2. Company Name */}
                      <td className="px-3 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {companyDisplayName}
                      </td>

                      {/* 3. Name */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-medium text-slate-900">
                        {supDisplayName}
                      </td>

                      {/* 4. E-mail */}
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                        {sup.email || "—"}
                      </td>

                      {/* 5. Phone Number */}
                      <td className="px-3 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {sup.phone || "—"}
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAction(sup, "toggle_status")}
                            title={isActivated ? "Deactivate Supervisor" : "Activate Supervisor"}
                            className="text-rose-500 hover:scale-125 transition-transform"
                          >
                            {isActivated ? (
                              <X className="size-4 text-rose-500 stroke-[2.5]" />
                            ) : (
                              <Check className="size-4 text-emerald-500 stroke-[2.5]" />
                            )}
                          </button>
                          <Link
                            to="/admin/supervisors/edit"
                            search={{ id: sup.id }}
                            title="Edit Supervisor"
                            className="text-cyan-600 hover:scale-125 transition-transform inline-flex items-center justify-center"
                          >
                            <Sliders className="size-4 text-cyan-600 stroke-[2.5]" />
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
                                onClick={() => handleOpenAction(sup, "info")}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Eye className="size-3.5 me-2 text-cyan-600" /> Supervisor Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenAction(sup, "password")}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Lock className="size-3.5 me-2 text-teal-600" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenAction(sup, "send_credentials")}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Send className="size-3.5 me-2 text-indigo-600" /> Send Credentials
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenAction(sup, "delete")}
                                className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="size-3.5 me-2 text-rose-600" /> Delete Supervisor
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
            Showing {filteredSups.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredSups.length)} of {filteredSups.length} entries
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
                  className={`h-8 w-8 text-xs font-bold p-0 ${
                    p === currentPage ? "bg-cyan-600 text-white hover:bg-cyan-700" : ""
                  }`}
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
