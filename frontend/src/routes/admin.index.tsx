import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  CalendarCheck,
  ChevronRight,
  Clock,
  DollarSign,
  FileWarning,
  Package,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  Users2,
  Wallet,
  Wrench,
} from "lucide-react";
import { getAdminOverview } from "@/frontend/lib/api-services";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SectionCard,
  StatsCard,
  StatusBadge,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { formatMoney, num } from "@/frontend/lib/money";
import { cn } from "@/frontend/lib/utils";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

// Donut colors matching reference screenshot:
// Cancelled: Green #22c55e, Pending: Amber #f59e0b, In Progress: Cyan #06b6d4, Completed: Violet #8b5cf6
const DONUT_COLORS_MAP: Record<string, string> = {
  Cancelled: "#22c55e",
  Pending: "#f59e0b",
  "In Progress": "#06b6d4",
  Completed: "#8b5cf6",
};

function AdminHome() {
  const { data, isPending, isError } = useAdminQuery("overview", getAdminOverview);

  if (isError) return <ErrorState />;
  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="At-a-glance platform health" />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  const kpis: any = (data as any)?.kpis ?? {};
  const trends: any[] = (data as any)?.booking_trends_30_days ?? [];
  const byStatus: Record<string, number> = (data as any)?.by_status ?? {};
  const donutData = Object.entries(byStatus)
    .filter(([_, value]) => typeof value === "number" && value > 0)
    .map(([name, value]) => ({
      name,
      value: Number(value),
      color: DONUT_COLORS_MAP[name] || "#64748b",
    }));

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header with Title & Reports Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">At-a-glance platform health</p>
        </div>
        <Button asChild className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm">
          <Link to="/admin/reports">View All Reports →</Link>
        </Button>
      </div>

      {/* Top 8 Primary KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-cyan-300 transition-colors">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Customers</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{kpis.total_customers ?? 0}</span>
            <Users className="size-4 text-cyan-600" />
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-cyan-300 transition-colors">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Companies</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{kpis.total_companies ?? 0}</span>
            <Building2 className="size-4 text-cyan-600" />
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-cyan-300 transition-colors">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Professionals</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{kpis.total_professionals ?? 0}</span>
            <Wrench className="size-4 text-cyan-600" />
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-cyan-300 transition-colors">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Bookings</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{kpis.total_bookings ?? 0}</span>
            <CalendarCheck className="size-4 text-cyan-600" />
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-cyan-300 transition-colors">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {typeof kpis.total_revenue === "number" ? kpis.total_revenue.toFixed(2) : "0.00"}{" "}
              <span className="text-xs font-bold text-slate-500">AED</span>
            </span>
            <Wallet className="size-4 text-emerald-600" />
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-cyan-300 transition-colors">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Rating</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {kpis.average_rating ? Number(kpis.average_rating).toFixed(2) : "0.00"}
            </span>
            <Star className="size-4 fill-amber-400 text-amber-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-cyan-300 transition-colors">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Material Requests</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{kpis.pending_material_requests ?? 0}</span>
            <Package className="size-4 text-amber-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-cyan-300 transition-colors">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Documents Expiring (30 days)</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{kpis.documents_expiring_30_days ?? 0}</span>
            <FileWarning className="size-4 text-rose-500" />
          </div>
        </Card>
      </div>

      {/* Comparison Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-white border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500">Today vs Yesterday Bookings</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900">{kpis.today_bookings ?? 0}</span>
              <p className="text-xs text-slate-400 font-medium mt-1">Previous: {kpis.yesterday_bookings ?? 0}</p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-black ${
              (kpis.today_vs_yesterday_pct ?? 0) >= 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              {(kpis.today_vs_yesterday_pct ?? 0) >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              <span>{kpis.today_vs_yesterday_pct ?? 0}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500">This Month vs Last Month Bookings</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900">{kpis.month_bookings ?? 0}</span>
              <p className="text-xs text-slate-400 font-medium mt-1">Previous: {kpis.last_month_bookings ?? 0}</p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-black ${
              (kpis.month_vs_last_month_pct ?? 0) >= 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              {(kpis.month_vs_last_month_pct ?? 0) >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              <span>{kpis.month_vs_last_month_pct ?? 0}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Booking Trend - Last 30 Days Chart */}
        <Card className="lg:col-span-2 p-5 bg-white border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Booking Trend — Last 30 Days</h2>
            <p className="text-xs text-slate-400">Daily bookings volume across all service categories</p>
          </div>

          <div className="h-72 w-full mt-2">
            {trends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <CalendarCheck className="size-8 text-slate-300 mb-2" />
                <p>No bookings data recorded in the last 30 days.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookingTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    tickMargin={8}
                    interval={3}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    stroke="#94a3b8"
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && payload[0]?.payload) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg text-xs">
                            <p className="font-bold text-slate-800">{d.date}</p>
                            <p className="text-indigo-600 font-semibold mt-1">Bookings: {d.bookings}</p>
                            <p className="text-emerald-600 font-medium">Revenue: AED {d.revenue}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#bookingTrendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Booking Status Donut Chart */}
        <Card className="p-5 bg-white border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900">Booking Status</h2>
            <p className="text-xs text-slate-400">Current active and finalized distribution</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {donutData.length === 0 ? (
              <div className="text-center text-slate-400 text-xs">
                <CalendarCheck className="size-8 text-slate-300 mx-auto mb-2" />
                <p>No bookings available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val}%`, "Share"]}
                    contentStyle={{ borderRadius: "0.75rem", fontSize: "12px", border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100 text-xs font-semibold">
            {donutData.length === 0 ? (
              <p className="col-span-2 text-center text-slate-400 text-[11px]">0 active bookings</p>
            ) : (
              donutData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}</span>
                  <span className="ms-auto text-slate-900 font-bold">{item.value}%</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Access Operational Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Card className="p-4 bg-white border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Staff & Teams</h3>
            <Button asChild variant="ghost" size="sm" className="text-xs text-cyan-600 hover:text-cyan-700 h-7 px-2">
              <Link to="/admin/professionals">View All</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {kpis.total_professionals ?? 0} Professionals registered in the platform.
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Document Compliance</h3>
            <Button asChild variant="ghost" size="sm" className="text-xs text-cyan-600 hover:text-cyan-700 h-7 px-2">
              <Link to="/admin/expired-documents">Audit Hub</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {kpis.documents_expiring_30_days ?? 0} compliance documents expiring within 30 days.
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Material Inventory</h3>
            <Button asChild variant="ghost" size="sm" className="text-xs text-cyan-600 hover:text-cyan-700 h-7 px-2">
              <Link to="/admin/materials">Stock Level</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {kpis.pending_material_requests ?? 0} pending material replenishment requests.
          </p>
        </Card>
      </div>
    </div>
  );
}
