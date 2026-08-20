import { Link, useRouterState } from "@tanstack/react-router";
import {
  BadgePercent,
  Bell,
  Boxes,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileBarChart,
  History,
  LayoutGrid,
  LifeBuoy,
  MapPin,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutGrid },
      { to: "/admin/bookings", label: "Bookings", icon: ClipboardList },
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/customers", label: "Customers", icon: Users },
      { to: "/admin/professionals", label: "Professionals", icon: Wrench },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/categories", label: "Categories", icon: Boxes },
      { to: "/admin/services", label: "Services", icon: Sparkles },
      { to: "/admin/addons", label: "Add-ons", icon: Package },
      { to: "/admin/bundles", label: "Bundles", icon: Package },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/availability", label: "Availability", icon: Timer },
      { to: "/admin/locations", label: "Locations", icon: MapPin },
      { to: "/admin/coupons", label: "Coupons", icon: BadgePercent },
      { to: "/admin/pricing", label: "Pricing", icon: Receipt },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/admin/payments", label: "Payments", icon: CreditCard },
      { to: "/admin/refunds", label: "Refunds", icon: Receipt },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
      { to: "/admin/support", label: "Support", icon: LifeBuoy },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/reports", label: "Reports", icon: FileBarChart },
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/audit-logs", label: "Audit logs", icon: History },
    ],
  },
];

export function AdminSidebar({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <div className={cn("flex items-center gap-2 px-1 py-2", collapsed && "justify-center")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        {!collapsed ? <span className="text-sm font-semibold">ServicePlus Admin</span> : null}
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed ? (
            <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
