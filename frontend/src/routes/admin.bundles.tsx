import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addBundleItem,
  createBundle,
  deleteBundle,
  deleteBundleItem,
  getAdminBundles,
  updateBundle,
} from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { EntityForm, type FieldDef } from "@/frontend/components/admin/EntityForm";
import { ErrorState, PageHeader, StatusBadge } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/bundles")({ component: AdminBundles });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const BLANK = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  price: 0,
  original_price: "",
  purchase_limit: 1,
  is_active: true,
};

const FIELDS: FieldDef[] = [
  { name: "name", label: "Name", half: true },
  { name: "slug", label: "Slug", half: true, hint: "Leave blank to generate from the name" },
  { name: "image_url", label: "Image", type: "image" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "price", label: "Price (AED)", type: "number", half: true },
  { name: "original_price", label: "Original price", type: "number", half: true },
  { name: "purchase_limit", label: "Purchase limit", type: "number", half: true },
  { name: "is_active", label: "Active", type: "switch", half: true },
];

function AdminBundles() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("bundles", getAdminBundles);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any>(null);
  const [itemsFor, setItemsFor] = useState<Row | null>(null);
  const [label, setLabel] = useState("");
  const [qty, setQty] = useState(1);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin"] });

  const mutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (vars: any) => {
      if (vars.id) await updateBundle(vars);
      else await createBundle(vars);
    },
    onSuccess: () => {
      toast.success("Bundle saved");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteBundle(id),
    onSuccess: () => {
      toast.success("Bundle deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const itemMutation = useMutation({
    mutationFn: async (vars: {
      add?: { bundle_id: string; label: string; quantity: number };
      removeId?: string;
    }) => {
      if (vars.add) await addBundleItem(vars.add);
      if (vars.removeId) await deleteBundleItem(vars.removeId);
    },
    onSuccess: () => {
      setLabel("");
      setQty(1);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];
  const current = itemsFor ? rows.find((r) => r.id === itemsFor.id) : null;

  return (
    <>
      <PageHeader
        title="Bundles"
        description={`${rows.length} packages`}
        actions={<Button onClick={() => setEditing({ ...BLANK })}>Add bundle</Button>}
      />
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="bundles.csv"
        searchPlaceholder="Search bundle"
        searchKeys={(r) => [r.name, r.slug]}
        columns={[
          {
            key: "name",
            header: "Bundle",
            cell: (r) => <span className="font-medium">{r.name}</span>,
            csv: (r) => r.name,
          },
          {
            key: "items",
            header: "Items",
            cell: (r) =>
              (r.bundle_items ?? []).map((i: Row) => `${i.label} ×${i.quantity}`).join(", ") || "—",
            csv: (r) => (r.bundle_items ?? []).length,
          },
          {
            key: "price",
            header: "Price",
            cell: (r) => formatMoney(num(r.price)),
            csv: (r) => r.price,
          },
          {
            key: "limit",
            header: "Purchase limit",
            cell: (r) => r.purchase_limit,
            csv: (r) => r.purchase_limit,
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
                <Button variant="ghost" size="sm" onClick={() => setItemsFor(r)}>
                  Items
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditing({ ...BLANK, ...r, original_price: r.original_price ?? "" })
                  }
                >
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
        title={editing?.id ? "Edit bundle" : "Add bundle"}
        fields={FIELDS}
        initial={editing ?? BLANK}
        saving={mutation.isPending}
        onClose={() => setEditing(null)}
        onSubmit={(v) =>
          mutation.mutate({
            ...v,
            price: Number(v.price) || 0,
            original_price: v.original_price === "" ? null : Number(v.original_price),
            purchase_limit: Number(v.purchase_limit) || 1,
          })
        }
      />

      <Sheet open={Boolean(itemsFor)} onOpenChange={(o) => !o && setItemsFor(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{itemsFor?.name} — items</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {(current?.bundle_items ?? []).map((i: Row) => (
              <div key={i.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {i.label} <span className="text-muted-foreground">×{i.quantity}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => itemMutation.mutate({ removeId: i.id })}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex items-end gap-2 border-t border-border pt-3">
              <Input
                placeholder="Item label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Input
                type="number"
                className="w-20"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || 1)}
              />
              <Button
                disabled={!label || !itemsFor}
                onClick={() =>
                  itemMutation.mutate({ add: { bundle_id: itemsFor!.id, label, quantity: qty } })
                }
              >
                Add
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
