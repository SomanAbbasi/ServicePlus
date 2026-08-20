import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Store } from "lucide-react";
import { amIAdmin } from "@/frontend/lib/api-services";
import { AdminSidebar, NAV_GROUPS } from "@/frontend/components/admin/AdminSidebar";
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

function AdminLayout() {
  const { session, loading } = useSession();
  const { clearAuth } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [term, setTerm] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data, isPending } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => amIAdmin(),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (loading) return;
    if (!session) void navigate({ to: "/auth", search: { redirect: "/admin" } });
    else if (data && !data.is_admin) void navigate({ to: "/" });
  }, [loading, session, data, navigate]);

  if (loading || (session && isPending)) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session || !data?.is_admin) {
    return (
      <div className="mx-auto max-w-md p-16 text-center">
        <h1 className="text-lg font-semibold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is restricted to ServicePlus staff accounts.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
          Back to ServicePlus
        </Link>
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
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-4" />
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
            onClick={() => {
              clearAuth();
              void navigate({ to: "/" });
            }}
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
