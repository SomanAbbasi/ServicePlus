import React, { useState, useEffect } from "react";
import { AdminProfessional } from "@/frontend/lib/admin-mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/frontend/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/frontend/components/ui/sheet";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import {
  Lock,
  Send,
  Sliders,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  Sparkles,
  FileText,
  Star,
} from "lucide-react";
import { toast } from "sonner";

interface ProfessionalActionModalProps {
  professional: AdminProfessional | null;
  activeAction: "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status" | null;
  companies: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaveEdit: (proId: string, updated: Partial<AdminProfessional>) => void;
  onDelete: (proId: string) => void;
  onToggleStatus: (proId: string) => void;
}

export function ProfessionalActionModal({
  professional,
  activeAction,
  companies,
  onClose,
  onSaveEdit,
  onDelete,
  onToggleStatus,
}: ProfessionalActionModalProps) {
  if (!professional) return null;

  // Edit State
  const [name, setName] = useState(professional.name || (professional as any).fullName || "");
  const [email, setEmail] = useState(professional.email || "");
  const [phone, setPhone] = useState(professional.phone || "");
  const [companyId, setCompanyId] = useState(professional.companyId || "");
  const [city, setCity] = useState(
    typeof professional.city === "object" && professional.city !== null
      ? (professional.city as any).name
      : (professional.city || "Abu Dhabi")
  );
  const [status, setStatus] = useState<"Activated" | "Deactivated">(
    professional.status === "Activated" ? "Activated" : "Deactivated"
  );
  const [isPreferred, setIsPreferred] = useState(Boolean(professional.isPreferred));

  // Change Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Send Credentials State
  const [sendMethod, setSendMethod] = useState<"both" | "email" | "sms">("both");

  useEffect(() => {
    if (professional) {
      setName(professional.name || (professional as any).fullName || "");
      setEmail(professional.email || "");
      setPhone(professional.phone || "");
      setCompanyId(professional.companyId || "");
      setCity(
        typeof professional.city === "object" && professional.city !== null
          ? (professional.city as any).name
          : (professional.city || "Abu Dhabi")
      );
      setStatus(professional.status === "Activated" ? "Activated" : "Deactivated");
      setIsPreferred(Boolean(professional.isPreferred));
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [professional]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }
    const matchedCompany = companies.find((c) => c.id === companyId);
    onSaveEdit(professional.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      companyId: companyId,
      companyName: matchedCompany?.name || professional.companyName || "ServicePlus Network",
      city: city,
      status: status,
      isPreferred: isPreferred,
    });
    toast.success("Professional profile updated successfully!");
    onClose();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    toast.success(`Password reset for ${name || "Professional"}.`);
    onClose();
  };

  const handleSendCredentialsSubmit = () => {
    toast.success(
      `Login credentials sent to ${email || phone} via ${sendMethod.toUpperCase()}.`
    );
    onClose();
  };

  const isActivated = status === "Activated" || professional.status === "Activated";

  return (
    <>
      {/* 1. EDIT PROFESSIONAL MODAL */}
      <Dialog open={activeAction === "edit"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] bg-white text-slate-800 rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Sliders className="size-5 text-cyan-600" />
              Edit Professional Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update cleaning specialist personal and dispatch details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9 text-xs bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700">E-mail *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-9 text-xs bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-9 text-xs bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Status</Label>
                <Select value={status} onValueChange={(val: "Activated" | "Deactivated") => setStatus(val)}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activated" className="text-xs text-emerald-700 font-semibold">
                      Activated
                    </SelectItem>
                    <SelectItem value="Deactivated" className="text-xs text-rose-700 font-semibold">
                      Deactivated
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Company</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                    {companies.length === 0 && (
                      <SelectItem value="default" className="text-xs">
                        ServicePlus Network
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Abu Dhabi" className="text-xs">Abu Dhabi</SelectItem>
                    <SelectItem value="Dubai" className="text-xs">Dubai</SelectItem>
                    <SelectItem value="Sharjah" className="text-xs">Sharjah</SelectItem>
                    <SelectItem value="Ajman" className="text-xs">Ajman</SelectItem>
                    <SelectItem value="Ras Al Khaimah" className="text-xs">Ras Al Khaimah</SelectItem>
                    <SelectItem value="Umm Al Quwain" className="text-xs">Umm Al Quwain</SelectItem>
                    <SelectItem value="Fujairah" className="text-xs">Fujairah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs h-9 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-9 font-bold px-4"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. INFO & HISTORY DETAILS DRAWER */}
      <Sheet open={activeAction === "info"} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white p-6 overflow-y-auto">
          <SheetHeader className="border-b border-slate-100 pb-4">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Eye className="size-5 text-cyan-600" /> Professional Details
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pt-5">
            {/* Header Badge Card */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="grid size-12 place-items-center rounded-full bg-cyan-100 text-cyan-800 font-bold text-lg shrink-0">
                {(name.charAt(0) || "P").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 truncate text-base">{name || "Professional"}</h4>
                  {professional.isPreferred && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                      ★ Preferred
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isActivated
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isActivated ? "Activated" : "Deactivated"}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span>{professional.rating || "5.0"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact & Company */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Dispatch</h5>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <Mail className="size-4 text-slate-400 shrink-0" />
                  <span className="text-slate-800 font-medium truncate">{email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <Phone className="size-4 text-slate-400 shrink-0" />
                  <span className="text-slate-800 font-medium">{phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <Building2 className="size-4 text-slate-400 shrink-0" />
                  <span className="text-slate-800 font-medium">
                    {professional.companyName || "ServicePlus Network"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <MapPin className="size-4 text-slate-400 shrink-0" />
                  <span className="text-slate-800 font-medium">{city}</span>
                </div>
              </div>
            </div>

            {/* Allocated Materials */}
            {((professional as any).allocatedMaterials || professional.materials) && (((professional as any).allocatedMaterials || professional.materials).length > 0) && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-cyan-600" /> Allocated Materials & Kit
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {((professional as any).allocatedMaterials || professional.materials).map((mat: any, idx: number) => {
                    const matName = typeof mat === "object" && mat !== null ? mat.name || mat.title : String(mat);
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-medium"
                      >
                        ✓ {matName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Registration Timestamp */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-400" /> Registered On:
              </span>
              <span className="font-semibold text-slate-800">
                {professional.registeredOn || (professional as any).createdAt?.slice(0, 10) || "Recent"}
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 3. RESET PASSWORD MODAL */}
      <Dialog open={activeAction === "password"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[420px] bg-white text-slate-800 rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Lock className="size-5 text-teal-600" />
              Reset Professional Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter a new secure password for <strong className="text-slate-800">{name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="h-9 text-xs pe-9 bg-slate-50 border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="h-9 text-xs pe-9 bg-slate-50 border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs h-9 font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 font-bold px-4">
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. DELETE CONFIRMATION MODAL */}
      <Dialog open={activeAction === "delete"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[420px] bg-white text-slate-800 rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-rose-600">
              <ShieldAlert className="size-5" />
              Delete Cleaning Professional
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-2 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{name}</strong> ({email || phone}) from the active roster? This will unassign any pending bookings.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs h-9 font-semibold">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onDelete(professional.id);
                onClose();
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 font-bold px-4"
            >
              <Trash2 className="size-3.5 me-1" /> Delete Professional
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. SEND CREDENTIALS MODAL */}
      <Dialog open={activeAction === "send_credentials"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[420px] bg-white text-slate-800 rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Send className="size-5 text-cyan-600" />
              Send Login Credentials
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Dispatch access credentials and onboarding instructions to <strong className="text-slate-800">{name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Dispatch Channel</Label>
              <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSendMethod("both")}
                  className={`p-2.5 rounded-lg border text-center transition-colors ${
                    sendMethod === "both"
                      ? "border-cyan-600 bg-cyan-50 text-cyan-900 font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Both
                </button>
                <button
                  type="button"
                  onClick={() => setSendMethod("email")}
                  className={`p-2.5 rounded-lg border text-center transition-colors ${
                    sendMethod === "email"
                      ? "border-cyan-600 bg-cyan-50 text-cyan-900 font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  E-mail
                </button>
                <button
                  type="button"
                  onClick={() => setSendMethod("sms")}
                  className={`p-2.5 rounded-lg border text-center transition-colors ${
                    sendMethod === "sms"
                      ? "border-cyan-600 bg-cyan-50 text-cyan-900 font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  SMS
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 space-y-1">
              <div><strong>Recipient E-mail:</strong> {email || "None"}</div>
              <div><strong>Recipient Phone:</strong> {phone || "None"}</div>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs h-9 font-semibold">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendCredentialsSubmit}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-9 font-bold px-4"
            >
              <Send className="size-3.5 me-1" /> Send Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
