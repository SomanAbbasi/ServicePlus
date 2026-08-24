import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { cn } from "@/frontend/lib/utils";
import {
  TYPOGRAPHY,
  STATUS_COLORS,
  STATUS_DEFAULT,
  STAT_CARD_ACCENTS,
  ACTION_ICON_STYLES,
  BUTTON_STYLES,
  ICON,
  type StatAccent,
  type ActionType,
} from "@/frontend/lib/design-tokens";
import {
  Download,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  PageHeader                                                        */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
}) {
  return (
    <div className="mb-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1.5" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {crumb.to ? (
                <Link to={crumb.to as any} className="text-cyan-600 hover:underline font-semibold">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-600">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>{title}</h1>
          {description ? (
            <p className="mt-1 text-xs text-slate-500 font-medium">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PageActions — Standardized Search / Export / Add buttons          */
/* ------------------------------------------------------------------ */

export function PageActions({
  onSearchToggle,
  isSearchOpen,
  onExport,
  addNewLabel,
  addNewTo,
  children,
}: {
  onSearchToggle?: () => void;
  isSearchOpen?: boolean;
  onExport?: () => void;
  addNewLabel?: string;
  addNewTo?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {onSearchToggle && (
        <Button
          type="button"
          variant={isSearchOpen ? "default" : "outline"}
          onClick={onSearchToggle}
          className={cn(
            isSearchOpen
              ? "h-10 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs"
              : "h-10 px-4 rounded-lg border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs"
          )}
        >
          <Search className={cn(ICON.inline, "me-1.5")} />
          Search
        </Button>
      )}
      {onExport && (
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className="h-10 px-4 rounded-lg border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs"
        >
          <Download className={cn(ICON.inline, "me-1.5")} />
          Export CSV
        </Button>
      )}
      {addNewLabel && addNewTo && (
        <Button asChild className="h-10 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs">
          <Link to={addNewTo as any}>
            <Plus className={cn(ICON.inline, "me-1.5")} />
            {addNewLabel}
          </Link>
        </Button>
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StatsCard (Dominant 32–36px Number + Solid 40x40 Icon Container)  */
/* ------------------------------------------------------------------ */

export function StatsCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  accent?: StatAccent;
}) {
  const palette = STAT_CARD_ACCENTS[accent] ?? STAT_CARD_ACCENTS.primary;
  return (
    <Card className="p-5 bg-white border border-slate-200/90 shadow-xs hover:border-cyan-400/60 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <p className={cn(TYPOGRAPHY.statLabel, "line-clamp-1")}>{label}</p>
        {Icon ? (
          <span className={cn(ICON.statContainer, palette.bg, palette.text)}>
            <Icon className={ICON.statCard} />
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <p className={TYPOGRAPHY.statNumber}>{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-slate-400 font-medium">{hint}</p>
        ) : null}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  ComparisonCard                                                    */
/* ------------------------------------------------------------------ */

export function ComparisonCard({
  title,
  current,
  previous,
  percentChange,
  previousLabel = "Previous",
}: {
  title: string;
  current: number | string;
  previous: number | string;
  percentChange: number;
  previousLabel?: string;
}) {
  const isPositive = percentChange >= 0;
  return (
    <Card className="p-5 bg-white border border-slate-200/90 shadow-xs rounded-2xl">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{current}</span>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {previousLabel}: {previous}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-black",
            isPositive
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700",
          )}
        >
          {isPositive ? (
            <TrendingUp className={ICON.inline} />
          ) : (
            <TrendingDown className={ICON.inline} />
          )}
          <span>{percentChange}%</span>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  StatusBadge                                                       */
/* ------------------------------------------------------------------ */

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = String(status ?? "").toUpperCase();
  const label =
    key === "ACTIVE" || key === "AVAILABLE"
      ? "Activated"
      : key === "INACTIVE" || key === "SUSPENDED"
        ? "Deactivated"
        : key
          ? key.replaceAll("_", " ").toLowerCase()
          : "—";

  const style = STATUS_COLORS[key] ?? STATUS_DEFAULT;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize shadow-2xs",
        style.badge,
      )}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  ActionIconButton                                                  */
/* ------------------------------------------------------------------ */

export function ActionIconButton({
  icon: Icon,
  label,
  action = "view",
  onClick,
  to,
  search,
  disabled,
}: {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  label: string;
  action?: ActionType | string;
  onClick?: () => void;
  to?: string;
  search?: Record<string, any>;
  disabled?: boolean;
}) {
  const style = (ACTION_ICON_STYLES as Record<string, string>)[action] ??
    (action === "delete" || action === "reject" ? "text-rose-600 hover:bg-rose-50 border border-rose-200/60" :
     action === "edit" ? "text-cyan-700 hover:bg-cyan-50 border border-cyan-200/60" :
     action === "view" || action === "info" ? "text-blue-600 hover:bg-blue-50 border border-blue-200/60" :
     action === "toggle_on" ? "text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60" :
     action === "toggle_off" || action === "toggle_status" ? "text-rose-600 hover:bg-rose-50 border border-rose-200/60" :
     "text-slate-600 hover:bg-slate-100 border border-slate-200/60");

  const classes = cn(
    "inline-flex items-center justify-center size-9 rounded-lg bg-white shadow-2xs transition-all active:scale-95",
    style,
    disabled && "opacity-40 pointer-events-none",
  );

  const iconElement = Icon ? <Icon className={cn(ICON.inline, "stroke-[2.2]")} /> : null;

  if (to) {
    return (
      <Link to={to as any} search={search as any} title={label} aria-label={label} className={classes}>
        {iconElement}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={classes}
    >
      {iconElement}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TablePagination                                                   */
/* ------------------------------------------------------------------ */

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-slate-200 bg-white rounded-b-2xl text-xs font-semibold text-slate-600">
      <div className="flex items-center gap-2">
        <span>Show</span>
        {onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        ) : (
          <span>{pageSize}</span>
        )}
        <span>entries (Showing {start} to {end} of {totalItems})</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-2.5 rounded-lg text-xs font-bold"
        >
          <ChevronLeft className="size-3.5 me-0.5" /> Previous
        </Button>

        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) {
            pageNum = Math.min(totalPages - 4 + i, currentPage - 2 + i);
          }
          const isActive = currentPage === pageNum;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "size-8 rounded-lg text-xs font-bold transition-colors",
                isActive
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              {pageNum}
            </button>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-2.5 rounded-lg text-xs font-bold"
        >
          Next <ChevronRight className="size-3.5 ms-0.5" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EmptyState                                                        */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-slate-400 font-medium">{description}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ErrorState                                                        */
/* ------------------------------------------------------------------ */

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-800 font-bold">
      {message ?? "Something went wrong loading this data."}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TableSkeleton                                                     */
/* ------------------------------------------------------------------ */

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4 bg-white rounded-2xl border border-slate-200">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionCard                                                       */
/* ------------------------------------------------------------------ */

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5 bg-white border border-slate-200/90 shadow-xs rounded-2xl", className)}>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 className={TYPOGRAPHY.cardTitle}>{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  CSV Utilities                                                     */
/* ------------------------------------------------------------------ */

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
