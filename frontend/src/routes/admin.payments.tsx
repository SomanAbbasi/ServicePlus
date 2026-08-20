import { createFileRoute } from "@tanstack/react-router";
import { getAdminPayments } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { ErrorState, PageHeader, StatsCard, StatusBadge } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminPayments() {
  const { data, isPending, isError } = useAdminQuery("payments", getAdminPayments);
  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];
  const paid = rows.filter((r) => r.status === "PAID");
  const failed = rows.filter((r) => r.status === "FAILED");

  return (
    <>
      <PageHeader title="Payments" description={`${rows.length} transactions`} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Captured"
          value={formatMoney(paid.reduce((s, r) => s + num(r.amount), 0))}
        />
        <StatsCard label="Successful" value={paid.length} />
        <StatsCard label="Failed" value={failed.length} />
      </div>
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="payments.csv"
        searchPlaceholder="Search booking or reference"
        searchKeys={(r) => [r.bookings?.booking_number, r.provider_reference, r.method]}
        empty="No payments recorded"
        columns={[
          {
            key: "booking",
            header: "Booking",
            cell: (r) => <span className="font-medium">{r.bookings?.booking_number ?? "—"}</span>,
            csv: (r) => r.bookings?.booking_number ?? "",
          },
          { key: "provider", header: "Provider", cell: (r) => r.provider, csv: (r) => r.provider },
          { key: "method", header: "Method", cell: (r) => r.method, csv: (r) => r.method },
          {
            key: "amount",
            header: "Amount",
            cell: (r) => formatMoney(num(r.amount)),
            csv: (r) => r.amount,
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
