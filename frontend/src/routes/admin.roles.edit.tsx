import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminRoles, updateAdminRole } from "@/frontend/lib/api-services";
import { AdminRole, AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { PermissionMatrix } from "@/frontend/components/admin/PermissionMatrix";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/roles/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditRolePage,
});

function EditRolePage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useAdminQuery("roles", getAdminRoles);
  const roles: AdminRole[] = (data as AdminRole[]) ?? AdminDataStore.getRoles();

  const role = roles.find((r) => r.id === id || String(r.id) === String(id)) ?? AdminDataStore.getRoles().find((r) => r.id === id || String(r.id) === String(id));

  const [roleName, setRoleName] = useState("");
  const [roleStatus, setRoleStatus] = useState<"Activated" | "Deactivated">("Activated");
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (role) {
      setRoleName(role.name || (role as any).title || "");
      setRoleStatus(role.status === "Activated" || (role as any).isActive !== false ? "Activated" : "Deactivated");
      setRolePermissions(role.permissions || {});
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Please enter a role title (*)");
      return;
    }

    if (!id) {
      toast.error("Missing role ID");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateAdminRole(id, {
        name: roleName.trim(),
        status: roleStatus,
        permissions: rolePermissions,
      });

      toast.success(`Role "${roleName}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      navigate({ to: "/admin/roles" });
    } catch {
      toast.error("Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 max-w-5xl">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <Link to="/admin/roles" className="text-cyan-600 hover:underline font-semibold">
            Roles Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit Role</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Role</h1>
      </div>

      {/* Main Edit Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Role Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Role <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Role*"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs font-medium"
                autoComplete="off"
                name="edit_role_name_field"
              />
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status</label>
              <Select value={roleStatus} onValueChange={(val: "Activated" | "Deactivated") => setRoleStatus(val)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                  <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permissions Accordion Matrix */}
          <div className="pt-2">
            <PermissionMatrix permissions={rolePermissions} onChange={setRolePermissions} />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/roles" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              <Save className="size-3.5 me-1.5" /> {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
