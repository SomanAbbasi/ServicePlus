import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminCustomerDetail, getAdminCustomers } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import {
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminCustomers() {
  const { data, isPending, isError } = useAdminQuery("customers", getAdminCustomers);
  const [openId, setOpenId] = useState<string | null>(null);
  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Customers" description={`${rows.length} registered customers`} />
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="customers.csv"
        searchPlaceholder="Search name, phone or email"
        searchKeys={(r) => [r.full_name, r.phone, r.email]}
        columns={[
          {
            key: "name",
            header: "Customer",
            cell: (r) => <span className="font-medium">{r.full_name ?? "Unnamed"}</span>,
            csv: (r) => r.full_name ?? "",
          },
          { key: "phone", header: "Phone", cell: (r) => r.phone ?? "—", csv: (r) => r.phone ?? "" },
          { key: "email", header: "Email", cell: (r) => r.email ?? "—", csv: (r) => r.email ?? "" },
          { key: "bookings", header: "Bookings", cell: (r) => r.bookings, csv: (r) => r.bookings },
          {
            key: "spend",
            header: "Lifetime value",
            cell: (r) => formatMoney(num(r.spend)),
            csv: (r) => r.spend,
          },
          {
            key: "joined",
            header: "Joined",
            cell: (r) => String(r.created_at).slice(0, 10),
            csv: (r) => String(r.created_at).slice(0, 10),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
              <Button variant="ghost" size="sm" onClick={() => setOpenId(r.id)}>
                View
              </Button>
            ),
          },
        ]}
      />
      <CustomerDrawer id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function CustomerDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => getAdminCustomerDetail(id!),
    enabled: Boolean(id),
  });

  return (
    <Sheet open={Boolean(id)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{(data?.profile as Row)?.full_name ?? "Customer"}</SheetTitle>
        </SheetHeader>
        {isPending || !data ? (
          <div className="mt-4">
            <TableSkeleton rows={6} />
          </div>
        ) : (
          <div className="mt-4 space-y-6 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Phone" value={(data.profile as Row)?.phone ?? "—"} />
              <Info label="Email" value={(data.profile as Row)?.email ?? "—"} />
              <Info label="Language" value={(data.profile as Row)?.locale ?? "en"} />
              <Info
                label="Member since"
                value={String((data.profile as Row)?.created_at ?? "").slice(0, 10)}
              />
            </div>

            <Group title="Addresses">
              {data.addresses.length ? (
                data.addresses.map((a: Row) => (
                  <p key={a.id}>
                    <span className="font-medium">{a.label}</span> ·{" "}
                    {[a.building, a.unit, a.street].filter(Boolean).join(", ")}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">No saved addresses.</p>
              )}
            </Group>

            <Group title="Bookings">
              {data.bookings.length ? (
                data.bookings.map((b: Row) => (
                  <div key={b.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {b.booking_number} · {b.service?.name}
                    </span>
                    <StatusBadge status={b.status} />
                    <span>{formatMoney(num(b.total))}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No bookings yet.</p>
              )}
            </Group>

            <Group title="Reviews">
              {data.reviews.length ? (
                data.reviews.map((r: Row) => (
                  <p key={r.id}>
                    {"★".repeat(r.rating)} — {r.comment ?? "No comment"}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">No reviews.</p>
              )}
            </Group>

            <Group title="Support tickets">
              {data.tickets.length ? (
                data.tickets.map((t: Row) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <span>{t.subject}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No tickets.</p>
              )}
            </Group>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
