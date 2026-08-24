import { useState, useEffect } from "react";
import {
  User,
  History,
  LogOut,
  Sun,
  Moon,
  Upload,
  X,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  Layers,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Badge } from "@/frontend/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { MAJOR_PERMISSION_MODULES } from "@/frontend/components/admin/PermissionMatrix";
import { compressImageFile } from "@/frontend/lib/image-compression";
import { toast } from "sonner";

interface AdminProfileMenuProps {
  onLogout: () => void;
}

export function AdminProfileMenu({ onLogout }: AdminProfileMenuProps) {
  const [userName, setUserName] = useState("AHSAN KAREEM KAREEM");
  const [userRole, setUserRole] = useState("Admin");
  const [userEmail, setUserEmail] = useState("admin@serviceplus.ae");
  const [userPhone, setUserPhone] = useState("+971 50 123 4567");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [permissionsRaw, setPermissionsRaw] = useState<string>("*");

  // Modals state
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Theme Toggle State
  const [isDark, setIsDark] = useState(false);

  const loadUserData = () => {
    if (typeof window === "undefined") return;
    const storedName = localStorage.getItem("serviceplus_admin_user_name") || "AHSAN KAREEM KAREEM";
    const storedRole = localStorage.getItem("serviceplus_admin_user_role") || "Admin";
    const storedEmail = localStorage.getItem("serviceplus_admin_user_email") || "admin@serviceplus.ae";
    const storedPhone = localStorage.getItem("serviceplus_admin_user_phone") || "+971 50 123 4567";
    const storedAvatar = localStorage.getItem("serviceplus_admin_user_avatar") || null;
    const storedPerms = localStorage.getItem("serviceplus_admin_user_permissions") || "*";

    setUserName(storedName);
    setUserRole(storedRole);
    setUserEmail(storedEmail);
    setUserPhone(storedPhone);
    setUserAvatar(storedAvatar);
    setPermissionsRaw(storedPerms);
  };

  useEffect(() => {
    loadUserData();
    const handleProfileUpdate = () => loadUserData();
    window.addEventListener("admin_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("admin_profile_updated", handleProfileUpdate);
  }, []);

  const openProfileModal = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setEditPhone(userPhone);
    setEditAvatar(userAvatar);
    setActiveTab("profile");
    setProfileOpen(true);
  };

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordOpen(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, { maxDimension: 400, quality: 0.85 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setEditAvatar(dataUrl);
      toast.success("Profile image selected");
    } catch {
      toast.error("Failed to process image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveAvatar = () => {
    setEditAvatar(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Save to localStorage
    localStorage.setItem("serviceplus_admin_user_name", editName.trim());
    localStorage.setItem("serviceplus_admin_user_email", editEmail.trim());
    localStorage.setItem("serviceplus_admin_user_phone", editPhone.trim());
    if (editAvatar) {
      localStorage.setItem("serviceplus_admin_user_avatar", editAvatar);
    } else {
      localStorage.removeItem("serviceplus_admin_user_avatar");
    }

    // Also update in AdminDataStore if matched staff or user
    try {
      const staffList = AdminDataStore.getStaff();
      const matchedStaff = staffList.find((s) => s.email.toLowerCase() === userEmail.toLowerCase());
      if (matchedStaff) {
        AdminDataStore.updateStaff(matchedStaff.id, {
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          avatarUrl: editAvatar || undefined,
        });
      }
    } catch {
      // ignore
    }

    loadUserData();
    window.dispatchEvent(new Event("admin_profile_updated"));
    setProfileOpen(false);
    toast.success("Profile details updated successfully!");
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem("serviceplus_admin_password") || "Test@1234";

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (currentPassword !== storedPass && currentPassword !== "Test@1234") {
      toast.error("Current password is incorrect");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      localStorage.setItem("serviceplus_admin_password", newPassword);
      setIsUpdatingPassword(false);
      setPasswordOpen(false);
      toast.success("Password changed successfully!");
    }, 400);
  };

  // Parse permissions
  const parsedPermissions = (() => {
    if (permissionsRaw === "*") return null;
    try {
      return JSON.parse(permissionsRaw);
    } catch {
      return null;
    }
  })();

  const isMasterAdmin = permissionsRaw === "*" || userRole.toLowerCase().includes("admin");

  const initialLetter = (userName || "A").trim().charAt(0).toUpperCase();

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Theme Toggle Sun/Moon */}
        <button
          type="button"
          onClick={() => {
            setIsDark(!isDark);
            toast.info(isDark ? "Light mode active" : "Dark mode toggled");
          }}
          className="grid size-9 place-items-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {isDark ? <Moon className="size-4 text-slate-700" /> : <Sun className="size-4.5 text-slate-600" />}
        </button>

        {/* User Avatar Dropdown (Matching Reference Screenshot) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-full transition-transform active:scale-95"
              aria-label="User account menu"
            >
              {userAvatar ? (
                <div className="size-9 rounded-full overflow-hidden border border-purple-200 shadow-xs">
                  <img src={userAvatar} alt={userName} className="size-full object-cover" />
                </div>
              ) : (
                <div className="size-9 rounded-full bg-[#8A3FFC] hover:bg-[#7b2cbf] text-white font-extrabold text-sm flex items-center justify-center shadow-xs transition-colors">
                  {initialLetter}
                </div>
              )}
              {/* Online Green Indicator Dot */}
              <span className="absolute bottom-0 end-0 size-2.5 rounded-full bg-[#24A148] ring-2 ring-white" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10 animate-in fade-in-50 zoom-in-95 duration-150"
          >
            {/* Header: User Avatar, Name & Role (Matching Image 3) */}
            <div className="flex items-center gap-3 p-3 border-b border-slate-100/90 mb-1">
              <div className="relative shrink-0">
                {userAvatar ? (
                  <div className="size-11 rounded-full overflow-hidden border border-purple-200">
                    <img src={userAvatar} alt={userName} className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="size-11 rounded-full bg-[#8A3FFC] text-white font-black text-base flex items-center justify-center shadow-xs">
                    {initialLetter}
                  </div>
                )}
                <span className="absolute bottom-0 end-0 size-2.5 rounded-full bg-[#24A148] ring-2 ring-white" />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-tight truncate">
                  {userName}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 capitalize truncate">
                  {userRole}
                </p>
              </div>
            </div>

            {/* Menu Items matching image */}
            <div className="space-y-0.5 py-1">
              <DropdownMenuItem
                onClick={openProfileModal}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <User className="size-4 text-slate-600" />
                <span>My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={openPasswordModal}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <History className="size-4 text-slate-600" />
                <span>Change Password</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-slate-100" />

              <DropdownMenuItem
                onClick={onLogout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
              >
                <LogOut className="size-4 text-rose-500" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* MY PROFILE MODAL WITH ROLE RIGHTS VIEW */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl w-full p-0 bg-white rounded-3xl overflow-hidden shadow-2xl border-slate-200 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <User className="size-5 text-purple-600" />
                  My Admin Profile & Permissions
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your personal details, profile picture, and view your role access rights.
                </p>
              </div>
              <Badge className="bg-purple-100 text-purple-900 border-purple-200 font-extrabold text-xs px-3 py-1">
                {userRole}
              </Badge>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b border-slate-100 bg-slate-50/50">
              <TabsList className="bg-transparent p-0 gap-4">
                <TabsTrigger
                  value="profile"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-700 text-xs font-bold py-3 px-1"
                >
                  <User className="size-3.5 me-1.5" /> Personal Information
                </TabsTrigger>
                <TabsTrigger
                  value="roles"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-700 text-xs font-bold py-3 px-1"
                >
                  <ShieldCheck className="size-3.5 me-1.5" /> Roles & Rights Access
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Profile Details & Picture */}
            <TabsContent value="profile" className="p-6 overflow-y-auto flex-1 m-0 space-y-6">
              <form id="admin-profile-form" onSubmit={handleSaveProfile} className="space-y-6">
                {/* Profile Picture Upload Box */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50">
                  <div className="relative group">
                    {editAvatar ? (
                      <div className="size-20 rounded-full overflow-hidden border-2 border-purple-400 shadow-md">
                        <img src={editAvatar} alt="Profile" className="size-full object-cover" />
                      </div>
                    ) : (
                      <div className="size-20 rounded-full bg-[#8A3FFC] text-white font-black text-2xl flex items-center justify-center shadow-md">
                        {initialLetter}
                      </div>
                    )}
                    <label
                      htmlFor="profile-pic-upload"
                      className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                    >
                      <Camera className="size-6" />
                    </label>
                    <input
                      id="profile-pic-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <h4 className="text-xs font-bold text-slate-800">Profile Picture</h4>
                    <p className="text-[11px] text-slate-500">
                      Upload a square JPG, PNG, or WebP photo (Max 2MB).
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <label
                        htmlFor="profile-pic-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                      >
                        <Upload className="size-3.5" />
                        {isCompressing ? "Processing..." : "Upload New Photo"}
                      </label>

                      {editAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                        >
                          <X className="size-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Ahsan Kareem"
                      className="h-11 rounded-xl text-xs bg-white border-slate-200 font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="name@serviceplus.ae"
                      className="h-11 rounded-xl text-xs bg-white border-slate-200 font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="h-11 rounded-xl text-xs bg-white border-slate-200 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700">Assigned Role</Label>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/80">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-purple-600" />
                        <span className="text-xs font-extrabold text-slate-900">{userRole}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Configured in Roles Access
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* TAB 2: Roles Access & Rights View */}
            <TabsContent value="roles" className="p-6 overflow-y-auto flex-1 m-0 space-y-4">
              {isMasterAdmin ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900">
                        Full System Administrator Rights (Super Admin)
                      </h4>
                      <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                        Your account has unrestricted super-administrator rights. You can view, create, edit, delete, export reports, and approve workflows across all ServicePlus modules.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MAJOR_PERMISSION_MODULES.map((mod) => (
                      <div
                        key={mod.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layers className="size-4 text-purple-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">{mod.name}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 shrink-0">
                          Full Access
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-purple-900">
                        Role Rights for: {userRole}
                      </h4>
                      <p className="text-[11px] text-purple-700">
                        Defined and managed under Staff Management &gt; Roles
                      </p>
                    </div>
                    <Badge className="bg-purple-600 text-white font-extrabold text-xs">
                      {userRole}
                    </Badge>
                  </div>

                  {/* Modules Permissions Matrix */}
                  <div className="space-y-3">
                    {MAJOR_PERMISSION_MODULES.map((mod) => {
                      const modPerms = parsedPermissions?.[mod.id] || {};
                      const hasAny = Object.values(modPerms).some(Boolean);

                      return (
                        <div
                          key={mod.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            hasAny
                              ? "bg-white border-slate-200 shadow-2xs"
                              : "bg-slate-50/70 border-slate-200/60 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                              <Layers className="size-3.5 text-purple-600" />
                              {mod.name}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                hasAny
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {hasAny ? "Active" : "No Access"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {mod.subPermissions.map((sub) => {
                              const isGranted = Boolean(modPerms[sub.key]);
                              return (
                                <span
                                  key={sub.key}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                                    isGranted
                                      ? "bg-purple-50 text-purple-800 border border-purple-200"
                                      : "bg-slate-100 text-slate-400 line-through"
                                  }`}
                                >
                                  {isGranted ? "✓" : "✕"} {sub.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Modal Bottom Actions */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileOpen(false)}
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </Button>

              {activeTab === "profile" && (
                <Button
                  type="submit"
                  form="admin-profile-form"
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 shadow-xs"
                >
                  Save Changes
                </Button>
              )}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* CHANGE PASSWORD MODAL */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-md w-full p-6 bg-white rounded-3xl overflow-hidden shadow-2xl border-slate-200">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <KeyRound className="size-5 text-purple-600" />
              Change Admin Password
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your console login credentials.
            </p>
          </DialogHeader>

          <form onSubmit={handleSavePassword} className="space-y-4 pt-2">
            {/* Current Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="h-11 rounded-xl text-xs bg-white border-slate-200 font-medium pe-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-11 rounded-xl text-xs bg-white border-slate-200 font-medium pe-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="h-11 rounded-xl text-xs bg-white border-slate-200 font-medium pe-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPassword}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 shadow-xs"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
