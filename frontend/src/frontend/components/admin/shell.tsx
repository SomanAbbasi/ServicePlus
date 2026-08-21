import * as React from "react";
import { Card } from "@/frontend/components/ui/card";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { cn } from "@/frontend/lib/utils";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatsCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
    </Card>
  );
}

const STATUS_TONES: Record<string, string> = {
  COMPLETED: "bg-emerald-100/70 text-emerald-600",
  CONFIRMED: "bg-emerald-100/70 text-emerald-600",
  PAID: "bg-emerald-100/70 text-emerald-600",
  AVAILABLE: "bg-emerald-100/70 text-emerald-600",
  ACTIVE: "bg-emerald-100/70 text-emerald-600",
  ACTIVATED: "bg-emerald-100/70 text-emerald-600",
  INACTIVE: "bg-rose-100/70 text-rose-600",
  DEACTIVATED: "bg-rose-100/70 text-rose-600",
  PENDING: "bg-amber-100/70 text-amber-600",
  DRAFT: "bg-slate-100 text-slate-600",
  ASSIGNING: "bg-amber-100/70 text-amber-600",
  ASSIGNED: "bg-sky-100/70 text-sky-600",
  EN_ROUTE: "bg-sky-100/70 text-sky-600",
  ARRIVED: "bg-sky-100/70 text-sky-600",
  IN_PROGRESS: "bg-sky-100/70 text-sky-600",
  BUSY: "bg-sky-100/70 text-sky-600",
  RESCHEDULED: "bg-violet-100/70 text-violet-600",
  CANCELLED: "bg-rose-100/70 text-rose-600",
  FAILED: "bg-rose-100/70 text-rose-600",
  PAYMENT_FAILED: "bg-rose-100/70 text-rose-600",
  SUSPENDED: "bg-rose-100/70 text-rose-600",
  REFUNDED: "bg-violet-100/70 text-violet-600",
  OFFLINE: "bg-slate-100 text-slate-600",
  ON_LEAVE: "bg-slate-100 text-slate-600",
};

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
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        STATUS_TONES[key] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
      {message ?? "Something went wrong loading this data."}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

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
    <Card className={cn("p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join(
    "\n",
  );
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
