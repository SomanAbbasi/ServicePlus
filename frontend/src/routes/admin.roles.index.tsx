import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminRole } from "@/frontend/lib/admin-mock-data";
import {
  getAdminRoles,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Check, ChevronsUpDown, RotateCcw, Search, Sliders, Trash2, X } from "lucide-react";
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

export const Route = createFileRoute("/admin/roles/")({ component: AdminRolesPage });

function AdminRolesPage() {
  const queryClient = useQueryClient();
  const { data: rolesData, isPending } = useAdminQuery("roles", getAdminRoles);
  const roles: AdminRole[] = (rolesData as AdminRole[]) ?? [];

  // Search & Filter Panel State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    status: "all",
  });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting state
  const [sortField, setSortField] = useState<string>("name");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Optimistic status overrides
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: searchName.trim().toLowerCase(),
      status: searchStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchName("");
    setSearchStatus("all");
    setAppliedFilters({
      name: "",
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

  const filteredRoles = useMemo(() => {
    const list = roles.filter((r) => {
      const isAct = statusOverrides[r.id] !== undefined ? statusOverrides[r.id] : r.status === "Activated";
      const currentStatus = isAct ? "Activated" : "Deactivated";

      if (appliedFilters.name) {
        const matchName = (r.name || "").toLowerCase().includes(appliedFilters.name);
        if (!matchName) return false;
      }
      if (appliedFilters.status !== "all") {
        if (currentStatus !== appliedFilters.status) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA: any = (a as any)[sortField] ?? "";
      let valB: any = (b as any)[sortField] ?? "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [roles, appliedFilters, sortField, sortAsc, statusOverrides]);

  const totalPages = Math.ceil(filteredRoles.length / pageSize) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, currentPage, pageSize]);

  const handleDeleteRole = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete role "${name}"?`)) {
      await deleteAdminRole(id);
      toast.success(`Role "${name}" removed.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    }
  };

  const handleToggleStatus = async (role: AdminRole) => {
    const isCurrentlyActive = statusOverrides[role.id] !== undefined
      ? statusOverrides[role.id]
      : role.status === "Activated";
    const nextIsActive = !isCurrentlyActive;
    const nextStatus = nextIsActive ? "Activated" : "Deactivated";

    // Immediate optimistic update
    setStatusOverrides((prev) => ({ ...prev, [role.id]: nextIsActive }));

    try {
      await updateAdminRole(role.id, { status: nextStatus });
      toast.success(`Role ${role.name} is now ${nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    } catch {
      setStatusOverrides((prev) => ({ ...prev, [role.id]: isCurrentlyActive }));
      toast.error("Failed to update status");
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredRoles.map((r, index) => ({
      "#": index + 1,
      "Role Name": r.name || "",
      "Status": statusOverrides[r.id] !== undefined ? (statusOverrides[r.id] ? "Activated" : "Deactivated") : r.status || "Activated",
      "Registered On": r.registeredOn || "—",
    }));
    downloadCsv(`roles_export_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success(`Exported ${exportData.length} records to CSV`);
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Roles Management"
        description="Configure role definitions, granular administrative permissions, and module access"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Roles Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen(v => !v)}
            isSearchOpen={isSearchOpen}
            onExport={handleExportCsv}
            addNewLabel="Add Role"
            addNewTo="/admin/roles/create"
          />
        }
      />

      {/* Expandable Search & Filter Bar */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Roles
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Role Name</Label>
                <Input
                  placeholder="Search Role Name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
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
                    <SelectItem value="all" className="text-xs font-semibold">All Statuses</SelectItem>
                    <SelectItem value="Activated" className="text-xs font-semibold">Activated</SelectItem>
                    <SelectItem value="Deactivated" className="text-xs font-semibold">Deactivated</SelectItem>
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
                    Role Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
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
                <th className="sticky end-0 bg-slate-50 z-10 px-4 py-3.5 text-center min-w-[140px] border-s border-slate-200">
                  <div className="flex items-center justify-center gap-1 text-slate-700 font-bold">
                    Action
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
              {isPending ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    Loading roles directory...
                  </td>
                </tr>
              ) : paginatedRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No roles found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedRoles.map((role, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = statusOverrides[role.id] !== undefined
                    ? statusOverrides[role.id]
                    : role.status === "Activated";

                  return (
                    <tr key={role.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-3.5 py-3.5 font-bold text-slate-900">
                        {role.name}
                      </td>
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={isActivated ? "Activated" : "Deactivated"} />
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-700 text-xs whitespace-nowrap font-mono">{role.registeredOn || "—"}</td>

                      {/* Sticky Actions */}
                      <td className="sticky end-0 bg-white group-hover:bg-slate-50/90 z-10 px-3 py-3 text-center align-middle border-s border-slate-200/80 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <ActionIconButton
                            icon={isActivated ? X : Check}
                            label={isActivated ? "Deactivate" : "Activate"}
                            action={isActivated ? "toggle_off" : "toggle_on"}
                            onClick={() => handleToggleStatus(role)}
                          />
                          <ActionIconButton
                            icon={Sliders}
                            label="Edit Permissions"
                            action="edit"
                            to="/admin/roles/edit"
                            search={{ id: role.id }}
                          />
                          <ActionIconButton
                            icon={Trash2}
                            label="Delete"
                            action="delete"
                            onClick={() => handleDeleteRole(role.id, role.name)}
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
          totalItems={filteredRoles.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
