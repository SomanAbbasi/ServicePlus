import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { cn } from "@/frontend/lib/utils";
import {
  STATUS_COLORS,
  STATUS_DEFAULT,
  STAT_CARD_ACCENTS,
  ACTION_ICON_STYLES,
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
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  PageHeader                                                         */
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
    <div className="mb-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {crumb.to ? (
                <Link to={crumb.to as any} className="text-primary hover:underline font-semibold">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PageActions — standardized Search / Export / Add buttons            */
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
    <div className="flex items-center gap-2">
      {onSearchToggle && (
        <Button
          type="button"
          variant={isSearchOpen ? "default" : "outline"}
          size="sm"
          onClick={onSearchToggle}
          className="h-9 px-4 text-xs font-semibold"
        >
          <Search className={cn(ICON.inline, "me-1.5")} />
          Search
        </Button>
      )}
      {onExport && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-9 px-4 text-xs font-semibold"
        >
          <Download className={cn(ICON.inline, "me-1.5")} />
          Export CSV
        </Button>
      )}
      {addNewLabel && addNewTo && (
        <Button asChild size="sm" className="h-9 px-4 text-xs font-semibold">
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
/*  StatsCard                                                          */
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
    <Card className="p-4 bg-card border-border shadow-xs hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-lg",
              ICON.statContainer,
              palette.bg,
              palette.text,
            )}
          >
            <Icon className={ICON.statCard} />
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  ComparisonCard                                                     */
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
    <Card className="p-4 bg-card border-border shadow-xs">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold tracking-tight text-foreground">{current}</span>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            {previousLabel}: {previous}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold",
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
/*  StatusBadge                                                        */
/* ------------------------------------------------------------------ */

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = String(status ?? "").toUpperCase();
  const label =
    key === "ACTIVE"
      ? "Activated"
      : key === "INACTIVE"
        ? "Deactivated"
        : key
          ? key.replaceAll("_", " ").toLowerCase()
          : "—";

  const style = STATUS_COLORS[key] ?? STATUS_DEFAULT;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        style.badge,
      )}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  ActionIconButton                                                   */
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
    (action === "delete" || action === "reject" ? "text-rose-500 hover:bg-rose-50" :
     action === "edit" ? "text-primary hover:bg-primary/10" :
     action === "view" || action === "info" ? "text-blue-600 hover:bg-blue-50" :
     action === "toggle_on" ? "text-emerald-600 hover:bg-emerald-50" :
     action === "toggle_off" || action === "toggle_status" ? "text-rose-500 hover:bg-rose-50" :
     "text-slate-600 hover:bg-slate-100");

  const classes = cn(
    "inline-flex items-center justify-center size-8 rounded-md transition-colors cursor-pointer",
    style,
    disabled && "opacity-40 pointer-events-none",
  );

  const iconElement = Icon ? <Icon className={cn(ICON.inline, "stroke-[2]")} /> : null;

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
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ErrorState                                                         */
/* ------------------------------------------------------------------ */

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
      {message ?? "Something went wrong loading this data."}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TableSkeleton                                                      */
/* ------------------------------------------------------------------ */

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionCard                                                        */
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
    <Card className={cn("p-4 bg-card border-border shadow-xs", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  CSV Utilities                                                      */
/* ------------------------------------------------------------------ */

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
