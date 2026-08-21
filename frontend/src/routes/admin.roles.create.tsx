import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminRole } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { PermissionMatrix } from "@/frontend/components/admin/PermissionMatrix";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/roles/create")({ component: AddRolePage });

function AddRolePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [roleName, setRoleName] = useState("");
  // By default all permissions are unselected
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Please enter a role designation name (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAdminRole({
        name: roleName.trim(),
        status: "Activated",
        permissions: rolePermissions,
      });

      toast.success(`Role ${roleName} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      navigate({ to: "/admin/roles" });
    } catch {
      toast.error("Failed to create role");
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
          <span className="text-slate-600">Add Role</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add Role</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          {/* Role Name Input */}
          <div className="space-y-1.5">
            <Input
              placeholder="Role*"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              className="h-11 bg-white border-slate-200 rounded-lg text-xs font-medium"
              autoComplete="off"
              name="role_name_field"
              data-lpignore="true"
            />
          </div>

          {/* Granular Permission Matrix (Accordion style, default unselected) */}
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
