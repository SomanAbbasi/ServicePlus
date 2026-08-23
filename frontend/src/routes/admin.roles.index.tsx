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
import { PermissionMatrix } from "@/frontend/components/admin/PermissionMatrix";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/frontend/components/ui/dialog";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { ChevronsUpDown, Filter, RotateCcw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageActions, StatusBadge, ActionIconButton } from "@/frontend/components/admin/shell";

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
  const [sortField, setSortField] = useState<string>("id");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Add / Edit Role Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleStatus, setRoleStatus] = useState<"Activated" | "Deactivated">("Activated");
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});

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
      if (appliedFilters.name) {
        const matchName = (r.name || "").toLowerCase().includes(appliedFilters.name);
        if (!matchName) return false;
      }
      if (appliedFilters.status !== "all") {
        if (r.status !== appliedFilters.status) return false;
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
  }, [roles, appliedFilters, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredRoles.length / pageSize) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, currentPage, pageSize]);

  const handleOpenEdit = (role: AdminRole) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleStatus(role.status);
    setRolePermissions(role.permissions || {});
    setIsModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Role Name is required.");
      return;
    }

    if (editingRoleId) {
      await updateAdminRole(editingRoleId, {
        name: roleName,
        status: roleStatus,
        permissions: rolePermissions,
      });
      toast.success(`Role ${roleName} updated successfully!`);
    } else {
      await createAdminRole({
        name: roleName,
        status: roleStatus,
        permissions: rolePermissions,
      });
      toast.success(`Role ${roleName} created successfully!`);
    }

    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete role "${name}"?`)) {
      await deleteAdminRole(id);
      toast.success(`Role "${name}" removed.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    }
  };

  const handleToggleStatus = async (role: AdminRole) => {
    const nextStatus = role.status === "Activated" ? "Deactivated" : "Activated";
    await updateAdminRole(role.id, { status: nextStatus });
    toast.success(`Role ${role.name} is now ${nextStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Breadcrumbs & Header Actions */}
      <PageHeader
        title="Roles Management"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Roles Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setIsSearchOpen(v => !v)}
            isSearchOpen={isSearchOpen}
            addNewLabel="Add Role"
            addNewTo="/admin/roles/create"
          />
        }
      />

      {/* Collapsible Search & Filter Panel Matching Reference Screenshot */}
      {isSearchOpen && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  placeholder="Search Name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                  Status
                </label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">Select Status</SelectItem>
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
                <SelectItem value="20" className="text-xs">20</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total {filteredRoles.length} role{filteredRoles.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
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
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading roles directory...
                  </td>
                </tr>
              ) : paginatedRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No roles found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedRoles.map((role, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActivated = role.status === "Activated";

                  return (
                    <tr key={role.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3.5 text-center font-medium text-slate-500">{globalIdx}</td>
                      <td className="px-3 py-3.5 font-bold text-slate-900">
                        {role.name}
                      </td>
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={isActivated ? "Activated" : "Deactivated"} />
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 text-xs">{role.registeredOn || "—"}</td>
                      <td className="px-3 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <ActionIconButton
                            icon={undefined} 
                            label={isActivated ? "Deactivate" : "Activate"}
                            action="toggle_status"
                            onClick={() => handleToggleStatus(role)}
                          />
                          <ActionIconButton
                            icon={undefined}
                            label="Edit"
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredRoles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredRoles.length)} of {filteredRoles.length} entries
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
                className={`h-8 w-8 p-0 text-xs font-bold rounded-lg`}
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

      {/* Edit Role Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Configure Role Permissions
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update role title and customize permissions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRole} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Role Title *</Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Finance Admin"
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Status</Label>
                <Select value={roleStatus} onValueChange={(val: any) => setRoleStatus(val)}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                    <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2">
              <PermissionMatrix permissions={rolePermissions} onChange={setRolePermissions} />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 text-xs font-bold rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 text-xs font-bold rounded-lg shadow-sm"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
