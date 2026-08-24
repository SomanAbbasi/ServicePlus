import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarCheck, CheckCircle2, XCircle, Wallet, Download } from "lucide-react";
import { getAdminReports } from "@/frontend/lib/api-services";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SectionCard,
  StatsCard,
  TableSkeleton,
  downloadCsv,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminReports() {
  const { data, isPending, isError } = useAdminQuery("reports", getAdminReports);
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10),
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const report = useMemo(() => {
    if (!data) return null;
    const names = {
      service: new Map((data.services as Row[]).map((s) => [s.id, s.name])),
      city: new Map((data.cities as Row[]).map((c) => [c.id, c.name])),
      pro: new Map((data.professionals as Row[]).map((p) => [p.id, p.full_name])),
    };
    const bookings = (data.bookings as Row[]).filter((b) => {
      const d = String(b.created_at).slice(0, 10);
      return d >= from && d <= to;
    });

    const group = (
      key: "service_id" | "city_id" | "professional_id",
      lookup: Map<string, string>,
    ) => {
      const map = new Map<string, { name: string; bookings: number; revenue: number }>();
      for (const b of bookings) {
        const id = b[key];
        if (!id) continue;
        const entry = map.get(id) ?? { name: lookup.get(id) ?? "—", bookings: 0, revenue: 0 };
        entry.bookings += 1;
        if (b.status === "COMPLETED") entry.revenue += num(b.total);
        map.set(id, entry);
      }
      return [...map.values()].sort((a, b) => b.revenue - a.revenue);
    };

    const completed = bookings.filter((b) => b.status === "COMPLETED");
    const revenue = completed.reduce((s, b) => s + num(b.total), 0);

    return {
      bookings,
      revenue,
      completed: completed.length,
      cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
      customers: new Set(bookings.map((b) => b.user_id).filter(Boolean)).size,
      byService: group("service_id", names.service),
      byCity: group("city_id", names.city),
      byPro: group("professional_id", names.pro),
    };
  }, [data, from, to]);

  if (isError) return <ErrorState />;
  if (isPending || !report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive volume, completion rate, and revenue performance analytics"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Reports" }]}
        actions={
          <Button
            onClick={() => downloadCsv("report-services.csv", report.byService)}
            className="h-10 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
          >
            <Download className="size-4 me-1.5" /> Export Service Report
          </Button>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <span className="text-xs font-bold text-slate-700">Filter Range:</span>
        <div className="w-44">
          <AdminDateInput
            placeholder="Start Date"
            value={from}
            onChange={setFrom}
            className="h-9"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400">to</span>
        <div className="w-44">
          <AdminDateInput
            placeholder="End Date"
            value={to}
            onChange={setTo}
            className="h-9"
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="TOTAL BOOKINGS"
          value={report.bookings.length}
          icon={CalendarCheck}
          accent="teal"
        />
        <StatsCard
          label="COMPLETED JOBS"
          value={report.completed}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatsCard
          label="CANCELLED JOBS"
          value={report.cancelled}
          icon={XCircle}
          accent="rose"
        />
        <StatsCard
          label="TOTAL REVENUE"
          value={formatMoney(report.revenue)}
          icon={Wallet}
          accent="primary"
        />
      </div>

      <SectionCard title="Revenue by Service (Top 10)" className="mt-4">
        {report.byService.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.byService.slice(0, 10)}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval={0}
                  angle={-15}
                  height={60}
                  textAnchor="end"
                />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={60} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="revenue" fill="#00B4D8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No bookings in this range" />
        )}
      </SectionCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top Cities by Revenue">
          <Ranking rows={report.byCity} />
        </SectionCard>
        <SectionCard title="Top Professionals by Revenue">
          <Ranking rows={report.byPro} />
        </SectionCard>
      </div>
    </div>
  );
}

function Ranking({ rows }: { rows: { name: string; bookings: number; revenue: number }[] }) {
  if (!rows.length) return <EmptyState title="No data yet" />;
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {rows.slice(0, 8).map((r) => (
        <li key={r.name} className="flex items-center justify-between py-2.5">
          <span className="truncate font-semibold text-slate-900">{r.name}</span>
          <span className="text-xs text-slate-500 font-medium">{r.bookings} bookings</span>
          <span className="font-extrabold text-slate-900">{formatMoney(r.revenue)}</span>
        </li>
      ))}
    </ul>
  );
}
