import { createFileRoute, Link } from "@tanstack/react-router";
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
  FileWarning,
  Package,
  Star,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { getAdminOverview } from "@/frontend/lib/api-services";
import {
  ErrorState,
  PageHeader,
  StatsCard,
  ComparisonCard,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { DONUT_STATUS_COLORS, TYPOGRAPHY } from "@/frontend/lib/design-tokens";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

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
      color: DONUT_STATUS_COLORS[name] || "#64748B",
    }));

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header with Title & Reports Action */}
      <PageHeader
        title="Dashboard"
        description="At-a-glance platform operations and performance health"
        actions={
          <Button asChild className="h-10 px-5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs">
            <Link to="/admin/reports">View All Reports →</Link>
          </Button>
        }
      />

      {/* Top 8 Primary KPI Stat Cards (32–36px dominant numbers + 40x40px solid colored containers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="TOTAL CUSTOMERS"
          value={kpis.total_customers ?? 0}
          icon={Users}
          accent="cyan"
        />

        <StatsCard
          label="TOTAL COMPANIES"
          value={kpis.total_companies ?? 0}
          icon={Building2}
          accent="blue"
        />

        <StatsCard
          label="TOTAL PROFESSIONALS"
          value={kpis.total_professionals ?? 0}
          icon={Wrench}
          accent="indigo"
        />

        <StatsCard
          label="TOTAL BOOKINGS"
          value={kpis.total_bookings ?? 0}
          icon={CalendarCheck}
          accent="teal"
        />

        <StatsCard
          label="TOTAL REVENUE"
          value={
            <>
              {typeof kpis.total_revenue === "number" ? kpis.total_revenue.toFixed(2) : "0.00"}{" "}
              <span className="text-sm font-bold text-slate-500">AED</span>
            </>
          }
          icon={Wallet}
          accent="emerald"
        />

        <StatsCard
          label="AVERAGE RATING"
          value={kpis.average_rating ? Number(kpis.average_rating).toFixed(2) : "0.00"}
          icon={Star}
          accent="amber"
        />

        <StatsCard
          label="PENDING MATERIAL REQUESTS"
          value={kpis.pending_material_requests ?? 0}
          icon={Package}
          accent="orange"
        />

        <StatsCard
          label="DOCUMENTS EXPIRING (30 DAYS)"
          value={kpis.documents_expiring_30_days ?? 0}
          icon={FileWarning}
          accent="rose"
        />
      </div>

      {/* Comparison Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComparisonCard
          title="Today vs Yesterday Bookings"
          current={kpis.today_bookings ?? 0}
          previous={kpis.yesterday_bookings ?? 0}
          percentChange={kpis.today_vs_yesterday_pct ?? 0}
          previousLabel="Yesterday"
        />

        <ComparisonCard
          title="This Month vs Last Month Bookings"
          current={kpis.month_bookings ?? 0}
          previous={kpis.last_month_bookings ?? 0}
          percentChange={kpis.month_vs_last_month_pct ?? 0}
          previousLabel="Last Month"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Booking Trend - Last 30 Days Chart */}
        <Card className="lg:col-span-2 p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl flex flex-col">
          <div className="mb-4">
            <h2 className={TYPOGRAPHY.cardTitle}>Booking Trend — Last 30 Days</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Daily bookings volume across all service categories</p>
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
                      <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00B4D8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickMargin={8}
                    interval={3}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="#94a3b8"
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && payload[0]?.payload) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
                            <p className="font-bold text-slate-900">{d.date}</p>
                            <p className="text-cyan-700 font-extrabold">Bookings: {d.bookings}</p>
                            <p className="text-emerald-700 font-bold">Revenue: AED {d.revenue}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#00B4D8"
                    strokeWidth={2.5}
                    fill="url(#bookingTrendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Booking Status Donut Chart with Multi-Color Palette & Legend */}
        <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl flex flex-col">
          <div className="mb-2">
            <h2 className={TYPOGRAPHY.cardTitle}>Booking Status</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Current active and finalized distribution</p>
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
                    contentStyle={{ borderRadius: "0.75rem", fontSize: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Interactive Multi-Color Legend */}
          <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100 text-xs font-semibold">
            {donutData.length === 0 ? (
              <p className="col-span-2 text-center text-slate-400 text-xs">0 active bookings</p>
            ) : (
              donutData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50">
                  <span className="size-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium truncate">{item.name}</span>
                  <span className="ms-auto text-slate-900 font-black">{item.value}%</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Access Operational Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Card className="p-5 bg-white border border-slate-200/90 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Staff & Teams</h3>
            <Button asChild variant="ghost" size="sm" className="text-xs text-cyan-600 hover:text-cyan-700 h-8 px-2 font-bold">
              <Link to="/admin/professionals">View All →</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {kpis.total_professionals ?? 0} Professionals active in roster.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/90 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Document Compliance</h3>
            <Button asChild variant="ghost" size="sm" className="text-xs text-cyan-600 hover:text-cyan-700 h-8 px-2 font-bold">
              <Link to="/admin/expired-documents">Audit Hub →</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {kpis.documents_expiring_30_days ?? 0} documents expiring within 30 days.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/90 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Material Inventory</h3>
            <Button asChild variant="ghost" size="sm" className="text-xs text-cyan-600 hover:text-cyan-700 h-8 px-2 font-bold">
              <Link to="/admin/materials">Stock Level →</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {kpis.pending_material_requests ?? 0} pending material requests.
          </p>
        </Card>
      </div>
    </div>
  );
}
