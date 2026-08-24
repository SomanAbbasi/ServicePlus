/**
 * ServicePlus Admin Design System — Central Design Tokens (Round 2 Specifications)
 *
 * Single source of truth for typography, colors, icon containers, buttons,
 * and chart mappings used across every admin page.
 */

/* ------------------------------------------------------------------ */
/*  Typography Tokens (Exact Numbers)                                 */
/* ------------------------------------------------------------------ */

export const TYPOGRAPHY = {
  /** Page titles: 26–28px, weight 700 */
  pageTitle: "text-[26px] sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight" as const,
  /** Card/section titles: 16–18px, weight 600 */
  cardTitle: "text-[16px] sm:text-[18px] font-semibold text-slate-900 tracking-tight" as const,
  /** Stat numbers: 32–36px, weight 700 (dominant visual element) */
  statNumber: "text-[32px] sm:text-[36px] font-bold text-slate-900 tracking-tight leading-none" as const,
  /** Stat labels: 12–13px, uppercase, letter-spacing 0.05em, weight 500, color #6B7280 */
  statLabel: "text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.05em] text-[#6B7280]" as const,
  /** Table headers: 13–14px, weight 600 */
  tableHeader: "text-[13px] sm:text-[14px] font-semibold text-slate-700" as const,
  /** Table body/cell text: 14–15px, weight 400 */
  tableCell: "text-[14px] sm:text-[15px] font-normal text-slate-800" as const,
  /** Base body font size for the whole admin app: 14px minimum */
  baseBody: "text-[14px] text-slate-700" as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Status Colors                                                     */
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
  badge: string;
  chart: string;
}

/**
 * Canonical status color palette (WCAG AA Compliant):
 *
 * Pending       → Amber
 * In Progress   → Cyan/Sky
 * Completed     → Emerald/Green
 * Cancelled     → Red/Neutral
 * Deactivated   → Rose/Red
 * Activated     → Emerald/Green
 */
export const STATUS_COLORS: Record<string, StatusStyle> = {
  // ── Activated / Available / Success ──
  ACTIVATED:    { badge: "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold", chart: "#10B981" },
  ACTIVE:       { badge: "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold", chart: "#10B981" },
  AVAILABLE:    { badge: "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold", chart: "#10B981" },
  COMPLETED:    { badge: "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold", chart: "#10B981" },
  CONFIRMED:    { badge: "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold", chart: "#10B981" },
  PAID:         { badge: "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold", chart: "#10B981" },

  // ── Deactivated / Inactive / Suspended ──
  DEACTIVATED:  { badge: "bg-rose-100 text-rose-800 border border-rose-200 font-bold",       chart: "#EF4444" },
  INACTIVE:     { badge: "bg-rose-100 text-rose-800 border border-rose-200 font-bold",       chart: "#EF4444" },
  SUSPENDED:    { badge: "bg-rose-100 text-rose-800 border border-rose-200 font-bold",       chart: "#EF4444" },
  FAILED:       { badge: "bg-rose-100 text-rose-800 border border-rose-200 font-bold",       chart: "#EF4444" },
  PAYMENT_FAILED: { badge: "bg-rose-100 text-rose-800 border border-rose-200 font-bold",     chart: "#EF4444" },

  // ── Pending ──
  PENDING:      { badge: "bg-amber-100 text-amber-800 border border-amber-200 font-bold",     chart: "#F59E0B" },
  ASSIGNING:    { badge: "bg-amber-100 text-amber-800 border border-amber-200 font-bold",     chart: "#F59E0B" },

  // ── In Progress ──
  IN_PROGRESS:  { badge: "bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold",         chart: "#00B4D8" },
  ASSIGNED:     { badge: "bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold",         chart: "#00B4D8" },
  EN_ROUTE:     { badge: "bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold",         chart: "#00B4D8" },
  ARRIVED:      { badge: "bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold",         chart: "#00B4D8" },
  BUSY:         { badge: "bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold",         chart: "#00B4D8" },

  // ── Cancelled ──
  CANCELLED:    { badge: "bg-red-100 text-red-800 border border-red-200 font-bold",           chart: "#DC2626" },

  // ── Rescheduled / Refunded ──
  RESCHEDULED:  { badge: "bg-purple-100 text-purple-800 border border-purple-200 font-bold",   chart: "#8B5CF6" },
  REFUNDED:     { badge: "bg-purple-100 text-purple-800 border border-purple-200 font-bold",   chart: "#8B5CF6" },

  // ── Neutral ──
  DRAFT:        { badge: "bg-slate-100 text-slate-700 border border-slate-200 font-semibold",  chart: "#64748B" },
  OFFLINE:      { badge: "bg-slate-100 text-slate-700 border border-slate-200 font-semibold",  chart: "#64748B" },
  ON_LEAVE:     { badge: "bg-slate-100 text-slate-700 border border-slate-200 font-semibold",  chart: "#64748B" },
};

/** Fallback for unknown statuses */
export const STATUS_DEFAULT: StatusStyle = {
  badge: "bg-slate-100 text-slate-700 border border-slate-200 font-semibold",
  chart: "#64748B",
};

/** Donut chart status mapping */
export const DONUT_STATUS_COLORS: Record<string, string> = {
  Completed:     "#10B981",
  "In Progress": "#00B4D8",
  Pending:       "#F59E0B",
  Cancelled:     "#EF4444",
};

/* ------------------------------------------------------------------ */
/*  Stat Card Accent Palette (Solid 40x40 Containers + White Icons)   */
/* ------------------------------------------------------------------ */

export type StatAccent =
  | "primary"
  | "cyan"
  | "blue"
  | "indigo"
  | "teal"
  | "emerald"
  | "amber"
  | "orange"
  | "rose"
  | "violet"
  | "purple";

export const STAT_CARD_ACCENTS: Record<StatAccent, { bg: string; text: string }> = {
  primary: { bg: "bg-[#00B4D8]", text: "text-white" },
  cyan:    { bg: "bg-cyan-600",  text: "text-white" },
  blue:    { bg: "bg-blue-600",  text: "text-white" },
  indigo:  { bg: "bg-indigo-600",text: "text-white" },
  teal:    { bg: "bg-teal-600",  text: "text-white" },
  emerald: { bg: "bg-emerald-600",text: "text-white" },
  amber:   { bg: "bg-amber-500", text: "text-white" },
  orange:  { bg: "bg-orange-500",text: "text-white" },
  rose:    { bg: "bg-rose-500",  text: "text-white" },
  violet:  { bg: "bg-purple-600",text: "text-white" },
  purple:  { bg: "bg-purple-600",text: "text-white" },
};

/* ------------------------------------------------------------------ */
/*  Icon Sizes & Containers                                           */
/* ------------------------------------------------------------------ */

export const ICON = {
  /** Standard inline/action icon size: 18–20px */
  inline: "size-[18px]" as const,
  /** Stat card icon inside 40x40 container: 20px */
  statCard: "size-5" as const,
  /** Stat card container: 40x40px rounded container */
  statContainer: "size-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs" as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Action Icon Colors (Consistent Across Every Table)                */
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
  view:       "text-blue-600 hover:bg-blue-50 border border-blue-200/60",
  edit:       "text-cyan-700 hover:bg-cyan-50 border border-cyan-200/60",
  delete:     "text-rose-600 hover:bg-rose-50 border border-rose-200/60",
  send:       "text-purple-600 hover:bg-purple-50 border border-purple-200/60",
  toggle_on:  "text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60",
  toggle_off: "text-rose-600 hover:bg-rose-50 border border-rose-200/60",
  password:   "text-amber-600 hover:bg-amber-50 border border-amber-200/60",
  duplicate:  "text-indigo-600 hover:bg-indigo-50 border border-indigo-200/60",
};

/* ------------------------------------------------------------------ */
/*  Button Tokens (Height 40px, Padding 12–16px, Radius 8px)          */
/* ------------------------------------------------------------------ */

export const BUTTON_STYLES = {
  primary: "h-10 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer",
  secondary: "h-10 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer",
  iconButton: "size-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0",
} as const;

/* ------------------------------------------------------------------ */
/*  Chart Colors                                                      */
/* ------------------------------------------------------------------ */

export const CHART_PRIMARY = "#00B4D8";
export const CHART_PRIMARY_LIGHT = "rgba(0, 180, 216, 0.15)";
