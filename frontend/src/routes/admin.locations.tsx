import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminLocations, updateCity } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import {
  ErrorState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";

export const Route = createFileRoute("/admin/locations")({ component: AdminLocations });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminLocations() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("locations", getAdminLocations);
  const mutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (vars: any) => updateCity(vars),
    onSuccess: () => {
      toast.success("City updated");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const cities = (data?.cities ?? []) as Row[];
  const countries = (data?.countries ?? []) as Row[];

  return (
    <>
      <PageHeader title="Locations" description="Service areas and city surcharges" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((c) => (
          <SectionCard key={c.id} title={c.name}>
            <p className="text-sm text-muted-foreground">
              {c.code} · {c.currency_code} ({c.currency_symbol}) · {c.dial_code}
            </p>
            <div className="mt-2">
              <StatusBadge status={c.is_active ? "ACTIVE" : "INACTIVE"} />
            </div>
          </SectionCard>
        ))}
      </div>

      <DataTable<Row>
        rows={cities}
        loading={isPending}
        csvName="cities.csv"
        searchPlaceholder="Search city"
        searchKeys={(r) => [r.name, r.slug]}
        columns={[
          {
            key: "name",
            header: "City",
            cell: (r) => <span className="font-medium">{r.name}</span>,
            csv: (r) => r.name,
          },
          { key: "slug", header: "Slug", cell: (r) => r.slug, csv: (r) => r.slug },
          {
            key: "surcharge",
            header: "Surcharge %",
            cell: (r) => (
              <Input
                type="number"
                step="any"
                defaultValue={r.surcharge_pct}
                className="h-8 w-24"
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value !== Number(r.surcharge_pct))
                    mutation.mutate({ id: r.id, surcharge_pct: value });
                }}
              />
            ),
            csv: (r) => r.surcharge_pct,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <StatusBadge status={r.is_active ? "ACTIVE" : "INACTIVE"} />,
            csv: (r) => (r.is_active ? "active" : "inactive"),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => mutation.mutate({ id: r.id, is_active: !r.is_active })}
              >
                {r.is_active ? "Disable" : "Enable"}
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
