/**
 * ServicePlus Admin Design System — Central Design Tokens
 *
 * Single source of truth for colors, sizes, and mappings used across
 * every admin page. Import from here instead of hardcoding values.
 */

/* ------------------------------------------------------------------ */
/*  Status Colors                                                      */
/* ------------------------------------------------------------------ */

export type StatusKey =
  | "COMPLETED"
  | "CONFIRMED"
  | "PAID"
  | "AVAILABLE"
  | "ACTIVE"
  | "ACTIVATED"
  | "INACTIVE"
  | "DEACTIVATED"
  | "PENDING"
  | "DRAFT"
  | "ASSIGNING"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "BUSY"
  | "RESCHEDULED"
  | "CANCELLED"
  | "FAILED"
  | "PAYMENT_FAILED"
  | "SUSPENDED"
  | "REFUNDED"
  | "OFFLINE"
  | "ON_LEAVE";

export interface StatusStyle {
  /** Tailwind classes for badge background + text */
  badge: string;
  /** Hex color for use in charts (Recharts, etc.) */
  chart: string;
}

/**
 * Canonical status color palette.
 *
 * Pending        → amber/orange
 * In Progress    → sky/cyan
 * Completed      → indigo/purple
 * Cancelled      → green
 * Danger/Failed  → rose/red
 * Neutral/Draft  → slate
 */
export const STATUS_COLORS = {
  // ── Completed / Success ──
  COMPLETED:    { badge: "bg-violet-100/70 text-violet-700",   chart: "#8b5cf6" },
  CONFIRMED:    { badge: "bg-violet-100/70 text-violet-700",   chart: "#8b5cf6" },
  PAID:         { badge: "bg-violet-100/70 text-violet-700",   chart: "#8b5cf6" },
  AVAILABLE:    { badge: "bg-emerald-100/70 text-emerald-700", chart: "#10b981" },

  // ── Active / Activated ──
  ACTIVE:       { badge: "bg-emerald-100/70 text-emerald-700", chart: "#10b981" },
  ACTIVATED:    { badge: "bg-emerald-100/70 text-emerald-700", chart: "#10b981" },

  // ── Deactivated / Inactive ──
  INACTIVE:     { badge: "bg-rose-100/70 text-rose-600",       chart: "#e11d48" },
  DEACTIVATED:  { badge: "bg-rose-100/70 text-rose-600",       chart: "#e11d48" },

  // ── Pending ──
  PENDING:      { badge: "bg-amber-100/70 text-amber-700",     chart: "#f59e0b" },
  ASSIGNING:    { badge: "bg-amber-100/70 text-amber-700",     chart: "#f59e0b" },

  // ── In Progress ──
  ASSIGNED:     { badge: "bg-sky-100/70 text-sky-700",         chart: "#06b6d4" },
  EN_ROUTE:     { badge: "bg-sky-100/70 text-sky-700",         chart: "#06b6d4" },
  ARRIVED:      { badge: "bg-sky-100/70 text-sky-700",         chart: "#06b6d4" },
  IN_PROGRESS:  { badge: "bg-sky-100/70 text-sky-700",         chart: "#06b6d4" },
  BUSY:         { badge: "bg-sky-100/70 text-sky-700",         chart: "#06b6d4" },

  // ── Cancelled (green per design spec) ──
  CANCELLED:    { badge: "bg-green-100/70 text-green-700",     chart: "#22c55e" },

  // ── Rescheduled / Refunded ──
  RESCHEDULED:  { badge: "bg-violet-100/70 text-violet-600",   chart: "#7c3aed" },
  REFUNDED:     { badge: "bg-violet-100/70 text-violet-600",   chart: "#7c3aed" },

  // ── Failed / Danger ──
  FAILED:       { badge: "bg-rose-100/70 text-rose-600",       chart: "#e11d48" },
  PAYMENT_FAILED: { badge: "bg-rose-100/70 text-rose-600",     chart: "#e11d48" },
  SUSPENDED:    { badge: "bg-rose-100/70 text-rose-600",       chart: "#e11d48" },

  // ── Neutral ──
  DRAFT:        { badge: "bg-slate-100 text-slate-600",        chart: "#64748b" },
  OFFLINE:      { badge: "bg-slate-100 text-slate-600",        chart: "#64748b" },
  ON_LEAVE:     { badge: "bg-slate-100 text-slate-600",        chart: "#64748b" },
} as Record<string, StatusStyle>;

/** Fallback for unknown statuses */
export const STATUS_DEFAULT: StatusStyle = {
  badge: "bg-slate-100 text-slate-600",
  chart: "#64748b",
};

/** Donut chart status mapping (canonical order) */
export const DONUT_STATUS_COLORS: Record<string, string> = {
  Pending:       "#f59e0b",
  "In Progress": "#06b6d4",
  Completed:     "#8b5cf6",
  Cancelled:     "#22c55e",
};

/* ------------------------------------------------------------------ */
/*  Stat Card Accent Palette                                           */
/* ------------------------------------------------------------------ */

export type StatAccent =
  | "blue"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "indigo"
  | "primary";

export const STAT_CARD_ACCENTS: Record<StatAccent, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10",       text: "text-primary" },
  blue:    { bg: "bg-blue-100/70",      text: "text-blue-600" },
  cyan:    { bg: "bg-cyan-100/70",      text: "text-cyan-600" },
  emerald: { bg: "bg-emerald-100/70",   text: "text-emerald-600" },
  amber:   { bg: "bg-amber-100/70",     text: "text-amber-600" },
  rose:    { bg: "bg-rose-100/70",      text: "text-rose-600" },
  violet:  { bg: "bg-violet-100/70",    text: "text-violet-600" },
  indigo:  { bg: "bg-indigo-100/70",    text: "text-indigo-600" },
};

/* ------------------------------------------------------------------ */
/*  Icon Sizes                                                         */
/* ------------------------------------------------------------------ */

/** Standardized icon sizes across the admin console */
export const ICON = {
  /** Inline icons in text, buttons, top bar — 16px */
  inline: "size-4" as const,
  /** Icons inside stat card containers — 20px */
  statCard: "size-5" as const,
  /** Stat card icon container — 40px */
  statContainer: "size-10" as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Action Icon Colors                                                 */
/* ------------------------------------------------------------------ */

export type ActionType =
  | "view"
  | "edit"
  | "delete"
  | "send"
  | "toggle_on"
  | "toggle_off"
  | "password"
  | "duplicate";

export const ACTION_ICON_STYLES: Record<ActionType, string> = {
  view:       "text-blue-600 hover:bg-blue-50",
  edit:       "text-primary hover:bg-primary/5",
  delete:     "text-rose-500 hover:bg-rose-50",
  send:       "text-slate-600 hover:bg-slate-50",
  toggle_on:  "text-emerald-600 hover:bg-emerald-50",
  toggle_off: "text-rose-500 hover:bg-rose-50",
  password:   "text-cyan-600 hover:bg-cyan-50",
  duplicate:  "text-violet-600 hover:bg-violet-50",
};

/* ------------------------------------------------------------------ */
/*  Chart Brand Color                                                  */
/* ------------------------------------------------------------------ */

/** Brand primary color for chart lines/bars — ServicePlus Blue */
export const CHART_PRIMARY = "#1356C0";
export const CHART_PRIMARY_LIGHT = "rgba(19, 86, 192, 0.15)";
