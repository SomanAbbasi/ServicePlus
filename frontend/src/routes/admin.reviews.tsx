import { createFileRoute } from "@tanstack/react-router";
import { getAdminReviews } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { ErrorState, PageHeader, StatsCard } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviews });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminReviews() {
  const { data, isPending, isError } = useAdminQuery("reviews", getAdminReviews);
  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;

  return (
    <>
      <PageHeader title="Reviews" description={`${rows.length} customer reviews`} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatsCard label="Average rating" value={avg ? `${avg.toFixed(2)}★` : "—"} />
        <StatsCard label="5 star" value={rows.filter((r) => r.rating === 5).length} />
        <StatsCard label="Below 3 star" value={rows.filter((r) => r.rating < 3).length} />
      </div>
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="reviews.csv"
        searchPlaceholder="Search comment, service or professional"
        searchKeys={(r) => [
          r.comment,
          r.service?.name,
          r.professionals?.full_name,
          r.profile?.full_name,
        ]}
        empty="No reviews yet"
        columns={[
          {
            key: "rating",
            header: "Rating",
            cell: (r) => "★".repeat(r.rating),
            csv: (r) => r.rating,
          },
          {
            key: "service",
            header: "Service",
            cell: (r) => r.service?.name ?? "—",
            csv: (r) => r.service?.name ?? "",
          },
          {
            key: "pro",
            header: "Professional",
            cell: (r) => r.professionals?.full_name ?? "—",
            csv: (r) => r.professionals?.full_name ?? "",
          },
          {
            key: "customer",
            header: "Customer",
            cell: (r) => r.profile?.full_name ?? "—",
            csv: (r) => r.profile?.full_name ?? "",
          },
          {
            key: "comment",
            header: "Comment",
            cell: (r) => r.comment ?? "—",
            csv: (r) => r.comment ?? "",
          },
          {
            key: "date",
            header: "Date",
            cell: (r) => String(r.created_at).slice(0, 10),
            csv: (r) => r.created_at,
          },
        ]}
      />
    </>
  );
}
