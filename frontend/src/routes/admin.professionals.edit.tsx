import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminProfessionals, updateProfessional, getAdminCompanies } from "@/frontend/lib/api-services";
import { AdminProfessional, AdminDataStore } from "@/frontend/lib/admin-mock-data";
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

export const Route = createFileRoute("/admin/professionals/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditProfessionalPage,
});

function EditProfessionalPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: prosData } = useAdminQuery("professionals", getAdminProfessionals);
  const professionals: AdminProfessional[] = ((prosData as unknown) as AdminProfessional[]) ?? AdminDataStore.getProfessionals();
  const { data: companiesData } = useAdminQuery("companies", getAdminCompanies);
  const companies = (companiesData as any[]) ?? [];

  const pro = professionals.find((p) => p.id === id || String(p.id) === String(id)) ?? AdminDataStore.getProfessionals().find((p) => p.id === id || String(p.id) === String(id));

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [city, setCity] = useState("Dubai");
  const [status, setStatus] = useState<"Activated" | "Deactivated">("Activated");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pro) {
      const p = pro as any;
      setFullName(p.fullName || p.name || "");
      setEmail(p.email || "");
      setPhone(p.phone || "");
      setCompanyId(p.companyId || (p.company && p.company.id) || (typeof p.company === "string" ? p.company : ""));
      setCity(typeof p.city === "object" && p.city ? p.city.name : (p.city || "Dubai"));
      setStatus(p.status === "Activated" || p.status === "AVAILABLE" || p.isActive !== false ? "Activated" : "Deactivated");
      const img = p.photoUrl || p.photo_url || p.avatar || "";
      setAvatarUrl(img);
      setAvatarPreview(img || null);
    }
  }, [pro]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingAvatar(true);
      const compressed = await compressImageFile(file, { maxDimension: 800, quality: 0.82 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setAvatarUrl(dataUrl);
      setAvatarPreview(dataUrl);
      toast.success(`Photo compressed (${Math.round(compressed.sizeBytes / 1024)} KB)`);
    } catch {
      toast.error("Failed to compress image");
    } finally {
      setIsCompressingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    if (!id) {
      toast.error("Missing professional ID");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedCompany = companies.find((c) => c.id === companyId);
      await updateProfessional({
        id,
        name: fullName.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        companyId: companyId,
        companyName: selectedCompany?.name || (pro as any)?.companyName || "Dabas Beauty Center",
        city: city,
        status: status,
        isActive: status === "Activated",
        photoUrl: avatarUrl,
      });

      toast.success(`Professional ${fullName} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
      navigate({ to: "/admin/professionals" });
    } catch {
      toast.error("Failed to update professional");
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
          <Link to="/admin/professionals" className="text-cyan-600 hover:underline font-semibold">
            Professionals
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit Professional</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Professional</h1>
      </div>

      {/* Main Edit Card */}
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
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="pro_edit_name"
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
                name="pro_edit_email"
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
                name="pro_edit_phone"
              />
            </div>

            {/* Operating City */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Operating City / Emirate</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abu Dhabi" className="text-xs font-bold">Abu Dhabi</SelectItem>
                  <SelectItem value="Dubai" className="text-xs font-bold">Dubai</SelectItem>
                  <SelectItem value="Sharjah" className="text-xs">Sharjah</SelectItem>
                  <SelectItem value="Ajman" className="text-xs">Ajman</SelectItem>
                  <SelectItem value="Ras Al Khaimah" className="text-xs">Ras Al Khaimah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Assignment */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Company Assignment</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue placeholder="Direct Hire / Internal Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct" className="text-xs">Direct Hire / Internal Staff</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Upload Photo */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Profile Photo</Label>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center px-4 h-11 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-700 transition-colors shrink-0">
                  <Upload className="size-3.5 me-2 text-slate-500" />
                  {isCompressingAvatar ? "Compressing..." : "Choose photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-500 truncate">
                  {avatarPreview ? "Photo loaded (compressed)" : "No file chosen"}
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
              onClick={() => navigate({ to: "/admin/professionals" })}
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
