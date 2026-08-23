import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminStaff } from "@/frontend/lib/admin-mock-data";
import {
  getAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  getAdminRoles,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";

import {
  Check,
  ChevronsUpDown,
  Download,
  Filter,
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

export const Route = createFileRoute("/admin/staff/")({ component: AdminStaffPage });

function AdminStaffPage() {
  const queryClient = useQueryClient();
  const { data: staffData, isPending } = useAdminQuery("staff", getAdminStaff);
  const { data: rolesData } = useAdminQuery("roles", getAdminRoles);
  const staffList: AdminStaff[] = (staffData as AdminStaff[]) ?? [];
  const rolesList = (rolesData as any[]) ?? [];

  // Search & Filter Panel state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");
  const [searchRoleId, setSearchRoleId] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    email: "",
    phone: "",
    status: "all",
    roleId: "all",
  });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("registeredOn");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: searchName.trim().toLowerCase(),
      email: searchEmail.trim().toLowerCase(),
      phone: searchPhone.trim().toLowerCase(),
      status: searchStatus,
      roleId: searchRoleId,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchName("");
    setSearchEmail("");
    setSearchPhone("");
    setSearchStatus("all");
    setSearchRoleId("all");
    setAppliedFilters({
      name: "",
      email: "",
      phone: "",
      status: "all",
      roleId: "all",
    });
    setCurrentPage(1);
  };

  const filteredStaff = useMemo(() => {
    const list = staffList.filter((s) => {
      if (appliedFilters.name && !(s.name || "").toLowerCase().includes(appliedFilters.name)) return false;
      if (appliedFilters.email && !(s.email || "").toLowerCase().includes(appliedFilters.email)) return false;
      if (appliedFilters.phone && !(s.phone || "").toLowerCase().includes(appliedFilters.phone)) return false;
      if (appliedFilters.status !== "all" && s.status !== appliedFilters.status) return false;
      if (appliedFilters.roleId !== "all" && s.roleId !== appliedFilters.roleId) return false;
      return true;
    });

    return [...list].sort((a: any, b: any) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [staffList, appliedFilters, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  const handleToggleStatus = async (staff: AdminStaff) => {
    const nextStatus = staff.status === "Activated" ? "Deactivated" : "Activated";
    await updateAdminStaff(staff.id, { status: nextStatus });
    toast.success(`Staff status changed to ${nextStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      await deleteAdminStaff(id);
      toast.success("Staff member deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    }
  };

  const handleSendCredentials = (staff: AdminStaff) => {
    toast.success(`Credentials dispatched to ${staff.email} via Email & SMS.`);
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
  title="Staff Management"
  breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Staff Management" }]}
  actions={
    <PageActions
      onSearchToggle={() => setIsSearchOpen((v) => !v)}
      isSearchOpen={isSearchOpen}
      onExport={() => downloadCsv("staff-list.csv", filteredStaff.map((s, i) => ({ "#": i + 1, "Name": s.name || "", "Email": s.email || "", "Phone": s.phone || "", "Role": s.roleName || "", "Status": s.status || "Activated", "Registered": s.registeredOn || "" })))}
      addNewLabel="Add Staff Member"
      addNewTo="/admin/staff/create"
    />
  }
/>

      {/* Collapsible Search & Filter Card */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Name</Label>
                <Input
                  placeholder="Search Name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Email</Label>
                <Input
                  placeholder="Search Email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Search Phone Number</Label>
                <Input
                  placeholder="Search Phone Number"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Role / Designation</Label>
                <Select value={searchRoleId} onValueChange={setSearchRoleId}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Roles</SelectItem>
                    {rolesList.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs font-semibold">
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Status</Label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">Select Status (All)</SelectItem>
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

      {/* Main Table Card */}
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
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total {filteredStaff.length} staff member{filteredStaff.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-1">
                    Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    E-mail <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center gap-1">
                    Phone Number <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("roleName")}
                >
                  <div className="flex items-center gap-1">
                    Role / Designation <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
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
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
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
                    Loading staff directory...
                  </td>
                </tr>
              ) : paginatedStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No staff records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((staff: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = staff.status === "Activated";
                  const roleDisplayName = typeof staff.role === "object" && staff.role !== null ? staff.role.name : (staff.roleName || "Staff Member");
                  const staffDisplayName = staff.fullName || staff.name || staff.email || "Staff Member";
                  const initial = ((staffDisplayName || "S").charAt(0) || "S").toUpperCase();

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-7 place-items-center rounded-full bg-cyan-100 text-cyan-800 font-bold text-[11px] shrink-0">
                            {initial}
                          </div>
                          <span className="font-bold text-slate-900 truncate max-w-[180px]">
                            {staffDisplayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{staff.email || "—"}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{staff.phone || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                          {roleDisplayName}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={staff.status || "Activated"} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {staff.registeredOn || staff.createdAt?.slice(0, 10) || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-center align-middle">
                        <div className="flex items-center gap-1">
                          <ActionIconButton icon={isActivated ? X : Check} label={isActivated ? "Deactivate" : "Activate"} action={isActivated ? "toggle_off" : "toggle_on"} onClick={() => handleToggleStatus(staff)} />
                          <ActionIconButton icon={Sliders} label="Edit" action="edit" to="/admin/staff/edit" search={{ id: staff.id }} />
                          <ActionIconButton icon={Send} label="Send" action="send" onClick={() => handleSendCredentials(staff)} />
                          <ActionIconButton icon={Trash2} label="Delete" action="delete" onClick={() => handleDeleteStaff(staff.id)} />
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
            Showing {filteredStaff.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredStaff.length)} of {filteredStaff.length} entries
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
                className={`h-8 w-8 p-0 text-xs font-bold rounded-lg ${
                  p === currentPage ? "" : "text-slate-600"
                }`}
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
    </div>
  );
}
