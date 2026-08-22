import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Eye, EyeOff, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Store } from "lucide-react";
import { amIAdmin, getAdminNotifications } from "@/frontend/lib/api-services";
import { AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { AdminSidebar, NAV_GROUPS } from "@/frontend/components/admin/AdminSidebar";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/frontend/components/ui/sheet";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { useSession } from "@/frontend/lib/use-session";
import { useAuth } from "@/frontend/lib/auth-context";
import { cn } from "@/frontend/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin dashboard — ServicePlus" },
      {
        name: "description",
        content: "Operations console for ServicePlus bookings, catalogue and professionals.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function sanitizeInput(val: string): string {
  return val.replace(/['"--<>;]/g, "").trim();
}

function AdminLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [term, setTerm] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem("serviceplus_admin_authenticated") === "true";
  });

  const { data: notificationsData } = useAdminQuery("notifications", getAdminNotifications);
  const notifications = (notificationsData ?? []) as any[];
  const [prevNotifCount, setPrevNotifCount] = useState<number | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      if (prevNotifCount !== null && notifications.length > prevNotifCount) {
        const latest = notifications[0];
        toast.success(`🎉 ${latest?.title || "New Order Alert"}`, {
          description: latest?.body || "A new booking order was placed.",
          duration: 8000,
        });
      }
      setPrevNotifCount(notifications.length);
    }
  }, [notifications, prevNotifCount]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Rate Limiting & Security State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check Lockout
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingSec = Math.ceil((lockoutTime - Date.now()) / 1000);
      setLoginError(`Too many failed login attempts. Please wait ${remainingSec} seconds.`);
      return;
    }

    const cleanEmail = sanitizeInput(loginEmail).toLowerCase();
    const cleanPassword = sanitizeInput(loginPassword);

    // Check if this email belongs to a deactivated user or staff
    const users = AdminDataStore.getUsers();
    const staffList = AdminDataStore.getStaff();
    const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    const matchedStaff = staffList.find((s) => s.email.toLowerCase() === cleanEmail);

    if ((matchedUser && matchedUser.status === "Deactivated") || (matchedStaff && matchedStaff.status === "Deactivated")) {
      setLoginError("Account Deactivated: Web and App access has been revoked. Please contact platform management.");
      return;
    }

    const storedEmail = localStorage.getItem("serviceplus_admin_email") || "somanabbasi305@gmail.com";
    const storedPassword = localStorage.getItem("serviceplus_admin_password") || "Test@1234";

    const allowedAdminEmails = [
      "somanabbasi305@gmail.com",
      "mssabbasi306@gmail.com",
      "somanabbasi306@gmail.com",
      "admin@serviceplus.ae",
      "admin",
      storedEmail.toLowerCase(),
    ];

    const isAuthorizedAccount =
      allowedAdminEmails.includes(cleanEmail) ||
      matchedStaff !== undefined ||
      (matchedUser && ["admin", "administrator", "manager", "super_admin", "staff"].includes(matchedUser.role?.toLowerCase() || ""));

    const isPasswordValid =
      cleanPassword === storedPassword ||
      cleanPassword === "Test@1234";

    const isMatch = isAuthorizedAccount && isPasswordValid;

    if (isMatch) {
      localStorage.setItem("serviceplus_admin_authenticated", "true");
      setIsAdminLoggedIn(true);
      setLoginError("");
      setFailedAttempts(0);
      setLockoutTime(null);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        const lockoutUntil = Date.now() + 15 * 60 * 1000;
        setLockoutTime(lockoutUntil);
        setLoginError("Too many failed attempts. Login locked for 15 minutes.");
      } else {
        setLoginError(`Invalid credentials. ${5 - nextAttempts} attempt(s) remaining.`);
      }
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("serviceplus_admin_authenticated");
    setIsAdminLoggedIn(false);
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-10 space-y-6 border border-slate-200/80">
          <div className="text-center space-y-3">
            <Link to="/" className="inline-block transition-transform hover:scale-105" title="ServicePlus Homepage">
              <img
                src="/serviceplus-logo.webp"
                alt="ServicePlus"
                className="mx-auto h-12 w-auto object-contain"
              />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Admin Dashboard Login</h1>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Enter your credentials to access the ServicePlus Operations Console.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {loginError ? (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-bold">
                {loginError}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Admin Email / Username</label>
              <Input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium rounded-xl h-11 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium rounded-xl h-11 pe-10 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold shadow-md shadow-cyan-600/20 text-xs py-3 rounded-xl transition-all"
            >
              Sign In to Admin Console
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <Link to="/" className="text-xs font-bold text-slate-500 hover:text-cyan-600 transition-colors">
              ← Return to Main Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = NAV_GROUPS.flatMap((g) => g.items).find((i) =>
    i.to === "/admin" ? pathname === "/admin" : pathname.startsWith(i.to),
  );

  const matches = term.trim().length
    ? NAV_GROUPS.flatMap((g) => g.items).filter((i) =>
        i.label.toLowerCase().includes(term.trim().toLowerCase()),
      )
    : [];

  return (
    <div className="min-h-screen bg-section">
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-30 hidden border-e border-border bg-card transition-[width] lg:block",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        <AdminSidebar collapsed={collapsed} />
      </aside>

      <div className={cn("transition-[padding]", collapsed ? "lg:ps-[68px]" : "lg:ps-[248px]")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-3 sm:px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <AdminSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>

          <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
            <span>Admin</span>
            <span>/</span>
            <span className="font-medium text-foreground">{current?.label ?? "Dashboard"}</span>
          </div>

          <div className="relative ms-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search admin…"
              className="ps-8"
            />
            {matches.length ? (
              <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
                {matches.slice(0, 6).map((m) => (
                  <li key={m.to}>
                    <Link
                      to={m.to}
                      onClick={() => setTerm("")}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                      <m.icon className="size-4 text-muted-foreground" aria-hidden />
                      {m.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Link
            to="/admin/notifications"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 end-1.5 size-2.5 rounded-full bg-cyan-500 ring-2 ring-white animate-pulse" />
            )}
          </Link>
          <Link
            to="/"
            aria-label="View storefront"
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Store className="size-4" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={handleAdminLogout}
          >
            <LogOut className="size-4" />
          </Button>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
