import { createFileRoute } from "@tanstack/react-router";
import { getAdminRefunds } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { ErrorState, PageHeader, StatsCard, StatusBadge } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/refunds")({ component: AdminRefunds });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminRefunds() {
  const { data, isPending, isError } = useAdminQuery("refunds", getAdminRefunds);
  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Refunds" description={`${rows.length} refund requests`} />
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <StatsCard
          label="Refunded"
          value={formatMoney(rows.reduce((s, r) => s + num(r.amount), 0))}
        />
        <StatsCard label="Requests" value={rows.length} />
      </div>
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="refunds.csv"
        searchPlaceholder="Search booking"
        searchKeys={(r) => [r.bookings?.booking_number, r.reason]}
        empty="No refunds yet"
        columns={[
          {
            key: "booking",
            header: "Booking",
            cell: (r) => <span className="font-medium">{r.bookings?.booking_number ?? "—"}</span>,
            csv: (r) => r.bookings?.booking_number ?? "",
          },
          {
            key: "amount",
            header: "Amount",
            cell: (r) => formatMoney(num(r.amount)),
            csv: (r) => r.amount,
          },
          {
            key: "reason",
            header: "Reason",
            cell: (r) => r.reason ?? "—",
            csv: (r) => r.reason ?? "",
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <StatusBadge status={r.status} />,
            csv: (r) => r.status,
          },
          {
            key: "date",
            header: "Date",
            cell: (r) => new Date(r.created_at).toLocaleString(),
            csv: (r) => r.created_at,
          },
        ]}
      />
    </>
  );
}
