import { createFileRoute } from "@tanstack/react-router";
import { getAdminAuditLogs } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { ErrorState, PageHeader } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";

export const Route = createFileRoute("/admin/audit-logs")({ component: AdminAuditLogs });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminAuditLogs() {
  const { data, isPending, isError } = useAdminQuery("audit-logs", getAdminAuditLogs);
  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Audit logs" description="Every administrative change, newest first" />
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="audit-logs.csv"
        searchPlaceholder="Search action, entity or actor"
        searchKeys={(r) => [r.action, r.entity, r.actor_label, r.entity_id]}
        empty="No activity recorded yet"
        columns={[
          {
            key: "action",
            header: "Action",
            cell: (r) => <span className="font-medium">{r.action}</span>,
            csv: (r) => r.action,
          },
          { key: "entity", header: "Entity", cell: (r) => r.entity, csv: (r) => r.entity },
          {
            key: "entity_id",
            header: "Record",
            cell: (r) => r.entity_id ?? "—",
            csv: (r) => r.entity_id ?? "",
          },
          {
            key: "actor",
            header: "Actor",
            cell: (r) => r.actor_label ?? "system",
            csv: (r) => r.actor_label ?? "",
          },
          {
            key: "date",
            header: "When",
            cell: (r) => new Date(r.created_at).toLocaleString(),
            csv: (r) => r.created_at,
          },
        ]}
      />
    </>
  );
}
