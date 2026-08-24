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

  // Status overrides for instant optimistic UI update
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});

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
      const isAct = statusOverrides[s.id] !== undefined ? statusOverrides[s.id] : s.status === "Activated";
      const currentStatus = isAct ? "Activated" : "Deactivated";

      if (appliedFilters.name && !(s.name || "").toLowerCase().includes(appliedFilters.name)) return false;
      if (appliedFilters.email && !(s.email || "").toLowerCase().includes(appliedFilters.email)) return false;
      if (appliedFilters.phone && !(s.phone || "").toLowerCase().includes(appliedFilters.phone)) return false;
      if (appliedFilters.status !== "all" && currentStatus !== appliedFilters.status) return false;
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
  }, [staffList, appliedFilters, sortField, sortAsc, statusOverrides]);

  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  const handleToggleStatus = async (staff: AdminStaff) => {
    const isCurrentlyActive = statusOverrides[staff.id] !== undefined
      ? statusOverrides[staff.id]
      : staff.status === "Activated";
    const nextIsActive = !isCurrentlyActive;
    const nextStatus = nextIsActive ? "Activated" : "Deactivated";

    // Immediate optimistic update
    setStatusOverrides((prev) => ({ ...prev, [staff.id]: nextIsActive }));

    try {
      await updateAdminStaff(staff.id, { status: nextStatus });
      toast.success(`Staff status changed to ${nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    } catch {
      setStatusOverrides((prev) => ({ ...prev, [staff.id]: isCurrentlyActive }));
      toast.error("Failed to update staff status");
    }
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
        description="Internal operations team members, roles allocation, and access controls"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Staff Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen((v) => !v)}
            isSearchOpen={isSearchOpen}
            onExport={() =>
              downloadCsv(
                "staff-list.csv",
                filteredStaff.map((s, i) => ({
                  "#": i + 1,
                  Name: s.name || "",
                  Email: s.email || "",
                  Phone: s.phone || "",
                  Role: s.roleName || "",
                  Status: statusOverrides[s.id] !== undefined ? (statusOverrides[s.id] ? "Activated" : "Deactivated") : s.status || "Activated",
                  Registered: s.registeredOn || "",
                }))
              )
            }
            addNewLabel="Add Staff Member"
            addNewTo="/admin/staff/create"
          />
        }
      />

      {/* Collapsible Search & Filter Card */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Staff Directory
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
                  placeholder="Search Name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Search Email</Label>
                <Input
                  placeholder="Search Email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Search Phone</Label>
                <Input
                  placeholder="Search Phone..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Role / Designation</Label>
                <Select value={searchRoleId} onValueChange={setSearchRoleId}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Roles
                    </SelectItem>
                    {rolesList.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs font-semibold">
                        {r.name}
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
                  onClick={() => handleSort("fullName")}
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
                  className="px-3.5 py-3.5 text-start cursor-pointer select-none hover:text-cyan-700 transition-colors"
                  onClick={() => handleSort("roleName")}
                >
                  <div className="flex items-center gap-1">
                    Role / Designation <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
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

                {/* Sticky Actions */}
                <th className="sticky end-0 bg-slate-50 z-10 px-4 py-3.5 text-center min-w-[170px] border-s border-slate-200">
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
                    Loading staff directory...
                  </td>
                </tr>
              ) : paginatedStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No staff records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((staff: any, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = statusOverrides[staff.id] !== undefined
                    ? statusOverrides[staff.id]
                    : staff.status === "Activated";
                  const roleDisplayName = typeof staff.role === "object" && staff.role !== null ? staff.role.name : (staff.roleName || "Staff Member");
                  const staffDisplayName = staff.fullName || staff.name || staff.email || "Staff Member";
                  const initial = ((staffDisplayName || "S").charAt(0) || "S").toUpperCase();

                  return (
                    <tr key={staff.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-3.5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 place-items-center rounded-full bg-cyan-100 text-cyan-800 font-extrabold text-xs shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <span className="font-bold text-slate-900 truncate max-w-[180px]">
                            {staffDisplayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600">{staff.email || "—"}</td>
                      <td className="px-3.5 py-3.5 font-mono text-slate-600">{staff.phone || "—"}</td>
                      <td className="px-3.5 py-3.5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                          {roleDisplayName}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={isActivated ? "Activated" : "Deactivated"} />
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-700 text-xs whitespace-nowrap font-mono">
                        {staff.registeredOn || staff.createdAt?.slice(0, 10) || "—"}
                      </td>

                      {/* Sticky Action Icons */}
                      <td className="sticky end-0 bg-white group-hover:bg-slate-50/90 z-10 px-3 py-3 text-center align-middle border-s border-slate-200/80 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <ActionIconButton
                            icon={isActivated ? X : Check}
                            label={isActivated ? "Deactivate" : "Activate"}
                            action={isActivated ? "toggle_off" : "toggle_on"}
                            onClick={() => handleToggleStatus(staff)}
                          />
                          <ActionIconButton
                            icon={Sliders}
                            label="Edit"
                            action="edit"
                            to="/admin/staff/edit"
                            search={{ id: staff.id }}
                          />
                          <ActionIconButton
                            icon={Send}
                            label="Send Credentials"
                            action="send"
                            onClick={() => handleSendCredentials(staff)}
                          />
                          <ActionIconButton
                            icon={Trash2}
                            label="Delete"
                            action="delete"
                            onClick={() => handleDeleteStaff(staff.id)}
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
          totalItems={filteredStaff.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
