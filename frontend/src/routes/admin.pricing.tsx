import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminCatalog, updateService } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { ErrorState, PageHeader, SectionCard } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Input } from "@/frontend/components/ui/input";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/pricing")({ component: AdminPricing });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminPricing() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("catalog", getAdminCatalog);
  const mutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (vars: any) => updateService(vars),
    onSuccess: () => {
      toast.success("Pricing updated");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const services = (data?.services ?? []) as Row[];

  const priceCell = (r: Row, field: string) => (
    <Input
      type="number"
      step="any"
      className="h-8 w-28"
      defaultValue={r[field] ?? ""}
      onBlur={(e) => {
        const value = Number(e.target.value);
        if (value !== Number(r[field] ?? 0)) mutation.mutate({ id: r.id, [field]: value });
      }}
    />
  );

  return (
    <>
      <PageHeader
        title="Pricing"
        description="Edit base rates inline — changes save when you leave a field."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SectionCard title="Recurring discounts">
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Every 2 weeks — 5% off</li>
            <li>Once a week — 10% off</li>
            <li>Multiple times a week — up to 25% off</li>
          </ul>
        </SectionCard>
        <SectionCard title="Extra professional">
          <p className="text-sm text-muted-foreground">
            Each service carries its own extra-professional percentage, applied on top of the base
            rate.
          </p>
        </SectionCard>
        <SectionCard title="City surcharge">
          <p className="text-sm text-muted-foreground">
            Managed per city under Locations and applied to the subtotal at checkout.
          </p>
        </SectionCard>
      </div>

      <DataTable<Row>
        rows={services}
        loading={isPending}
        csvName="pricing.csv"
        searchPlaceholder="Search service"
        searchKeys={(r) => [r.name, r.slug]}
        columns={[
          {
            key: "name",
            header: "Service",
            cell: (r) => <span className="font-medium">{r.name}</span>,
            csv: (r) => r.name,
          },
          { key: "type", header: "Type", cell: (r) => r.booking_type, csv: (r) => r.booking_type },
          {
            key: "base",
            header: "Base price",
            cell: (r) => priceCell(r, "base_price"),
            csv: (r) => r.base_price,
          },
          {
            key: "hourly",
            header: "Hourly rate",
            cell: (r) => priceCell(r, "hourly_rate"),
            csv: (r) => r.hourly_rate ?? "",
          },
          {
            key: "materials",
            header: "Materials",
            cell: (r) => priceCell(r, "materials_price"),
            csv: (r) => r.materials_price,
          },
          {
            key: "original",
            header: "Was",
            cell: (r) => (r.original_price ? formatMoney(num(r.original_price)) : "—"),
            csv: (r) => r.original_price ?? "",
          },
        ]}
      />
    </>
  );
}
