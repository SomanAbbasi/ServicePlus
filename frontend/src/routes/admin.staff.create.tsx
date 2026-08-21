import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminStaff, getAdminRoles } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Eye, EyeOff, Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/staff/create")({ component: AddStaffPage });

function AddStaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: rolesData } = useAdminQuery("roles", getAdminRoles);
  const rolesList = (rolesData as any[]) ?? [];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !roleId) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedRole = rolesList.find((r) => r.id === roleId);
      await createAdminStaff({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        roleId: roleId,
        roleName: selectedRole?.name || "Operations Staff",
        status: "Activated",
      });

      toast.success(`Staff member ${name} added successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      navigate({ to: "/admin/staff" });
    } catch {
      toast.error("Failed to add staff member");
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
          <Link to="/admin/staff" className="text-cyan-600 hover:underline font-semibold">
            Staff Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Add New Staff Member</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add New Staff Member</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter staff full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="staff_name_field"
                data-lpignore="true"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                E-mail <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                inputMode="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="staff_email_field"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="050 XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="staff_phone_field"
                data-lpignore="true"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Role / Designation <span className="text-red-500">*</span>
              </Label>
              <Select value={roleId} onValueChange={setRoleId} required>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue placeholder="Select internal role" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs font-semibold">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter login password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs pe-10"
                  autoComplete="new-password"
                  name="staff_pass_field"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs pe-10"
                  autoComplete="new-password"
                  name="staff_conf_pass_field"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/staff" })}
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
