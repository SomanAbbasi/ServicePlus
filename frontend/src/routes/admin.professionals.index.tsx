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
import { Checkbox } from "@/frontend/components/ui/checkbox";
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
  Glasses,
  KeyRound,
  Lock,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";

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

  // Preferred Checkbox Optimistic Overrides
  const [preferredOverrides, setPreferredOverrides] = useState<Record<string, boolean>>({});

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
      const isAct = p.status === "Activated" || p.status === "AVAILABLE" || p.isActive;
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
  }, [professionals, appliedFilters, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredPros.length / pageSize) || 1;
  const paginatedPros = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPros.slice(start, start + pageSize);
  }, [filteredPros, currentPage, pageSize]);

  // Actions
  const handleToggleStatus = async (pro: AdminProfessional) => {
    const isCurrentlyActive = pro.status === "Activated" || (pro as any).status === "AVAILABLE" || (pro as any).isActive;
    const nextStatus = isCurrentlyActive ? "Deactivated" : "Activated";
    await updateProfessional({ id: pro.id, status: nextStatus, isActive: nextStatus === "Activated" });
    toast.success(`Professional status updated to ${nextStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
  };

  const handleTogglePreferred = async (pro: AdminProfessional, checked: boolean) => {
    setPreferredOverrides((prev) => ({ ...prev, [pro.id]: checked }));
    await updateProfessional({ id: pro.id, isPreferred: checked });
    toast.success(
      checked
        ? `${pro.name || (pro as any).fullName || "Professional"} marked as Preferred ★`
        : `${pro.name || (pro as any).fullName || "Professional"} un-marked as Preferred`
    );
    queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
  };

  const handleSaveEdit = async (proId: string, updated: Partial<AdminProfessional>) => {
    await updateProfessional({ id: proId, ...updated });
    queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
  };

  const handleDelete = async (id: string) => {
    await deleteProfessional(id);
    toast.success("Professional removed from roster");
    queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
  };

  const handleExportCsv = () => {
    const exportData = filteredPros.map((p: any, index) => {
      const isAct = p.status === "Activated" || p.status === "AVAILABLE" || p.isActive;
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
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Professionals Management
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
            <Link to="/admin/professionals/create">
              <Plus className="size-3.5 me-1.5" /> Add New Professional
            </Link>
          </Button>
        </div>
      </div>

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
            Total {filteredPros.length} professional{filteredPros.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3 py-3 text-center min-w-[120px]">
                  Mark as Prefered
                </th>
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
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading professionals roster...
                  </td>
                </tr>
              ) : paginatedPros.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No professional records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedPros.map((pro: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = pro.status === "Activated" || pro.status === "AVAILABLE" || pro.isActive;
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
                    <tr key={pro.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. # */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>

                      {/* 2. Mark as Preferred Checkbox */}
                      <td className="px-3 py-3.5 text-center">
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
                      <td className="px-3 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {companyDisplayName}
                      </td>

                      {/* 4. Name */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-medium text-slate-900">
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
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                        {pro.email || "—"}
                      </td>

                      {/* 6. Phone Number */}
                      <td className="px-3 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {pro.phone || "—"}
                      </td>

                      {/* 7. Status */}
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

                      {/* 8. Registered On */}
                      <td className="px-3 py-3.5 text-slate-700 text-xs whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* 9. Action (6 Icons) */}
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                          <div className="flex items-center justify-center gap-2">
                            {/* 1. Toggle Status */}
                            <button
                              type="button"
                              onClick={() => handleOpenAction(pro, "toggle_status")}
                              title={isActivated ? "Deactivate Professional" : "Activate Professional"}
                              className="text-rose-500 hover:scale-125 transition-transform"
                            >
                              {isActivated ? (
                                <X className="size-4 text-rose-500 stroke-[2.5]" />
                              ) : (
                                <Check className="size-4 text-emerald-500 stroke-[2.5]" />
                              )}
                            </button>
                            {/* 2. Edit */}
                            <Link
                              to="/admin/professionals/edit"
                              search={{ id: pro.id }}
                              title="Edit Professional"
                              className="text-blue-500 hover:scale-125 transition-transform inline-flex items-center justify-center"
                            >
                              <Sliders className="size-4 text-blue-500 stroke-[2.5]" />
                            </Link>
                            {/* 3. View Info / Details */}
                            <button
                              type="button"
                              onClick={() => handleOpenAction(pro, "info")}
                              title="Professional Details"
                              className="text-blue-600 hover:scale-125 transition-transform"
                            >
                              <Glasses className="size-4 text-blue-600 stroke-[2.5]" />
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            {/* 4. Change Password */}
                            <button
                              type="button"
                              onClick={() => handleOpenAction(pro, "password")}
                              title="Change Password"
                              className="text-cyan-500 hover:scale-125 transition-transform"
                            >
                              <KeyRound className="size-4 text-cyan-500 stroke-[2.5]" />
                            </button>
                            {/* 5. Delete */}
                            <button
                              type="button"
                              onClick={() => handleOpenAction(pro, "delete")}
                              title="Delete Professional"
                              className="text-rose-500 hover:scale-125 transition-transform"
                            >
                              <Trash2 className="size-4 text-rose-500 stroke-[2.5]" />
                            </button>
                            {/* 6. Send Credentials */}
                            <button
                              type="button"
                              onClick={() => handleOpenAction(pro, "send_credentials")}
                              title="Send Credentials"
                              className="text-slate-800 hover:scale-125 transition-transform"
                            >
                              <Send className="size-4 text-slate-800 stroke-[2.5]" />
                            </button>
                          </div>
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
            Showing {filteredPros.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredPros.length)} of {filteredPros.length} entries
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
