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
import { CalendarCheck, Star, Users, Wallet } from "lucide-react";
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
import { formatMoney, num } from "@/frontend/lib/money";
import { cn } from "@/frontend/lib/utils";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

const RANGES = [
  { key: "7D", days: 7 },
  { key: "30D", days: 30 },
  { key: "3M", days: 90 },
  { key: "1Y", days: 365 },
];

const DONUT_COLORS = ["#12B8E8", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

function AdminHome() {
  const { data, isPending, isError } = useAdminQuery("overview", getAdminOverview);
  const [range, setRange] = useState(RANGES[1]!);

  if (isError) return <ErrorState />;
  if (isPending || !data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <TableSkeleton rows={8} />
      </>
    );
  }

  const since = new Date(Date.now() - range.days * 864e5).toISOString().slice(0, 10);
  const series = data.revenue_series.filter((p) => p.date >= since);
  const donut = Object.entries(data.by_status).map(([name, value]) => ({ name, value }));

  return (
    <>
      <PageHeader title="Dashboard" description="Live view of bookings, revenue and your team." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Today's bookings"
          value={data.kpis.today_bookings}
          icon={CalendarCheck}
          hint={`${data.kpis.total_bookings} in the last year`}
        />
        <StatsCard
          label="Revenue this month"
          value={formatMoney(data.kpis.revenue_month)}
          icon={Wallet}
          hint={`${formatMoney(data.kpis.revenue_total)} total`}
        />
        <StatsCard
          label="Active professionals"
          value={data.kpis.active_professionals}
          icon={Users}
          hint={`${data.kpis.professionals} on the roster`}
        />
        <StatsCard
          label="New customers"
          value={data.kpis.new_customers}
          icon={Star}
          hint={`${data.kpis.customers} registered`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Completed" value={data.kpis.completed} />
        <StatsCard label="Pending" value={data.kpis.pending} />
        <StatsCard label="Cancelled" value={data.kpis.cancelled} />
        <StatsCard label="Average order value" value={formatMoney(data.kpis.aov)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Revenue"
          className="lg:col-span-2"
          action={
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium",
                    r.key === range.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {r.key}
                </button>
              ))}
            </div>
          }
        >
          {series.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#12B8E8" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#12B8E8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={50} />
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#12B8E8"
                    fill="url(#rev)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No revenue in this period" />
          )}
        </SectionCard>

        <SectionCard title="Bookings by status">
          {donut.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {donut.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No bookings yet" />
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Upcoming bookings"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/bookings">View all</Link>
            </Button>
          }
        >
          <Rows
            rows={data.upcoming}
            empty="Nothing scheduled"
            render={(b) => (
              <>
                <span className="truncate font-medium">{b.service?.name ?? "Service"}</span>
                <span className="text-xs text-muted-foreground">
                  {b.scheduled_date} {String(b.scheduled_start ?? "").slice(0, 5)}
                </span>
                <StatusBadge status={b.status} />
                <span className="text-sm font-medium">{formatMoney(num(b.total))}</span>
              </>
            )}
          />
        </SectionCard>

        <SectionCard title="Recent bookings">
          <Rows
            rows={data.recent_bookings}
            empty="No bookings yet"
            render={(b) => (
              <>
                <span className="truncate font-medium">{b.booking_number}</span>
                <span className="truncate text-xs text-muted-foreground">{b.service?.name}</span>
                <StatusBadge status={b.status} />
                <span className="text-sm font-medium">{formatMoney(num(b.total))}</span>
              </>
            )}
          />
        </SectionCard>

        <SectionCard title="Recent customers">
          <Rows
            rows={data.recent_customers}
            empty="No customers yet"
            render={(c) => (
              <>
                <span className="truncate font-medium">{c.full_name ?? "Guest"}</span>
                <span className="truncate text-xs text-muted-foreground">{c.phone ?? c.email}</span>
                <span className="text-xs text-muted-foreground">
                  {String(c.created_at).slice(0, 10)}
                </span>
              </>
            )}
          />
        </SectionCard>

        <SectionCard title="Recent reviews">
          <Rows
            rows={data.recent_reviews}
            empty="No reviews yet"
            render={(r) => (
              <>
                <span className="font-medium">{"★".repeat(r.rating)}</span>
                <span className="truncate text-xs text-muted-foreground">{r.comment ?? "—"}</span>
                <span className="truncate text-xs text-muted-foreground">{r.service?.name}</span>
              </>
            )}
          />
        </SectionCard>
      </div>
    </>
  );
}

function Rows<T extends { id: string }>({
  rows,
  render,
  empty,
}: {
  rows: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (row: any) => React.ReactNode;
  empty: string;
}) {
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          {render(row)}
        </li>
      ))}
    </ul>
  );
}
