import { createFileRoute } from "@tanstack/react-router";
import { getAdminNotifications } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { ErrorState, PageHeader, StatusBadge } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";

export const Route = createFileRoute("/admin/notifications")({ component: AdminNotifications });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminNotifications() {
  const { data, isPending, isError } = useAdminQuery("notifications", getAdminNotifications);
  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Notifications" description={`${rows.length} messages sent`} />
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="notifications.csv"
        searchPlaceholder="Search title or event"
        searchKeys={(r) => [r.title, r.event, r.channel]}
        empty="No notifications sent yet"
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (r) => <span className="font-medium">{r.title}</span>,
            csv: (r) => r.title,
          },
          { key: "event", header: "Event", cell: (r) => r.event, csv: (r) => r.event },
          { key: "channel", header: "Channel", cell: (r) => r.channel, csv: (r) => r.channel },
          { key: "body", header: "Body", cell: (r) => r.body ?? "—", csv: (r) => r.body ?? "" },
          {
            key: "read",
            header: "Status",
            cell: (r) => <StatusBadge status={r.is_read ? "READ" : "PENDING"} />,
            csv: (r) => (r.is_read ? "read" : "unread"),
          },
          {
            key: "date",
            header: "Sent",
            cell: (r) => new Date(r.created_at).toLocaleString(),
            csv: (r) => r.created_at,
          },
        ]}
      />
    </>
  );
}
