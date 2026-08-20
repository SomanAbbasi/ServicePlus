import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { Input } from "@/frontend/components/ui/input";
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
      <>
        <PageHeader title="Reports" />
        <TableSkeleton rows={8} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Performance by service, city and professional"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv("report-services.csv", report.byService)}
          >
            Export CSV
          </Button>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-auto"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Bookings" value={report.bookings.length} />
        <StatsCard label="Completed" value={report.completed} />
        <StatsCard label="Cancelled" value={report.cancelled} />
        <StatsCard label="Revenue" value={formatMoney(report.revenue)} />
      </div>

      <SectionCard title="Revenue by service" className="mt-4">
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
                <Bar dataKey="revenue" fill="#12B8E8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No bookings in this range" />
        )}
      </SectionCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top cities">
          <Ranking rows={report.byCity} />
        </SectionCard>
        <SectionCard title="Top professionals">
          <Ranking rows={report.byPro} />
        </SectionCard>
      </div>
    </>
  );
}

function Ranking({ rows }: { rows: { name: string; bookings: number; revenue: number }[] }) {
  if (!rows.length) return <EmptyState title="No data yet" />;
  return (
    <ul className="divide-y divide-border text-sm">
      {rows.slice(0, 8).map((r) => (
        <li key={r.name} className="flex items-center justify-between py-2">
          <span className="truncate font-medium">{r.name}</span>
          <span className="text-muted-foreground">{r.bookings} bookings</span>
          <span>{formatMoney(r.revenue)}</span>
        </li>
      ))}
    </ul>
  );
}
