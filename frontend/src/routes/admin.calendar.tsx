import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getAdminBookings } from "@/frontend/lib/api-services";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { formatMoney, num } from "@/frontend/lib/money";
import { cn } from "@/frontend/lib/utils";

export const Route = createFileRoute("/admin/calendar")({ component: AdminCalendar });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function AdminCalendar() {
  const { data, isPending, isError } = useAdminQuery("bookings", getAdminBookings);
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(anchor);
        d.setDate(anchor.getDate() + i);
        return d;
      }),
    [anchor],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const b of (data ?? []) as Row[]) {
      if (!b.scheduled_date) continue;
      const list = map.get(b.scheduled_date) ?? [];
      list.push(b);
      map.set(b.scheduled_date, list);
    }
    for (const list of map.values())
      list.sort((a, b) => String(a.scheduled_start).localeCompare(String(b.scheduled_start)));
    return map;
  }, [data]);

  if (isError) return <ErrorState />;

  const today = iso(new Date());
  const weekCount = days.reduce((n, d) => n + (byDay.get(iso(d))?.length ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Calendar"
        description={`${weekCount} bookings this week`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchor((a) => new Date(a.getTime() - 7 * 864e5))}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAnchor(startOfWeek(new Date()))}>
              This week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchor((a) => new Date(a.getTime() + 7 * 864e5))}
            >
              Next
            </Button>
          </div>
        }
      />

      {isPending ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => {
            const key = iso(d);
            const list = byDay.get(key) ?? [];
            return (
              <Card key={key} className={cn("p-3", key === today && "border-primary")}>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className="mb-2 text-lg font-semibold">{d.getDate()}</p>
                {list.length ? (
                  <ul className="space-y-2">
                    {list.map((b) => (
                      <li key={b.id} className="rounded-md bg-muted/60 p-2 text-xs">
                        <p className="font-medium">{String(b.scheduled_start ?? "").slice(0, 5)}</p>
                        <p className="truncate">{b.service?.name}</p>
                        <p className="truncate text-muted-foreground">
                          {b.professionals?.full_name ?? "Unassigned"}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <StatusBadge status={b.status} />
                          <span>{formatMoney(num(b.total))}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No bookings</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!isPending && weekCount === 0 && (
        <div className="mt-4">
          <EmptyState title="Nothing scheduled this week" />
        </div>
      )}
    </>
  );
}
