import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminUser } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Eye, EyeOff, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/users/create")({ component: AddUserPage });

function AddUserPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [wallet, setWallet] = useState("0");
  const [role, setRole] = useState("customer");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAdminUser({
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        walletBalance: parseFloat(wallet) || 0,
        status: "Activated",
        role: role,
        avatarUrl: avatarUrl,
      });

      toast.success(`User ${name} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      navigate({ to: "/admin/users" });
    } catch {
      toast.error("Failed to create user");
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
          <span className="text-slate-600">Add New User</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add New User</h1>
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
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="usr_name_field"
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
                name="usr_email_field"
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
                name="usr_phone_field"
                data-lpignore="true"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter login password (min. 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs pe-10"
                  autoComplete="new-password"
                  name="usr_pass_field"
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
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs pe-10"
                  autoComplete="new-password"
                  name="usr_conf_pass_field"
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

            {/* Role */}
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
              <Label className="text-xs font-bold text-slate-700">Initial Wallet Balance (AED)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Upload Image */}
            <div className="space-y-1.5">
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
                  {avatarPreview ? "1 image selected (compressed)" : "No file chosen"}
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
