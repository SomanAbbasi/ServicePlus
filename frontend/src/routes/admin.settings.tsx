import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminSettings, updateSetting } from "@/frontend/lib/api-services";
import {
  PageHeader,
  SectionCard,
} from "@/frontend/components/admin/shell";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Lock, Mail, Clock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

export function AdminSettings() {
  const qc = useQueryClient();
  
  // Local Settings States
  const [adminEmail, setAdminEmail] = useState(() => {
    return localStorage.getItem("serviceplus_admin_email") || "somanabbasi305@gmail.com";
  });
  
  const [operatingHours, setOperatingHours] = useState(() => {
    const saved = localStorage.getItem("serviceplus_operating_hours");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return { start: "08:00", end: "20:00", timezone: "Asia/Dubai" };
  });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("serviceplus_admin_email", adminEmail.trim());
    toast.success("Admin Email updated successfully!");
  };

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("serviceplus_operating_hours", JSON.stringify(operatingHours));
    toast.success("Operating Hours updated successfully!");
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPass = localStorage.getItem("serviceplus_admin_password") || "Test@1234";
    if (oldPassword !== currentPass) {
      toast.error("Current password does not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    localStorage.setItem("serviceplus_admin_password", newPassword);
    toast.success("Admin Password reset successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Settings & Configuration"
        description="Manage operating hours, notification email, and security settings"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Operating Hours Settings */}
        <SectionCard title="Operating Hours & Timezone">
          <form onSubmit={handleSaveHours} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="size-3.5 text-cyan-600" /> Timezone
              </Label>
              <Input
                value={operatingHours.timezone}
                onChange={(e) => setOperatingHours({ ...operatingHours, timezone: e.target.value })}
                placeholder="Asia/Dubai"
                className="text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Start Time</Label>
                <Input
                  type="time"
                  value={operatingHours.start}
                  onChange={(e) => setOperatingHours({ ...operatingHours, start: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">End Time</Label>
                <Input
                  type="time"
                  value={operatingHours.end}
                  onChange={(e) => setOperatingHours({ ...operatingHours, end: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="bg-cyan-600 text-white hover:bg-cyan-700 font-semibold">
              Save Operating Hours
            </Button>
          </form>
        </SectionCard>

        {/* Notification Email Settings */}
        <SectionCard title="Admin Order Notification Email">
          <form onSubmit={handleSaveEmail} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="size-3.5 text-cyan-600" /> Recipient Email Address
              </Label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="somanabbasi305@gmail.com"
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                All new booking alerts and order notifications will be delivered to this email.
              </p>
            </div>

            <Button type="submit" size="sm" className="bg-cyan-600 text-white hover:bg-cyan-700 font-semibold">
              Update Email Address
            </Button>
          </form>
        </SectionCard>

        {/* Reset Password Card */}
        <SectionCard title="Reset Admin Password">
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Lock className="size-3.5 text-cyan-600" /> Current Password
              </Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="text-xs"
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="bg-slate-900 text-white hover:bg-slate-800 font-semibold">
              Reset Admin Password
            </Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
