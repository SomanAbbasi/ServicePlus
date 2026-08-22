import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminUsers, updateAdminUser } from "@/frontend/lib/api-services";
import { AdminUser, AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/users/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditUserPage,
});

function EditUserPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useAdminQuery("users", getAdminUsers);
  const users: AdminUser[] = (data as AdminUser[]) ?? AdminDataStore.getUsers();

  const user = users.find((u) => u.id === id || String(u.id) === String(id)) ?? AdminDataStore.getUsers().find((u) => u.id === id || String(u.id) === String(id));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wallet, setWallet] = useState("0");
  const [role, setRole] = useState("customer");
  const [status, setStatus] = useState<"Activated" | "Deactivated">("Activated");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const u = user as any;
      setName(u.fullName || u.name || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
      setWallet((typeof u.walletBalance === "number" ? u.walletBalance : parseFloat(u.walletBalance) || 0).toString());
      setRole(u.role || "customer");
      setStatus(u.status === "Activated" || u.status === "AVAILABLE" || u.isActive !== false ? "Activated" : "Deactivated");
      setAddress(u.address || "");
      const img = u.avatarUrl || u.avatar || u.photoUrl || "";
      setAvatarUrl(img);
      setAvatarPreview(img || null);
    }
  }, [user]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingAvatar(true);
      const compressed = await compressImageFile(file, { maxDimension: 800, quality: 0.82 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setAvatarUrl(dataUrl);
      setAvatarPreview(dataUrl);
      toast.success(`Avatar compressed (${Math.round(compressed.sizeBytes / 1024)} KB)`);
    } catch {
      toast.error("Failed to compress image");
    } finally {
      setIsCompressingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    if (!id) {
      toast.error("Missing user ID");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateAdminUser(id, {
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        walletBalance: parseFloat(wallet) || 0,
        role: role,
        status: status,
        address: address.trim(),
        avatarUrl: avatarUrl,
      });

      toast.success(`User ${name} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      navigate({ to: "/admin/users" });
    } catch {
      toast.error("Failed to update user");
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
          <Link to="/admin/users" className="text-cyan-600 hover:underline font-semibold">
            Users
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit User</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit User</h1>
      </div>

      {/* Main Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="usr_edit_name_field"
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
                name="usr_edit_email_field"
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
                name="usr_edit_phone_field"
              />
            </div>

            {/* Account Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Account Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer" className="text-xs font-bold">Customer</SelectItem>
                  <SelectItem value="staff" className="text-xs">Staff Member</SelectItem>
                  <SelectItem value="admin" className="text-xs">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Initial Wallet Balance */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Wallet Balance (AED)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Account Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Account Status</Label>
              <Select value={status} onValueChange={(val: "Activated" | "Deactivated") => setStatus(val)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                  <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Address / Location</Label>
              <Input
                placeholder="Enter address (city, area, street)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Upload Image */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Upload Image</Label>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center px-4 h-11 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-700 transition-colors shrink-0">
                  <Upload className="size-3.5 me-2 text-slate-500" />
                  {isCompressingAvatar ? "Compressing..." : "Choose file"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-500 truncate">
                  {avatarPreview ? "Avatar loaded (compressed)" : "No file chosen"}
                </span>
                {avatarPreview && (
                  <div className="relative size-10 rounded-full overflow-hidden border-2 border-cyan-500 shrink-0 ms-auto">
                    <img src={avatarPreview} alt="Preview" className="size-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/users" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isCompressingAvatar}
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
