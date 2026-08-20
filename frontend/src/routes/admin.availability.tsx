import { createFileRoute } from "@tanstack/react-router";
import { getAdminAvailability } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { ErrorState, PageHeader, StatusBadge } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";

export const Route = createFileRoute("/admin/availability")({ component: AdminAvailability });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function AdminAvailability() {
  const { data, isPending, isError } = useAdminQuery("availability", getAdminAvailability);
  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Availability" description="Weekly working windows across the team" />
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="availability.csv"
        searchPlaceholder="Search professional"
        searchKeys={(r) => [r.professionals?.full_name, DAYS[r.day_of_week]]}
        empty="No availability windows configured"
        columns={[
          {
            key: "pro",
            header: "Professional",
            cell: (r) => <span className="font-medium">{r.professionals?.full_name ?? "—"}</span>,
            csv: (r) => r.professionals?.full_name ?? "",
          },
          {
            key: "day",
            header: "Day",
            cell: (r) => DAYS[r.day_of_week],
            csv: (r) => DAYS[r.day_of_week] ?? "",
          },
          {
            key: "window",
            header: "Window",
            cell: (r) => `${String(r.start_time).slice(0, 5)}–${String(r.end_time).slice(0, 5)}`,
            csv: (r) => `${r.start_time}-${r.end_time}`,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <StatusBadge status={r.is_available ? "AVAILABLE" : "OFFLINE"} />,
            csv: (r) => (r.is_available ? "available" : "unavailable"),
          },
        ]}
      />
    </>
  );
}
