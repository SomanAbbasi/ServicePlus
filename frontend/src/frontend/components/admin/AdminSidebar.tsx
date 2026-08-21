import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BadgePercent,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FileCheck2,
  FileText,
  FileWarning,
  History,
  Layers,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  Package,
  PackageCheck,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Timer,
  UserCheck,
  UserCog,
  Users,
  Users2,
  Wrench,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";

export interface NavChildItem {
  to: string;
  label: string;
  badge?: string | number;
}

export interface NavGroupItem {
  to?: string;
  label: string;
  icon: any;
  children?: NavChildItem[];
}

export const ADMIN_NAVIGATION: NavGroupItem[] = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    label: "Staff Management",
    icon: Users2,
    children: [
      { to: "/admin/staff", label: "Staff" },
      { to: "/admin/roles", label: "Roles" },
      { to: "/admin/professionals", label: "Professional" },
      { to: "/admin/team-leads", label: "Team Lead" },
      { to: "/admin/companies", label: "Company" },
      { to: "/admin/supervisors", label: "Super Visors" },
    ],
  },
  {
    label: "Service Management",
    icon: Sparkles,
    children: [
      { to: "/admin/categories", label: "Category Management" },
      { to: "/admin/services", label: "Services Management" },
      { to: "/admin/service-grouping", label: "Service Grouping" },
      { to: "/admin/addons", label: "Add-on Facility" },
      { to: "/admin/plans", label: "Plans Management" },
      { to: "/admin/coupons", label: "Coupon Management" },
    ],
  },
  {
    label: "Booking Management",
    icon: ClipboardList,
    children: [
      { to: "/admin/bookings", label: "Booking Management" },
      { to: "/admin/calendar", label: "Calendar" },
      { to: "/admin/reviews", label: "Rating & Reviews" },
      { to: "/admin/payments", label: "Payment Management" },
    ],
  },
  {
    to: "/admin/expired-documents",
    label: "Expired Documents",
    icon: FileWarning,
  },
  {
    label: "Material Management",
    icon: Package,
    children: [
      { to: "/admin/materials", label: "Material Management" },
      { to: "/admin/material-requests", label: "Material Request" },
    ],
  },
  {
    label: "System & Reports",
    icon: Settings,
    children: [
      { to: "/admin/reports", label: "All Reports" },
      { to: "/admin/support", label: "Contact Queries" },
      { to: "/admin/audit-logs", label: "Audit Logs" },
      { to: "/admin/settings", label: "Settings" },
    ],
  },
];

export const NAV_GROUPS = [
  {
    label: "All Admin Links",
    items: ADMIN_NAVIGATION.flatMap((item) =>
      item.children
        ? item.children.map((c) => ({ to: c.to, label: `${item.label} > ${c.label}`, icon: item.icon }))
        : item.to
          ? [{ to: item.to, label: item.label, icon: item.icon }]
          : [],
    ),
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

  // Keep track of which accordion menus are open (all collapsed by default)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Staff Management": false,
    "Service Management": false,
    "Booking Management": false,
    "Material Management": false,
    "System & Reports": false,
  });

  // Automatically expand group if child is active
  useEffect(() => {
    ADMIN_NAVIGATION.forEach((item) => {
      if (item.children) {
        const hasActive = item.children.some(
          (c) => pathname === c.to || pathname.startsWith(`${c.to}/`),
        );
        if (hasActive) {
          setOpenGroups((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav className="flex h-full flex-col overflow-y-auto bg-card p-3 select-none text-slate-700">
      {/* Brand Header */}
      <div className={cn("flex items-center gap-2.5 px-2 py-3 border-b border-border/70 mb-2", collapsed && "justify-center")}>
        <img
          src="/serviceplus-logo.webp"
          alt="ServicePlus"
          className="h-7 w-auto object-contain shrink-0"
        />
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-xs font-bold tracking-tight text-slate-900 block truncate">
              ServicePlus Operations
            </span>
            <span className="text-[10px] font-semibold text-cyan-600 uppercase tracking-wider block">
              Admin Console
            </span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <ul className="space-y-1.5 flex-1">
        {ADMIN_NAVIGATION.map((item) => {
          const isDirectLink = Boolean(item.to && !item.children);

          if (isDirectLink) {
            const active = item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to!);
            const Icon = item.icon;

            return (
              <li key={item.to}>
                <Link
                  to={item.to!}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-cyan-50 text-cyan-700 border border-cyan-200/80 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-cyan-600" : "text-slate-500")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          }

          // Collapsible group with children
          const isOpen = Boolean(openGroups[item.label]);
          const Icon = item.icon;
          const isAnyChildActive = item.children?.some(
            (c) => pathname === c.to || pathname.startsWith(`${c.to}/`),
          );

          return (
            <li key={item.label} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                  collapsed && "justify-center px-0",
                  isAnyChildActive && !collapsed
                    ? "text-cyan-700 bg-cyan-50/50"
                    : "text-slate-700 hover:bg-slate-100/70",
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={cn("size-4 shrink-0", isAnyChildActive ? "text-cyan-600" : "text-slate-500")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && (
                  <span className="text-slate-400">
                    {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                  </span>
                )}
              </button>

              {/* Sub-items */}
              {isOpen && !collapsed && (
                <ul className="ps-8 pe-1 space-y-0.5 border-s border-slate-200 ms-5 my-1">
                  {item.children?.map((child) => {
                    const active = pathname === child.to || pathname.startsWith(`${child.to}/`);
                    return (
                      <li key={child.to}>
                        <Link
                          to={child.to}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                            active
                              ? "bg-cyan-600 text-white font-bold shadow-xs"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                          )}
                        >
                          <span className="truncate">{child.label}</span>
                          {child.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                              {child.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {/* Footer Info */}
      {!collapsed && (
        <div className="pt-3 border-t border-border/70 mt-auto text-[11px] text-slate-400 font-medium px-2">
          <p>© 2026 ServicePlus Operations</p>
        </div>
      )}
    </nav>
  );
}
