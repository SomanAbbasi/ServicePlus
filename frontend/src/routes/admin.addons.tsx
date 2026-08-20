import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAddon,
  deleteAddon,
  getAdminAddons,
  getAdminCatalog,
  setAddonService,
  updateAddon,
} from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { DataTable } from "@/frontend/components/admin/data-table";
import { EntityForm, type FieldDef } from "@/frontend/components/admin/EntityForm";
import { FilterSelect } from "@/frontend/components/admin/filters";
import { ErrorState, PageHeader, StatusBadge } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { Switch } from "@/frontend/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/addons")({ component: AdminAddons });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const BLANK = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  price: 0,
  original_price: "",
  min_quantity: 1,
  max_quantity: 5,
  duration_minutes: 30,
  sort_order: 0,
  is_active: true,
};

const FIELDS: FieldDef[] = [
  { name: "name", label: "Name", half: true },
  { name: "slug", label: "Slug", half: true, hint: "Leave blank to generate from the name" },
  { name: "image_url", label: "Image", type: "image" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "price", label: "Price (AED)", type: "number", half: true },
  { name: "original_price", label: "Original price", type: "number", half: true },
  { name: "min_quantity", label: "Min quantity", type: "number", half: true },
  { name: "max_quantity", label: "Max quantity", type: "number", half: true },
  { name: "duration_minutes", label: "Duration (min)", type: "number", half: true },
  { name: "sort_order", label: "Sort order", type: "number", half: true },
  { name: "is_active", label: "Active", type: "switch", half: true },
];

function AdminAddons() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("addons", getAdminAddons);
  const catalog = useAdminQuery("catalog", getAdminCatalog);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any>(null);
  const [linking, setLinking] = useState<Row | null>(null);
  const [formServices, setFormServices] = useState<string[]>([]);
  const [fService, setFService] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin"] });

  const mutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (vars: any) => {
      const { serviceIds, previousServiceIds, ...payload } = vars as {
        serviceIds: string[];
        previousServiceIds: string[];
        id?: string;
      };
      let addonId = payload.id;
      if (addonId) await updateAddon(payload);
      else addonId = (await createAddon(payload)).id;

      const next = new Set(serviceIds ?? []);
      const prev = new Set(previousServiceIds ?? []);
      const toAdd = [...next].filter((id) => !prev.has(id));
      const toRemove = [...prev].filter((id) => !next.has(id));
      for (const serviceId of toAdd)
        await setAddonService({ addon_id: addonId!, service_id: serviceId, linked: true });
      for (const serviceId of toRemove)
        await setAddonService({ addon_id: addonId!, service_id: serviceId, linked: false });
    },
    onSuccess: () => {
      toast.success("Add-on saved");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteAddon(id),
    onSuccess: () => {
      toast.success("Add-on deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linkMutation = useMutation({
    mutationFn: (vars: { addon_id: string; service_id: string; linked: boolean }) =>
      setAddonService(vars),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const addons = (data?.addons ?? []) as Row[];
  const links = (data?.links ?? []) as Row[];
  const services = (catalog.data?.services ?? []) as Row[];
  const categories = (catalog.data?.categories ?? []) as Row[];
  const linkedServiceIds = (addonId: string) =>
    links.filter((l) => l.addon_id === addonId).map((l) => l.service_id as string);

  const openEditor = (row: Row | null) => {
    setFormServices(row?.id ? linkedServiceIds(row.id) : []);
    setEditing(row ? { ...BLANK, ...row, original_price: row.original_price ?? "" } : { ...BLANK });
  };

  const filteredAddons = addons.filter(
    (a) =>
      (fStatus === "all" || (fStatus === "active" ? a.is_active : !a.is_active)) &&
      (fService === "all" || links.some((l) => l.addon_id === a.id && l.service_id === fService)),
  );
  const filtersOn = fStatus !== "all" || fService !== "all";

  return (
    <>
      <PageHeader
        title="Add-ons"
        description={
          filtersOn
            ? `${filteredAddons.length} of ${addons.length} add-ons`
            : `${addons.length} add-ons available at checkout`
        }
        actions={<Button onClick={() => openEditor(null)}>Add add-on</Button>}
      />
      <DataTable<Row>
        rows={filteredAddons}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Service"
              value={fService}
              onChange={setFService}
              options={[
                { value: "all", label: "All services" },
                ...services.map((s) => ({ value: s.id as string, label: s.name as string })),
              ]}
            />
            <FilterSelect
              label="Status"
              value={fStatus}
              onChange={setFStatus}
              options={[
                { value: "all", label: "Any status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
            {filtersOn ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFService("all");
                  setFStatus("all");
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        }
        loading={isPending}
        csvName="addons.csv"
        searchPlaceholder="Search add-on"
        searchKeys={(r) => [r.name, r.slug]}
        columns={[
          {
            key: "name",
            header: "Add-on",
            cell: (r) => (
              <div className="flex items-center gap-2">
                {r.image_url ? (
                  <img src={resolveImageUrl(r.image_url)} alt="" className="size-8 rounded-md object-cover" />
                ) : (
                  <div className="size-8 rounded-md bg-muted" />
                )}
                <span className="font-medium">{r.name}</span>
              </div>
            ),
            csv: (r) => r.name,
          },
          {
            key: "price",
            header: "Price",
            cell: (r) => formatMoney(num(r.price)),
            csv: (r) => r.price,
          },
          {
            key: "qty",
            header: "Quantity",
            cell: (r) => `${r.min_quantity}–${r.max_quantity}`,
            csv: (r) => `${r.min_quantity}-${r.max_quantity}`,
          },
          {
            key: "duration",
            header: "Duration",
            cell: (r) => `${r.duration_minutes} min`,
            csv: (r) => r.duration_minutes,
          },
          {
            key: "services",
            header: "Services",
            cell: (r) => links.filter((l) => l.addon_id === r.id).length,
            csv: (r) => links.filter((l) => l.addon_id === r.id).length,
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
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => mutation.mutate({ id: r.id, is_active: !r.is_active })}
                >
                  {r.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLinking(r)}>
                  Services
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEditor(r)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${r.name}"?`)) del.mutate(r.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      <EntityForm
        open={Boolean(editing)}
        title={editing?.id ? "Edit add-on" : "Add add-on"}
        fields={FIELDS}
        initial={editing ?? BLANK}
        saving={mutation.isPending}
        onClose={() => setEditing(null)}
        extra={
          <ServicePicker
            services={services}
            categories={categories}
            selected={formServices}
            onChange={setFormServices}
          />
        }
        onSubmit={(v) =>
          mutation.mutate({
            ...v,
            price: Number(v.price) || 0,
            original_price: v.original_price === "" ? null : Number(v.original_price),
            min_quantity: Number(v.min_quantity) || 1,
            max_quantity: Number(v.max_quantity) || 1,
            duration_minutes: Number(v.duration_minutes) || 0,
            sort_order: Number(v.sort_order) || 0,
            serviceIds: formServices,
            previousServiceIds: v.id ? linkedServiceIds(v.id) : [],
          })
        }
      />

      <Sheet open={Boolean(linking)} onOpenChange={(o) => !o && setLinking(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{linking?.name} — offered with</SheetTitle>
          </SheetHeader>
          {linking ? (
            <div className="mt-4 space-y-3">
              {services.map((s) => {
                const linked = links.some(
                  (l) => l.addon_id === linking.id && l.service_id === s.id,
                );
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{s.name}</span>
                    <Switch
                      checked={linked}
                      onCheckedChange={(v) =>
                        linkMutation.mutate({ addon_id: linking.id, service_id: s.id, linked: v })
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Searchable, category-grouped picker for the services an add-on is offered with. */
function ServicePicker({
  services,
  categories,
  selected,
  onChange,
}: {
  services: Row[];
  categories: Row[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [term, setTerm] = useState("");
  const t = term.trim().toLowerCase();
  const matches = services.filter((s) => !t || String(s.name).toLowerCase().includes(t));
  const groups = categories
    .map((c) => ({ cat: c, items: matches.filter((s) => s.category_id === c.id) }))
    .filter((g) => g.items.length);
  const grouped = new Set(groups.flatMap((g) => g.items.map((s) => s.id as string)));
  const rest = matches.filter((s) => !grouped.has(s.id as string));
  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...new Set([...selected, id])] : selected.filter((x) => x !== id));

  const row = (s: Row) => (
    <label key={s.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
      <input
        type="checkbox"
        className="size-4 accent-[hsl(var(--primary))]"
        checked={selected.includes(s.id)}
        onChange={(e) => toggle(s.id, e.target.checked)}
      />
      <span className="truncate">{s.name}</span>
    </label>
  );

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Shown for these services</p>
        <span className="text-xs text-muted-foreground">{selected.length} selected</span>
      </div>
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Filter services"
        className="mt-2 h-9"
      />
      <div className="mt-2 max-h-64 overflow-y-auto pe-1">
        {groups.map((g) => (
          <div key={g.cat.id} className="mb-2">
            <p className="text-xs font-semibold text-muted-foreground">{g.cat.name}</p>
            {g.items.map(row)}
          </div>
        ))}
        {rest.length ? (
          <div className="mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Other</p>
            {rest.map(row)}
          </div>
        ) : null}
        {!matches.length ? (
          <p className="py-2 text-sm text-muted-foreground">No services match.</p>
        ) : null}
      </div>
    </div>
  );
}
