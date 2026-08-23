import React, { useState } from "react";
import { AdminUser } from "@/frontend/lib/admin-mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/frontend/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Lock, Send, Key, Edit, Trash2, ShieldAlert, CheckCircle2, UserCheck, Eye, EyeOff, Wallet, MapPin, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface UserActionModalsProps {
  user: AdminUser | null;
  activeAction: "edit" | "info" | "password" | "delete" | "send_credentials" | "toggle_status" | null;
  onClose: () => void;
  onSaveEdit: (userId: string, updated: Partial<AdminUser>) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string) => void;
}

export function UserActionModals({
  user,
  activeAction,
  onClose,
  onSaveEdit,
  onDelete,
  onToggleStatus,
}: UserActionModalsProps) {
  // Edit User State
  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [wallet, setWallet] = useState((typeof user?.walletBalance === "number" ? user.walletBalance : 0).toString());
  const [status, setStatus] = useState<"Activated" | "Deactivated">(user?.status || "Activated");
  const [address, setAddress] = useState(user?.address || "");

  // Change Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Send Credentials State
  const [sendMethod, setSendMethod] = useState<"both" | "email" | "sms">("both");

  React.useEffect(() => {
    if (user) {
      setName(user.fullName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setWallet((typeof user.walletBalance === "number" ? user.walletBalance : 0).toString());
      setStatus(user.status || "Activated");
      setAddress(user.address || "");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [user]);

  if (!user) return null;

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && !email && !phone) {
      toast.error("Please fill in contact details.");
      return;
    }
    onSaveEdit(user.id, {
      fullName: name,
      email,
      phone,
      walletBalance: parseFloat(wallet) || 0,
      status,
      address,
    });
    toast.success(`User ${name || user.fullName || "profile"} updated successfully!`);
    onClose();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    toast.success(`Password for ${user.fullName || user.phone || "User"} updated securely!`);
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const handleSendCredentialsSubmit = () => {
    toast.success(`Credentials dispatched!`, {
      description: `Login details sent to ${user.email || "registered email"} & ${user.phone || "registered mobile"}.`,
      duration: 5000,
    });
    onClose();
  };

  const handleConfirmDelete = () => {
    onDelete(user.id);
    toast.success(`User ${user.fullName || user.phone || "User"} has been deleted.`);
    onClose();
  };

  const handleConfirmToggleStatus = () => {
    onToggleStatus(user.id);
    const newStatus = user.status === "Activated" ? "Deactivated" : "Activated";
    if (newStatus === "Deactivated") {
      toast.warning(`User ${user.fullName || "User"} is now Deactivated.`, {
        description: "Web and App login access has been immediately revoked.",
      });
    } else {
      toast.success(`User ${user.fullName || "User"} has been Activated.`);
    }
    onClose();
  };

  const displayName = user.fullName || user.phone || user.email || "User";

  return (
    <>
      {/* 1. EDIT USER MODAL */}
      <Dialog open={activeAction === "edit"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Edit className="size-4 text-cyan-600" /> Edit User Profile
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update personal details, contact information, and wallet balance for <span className="font-semibold text-slate-800">{displayName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} autoComplete="off" className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Full Name *</Label>
              <Input
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="off"
                name="edit_usr_name"
                data-lpignore="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">E-mail *</Label>
                <Input
                  type="text"
                  inputMode="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  name="edit_usr_email"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Phone Number *</Label>
                <Input
                  placeholder="050 XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="off"
                  name="edit_usr_phone"
                  data-lpignore="true"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Wallet Balance (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Account Status</Label>
                <Select value={status} onValueChange={(val: "Activated" | "Deactivated") => setStatus(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                    <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Address / Location</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address (city, area, street)"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. CHANGE PASSWORD MODAL */}
      <Dialog open={activeAction === "password"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Key className="size-4 text-cyan-600" /> Reset User Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Set a new secure password for <span className="font-bold text-slate-800">{user.fullName || user.phone || "User"}</span> ({user.email || "No email"}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} autoComplete="off" className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">New Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="pe-9"
                  autoComplete="new-password"
                  name="reset_usr_pass"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Confirm New Password *</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="pe-9"
                  autoComplete="new-password"
                  name="reset_usr_conf_pass"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold">
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. SEND CREDENTIALS MODAL */}
      <Dialog open={activeAction === "send_credentials"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Send className="size-4 text-cyan-600" /> Send Login Credentials
            </DialogTitle>
            <DialogDescription className="text-xs">
              Dispatch access credentials and login link to <span className="font-bold text-slate-800">{displayName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <p><span className="text-slate-500 font-semibold">Recipient:</span> <span className="font-bold text-slate-800">{displayName}</span></p>
              <p><span className="text-slate-500 font-semibold">E-mail:</span> <span className="font-mono text-cyan-700">{user.email || "—"}</span></p>
              <p><span className="text-slate-500 font-semibold">Phone:</span> <span className="font-mono text-slate-700">{user.phone || "—"}</span></p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Dispatch Channel</Label>
              <Select value={sendMethod} onValueChange={(v: "both" | "email" | "sms") => setSendMethod(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both" className="text-xs">Email & SMS Notification (Recommended)</SelectItem>
                  <SelectItem value="email" className="text-xs">Email Only</SelectItem>
                  <SelectItem value="sms" className="text-xs">SMS Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendCredentialsSubmit}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              <Send className="size-3.5 me-1.5" /> Send Credentials Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. DELETE CONFIRMATION DIALOG */}
      <Dialog open={activeAction === "delete"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600">
              <Trash2 className="size-4 text-rose-600" /> Delete User Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <span className="font-bold text-slate-900">{displayName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            <p>Warning: All active sessions, booking histories, and wallet credits will be archived.</p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. TOGGLE ACTIVE/DEACTIVATE MODAL */}
      <Dialog open={activeAction === "toggle_status"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              {user.status === "Activated" ? (
                <>
                  <ShieldAlert className="size-4 text-rose-600" /> Deactivate User Account
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-emerald-600" /> Activate User Account
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {user.status === "Activated"
                ? `Deactivating ${displayName} will immediately block their login and web app access.`
                : `Activating ${displayName} will restore full booking, wallet, and web access.`}
            </DialogDescription>
          </DialogHeader>

          <div
            className={`p-3 rounded-xl border text-xs font-semibold ${
              user.status === "Activated"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {user.status === "Activated"
              ? "If the user attempts to sign in, they will receive a 'Account Deactivated' notification."
              : "User will be able to log in using their credentials immediately."}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmToggleStatus}
              size="sm"
              className={`font-bold text-white ${
                user.status === "Activated" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {user.status === "Activated" ? "Deactivate Account" : "Activate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. USER INFORMATION DRAWER */}
      <Sheet open={activeAction === "info"} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md p-6">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-800 font-extrabold text-lg">
                {((user.fullName || user.email || user.phone || "U").charAt(0) || "U").toUpperCase()}
              </div>
              <div>
                <SheetTitle className="text-base font-extrabold text-slate-900">{displayName}</SheetTitle>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    user.status === "Activated" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {user.status || "Activated"}
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-5 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">E-mail:</span>
                <span className="font-bold text-slate-800">{user.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Phone:</span>
                <span className="font-bold text-slate-800">{user.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Wallet Balance:</span>
                <span className="font-bold text-emerald-600">AED {(typeof user.walletBalance === "number" ? user.walletBalance : 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Registered:</span>
                <span className="font-medium text-slate-700">{user.registeredOn || "—"}</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-2 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-cyan-600" /> Default Address
              </h5>
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <p className="text-slate-700 font-medium">{user.address || "Saadiyat Beach Residences, Abu Dhabi, UAE"}</p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-2 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-cyan-600" /> Recent Bookings
              </h5>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 text-center text-slate-400 font-medium">
                No recent bookings on record for this user.
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
