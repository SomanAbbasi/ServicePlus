import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminCoupons, setCouponActive, upsertCoupon } from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import { ErrorState, PageHeader, StatusBadge } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/coupons/")({ component: AdminCoupons });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminCoupons() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("coupons", getAdminCoupons);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  const saveMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (vars: any) => upsertCoupon(vars as any),
    onSuccess: () => {
      toast.success("Coupon saved");
      setEditing(null);
      setCreating(false);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean }) =>
      setCouponActive(vars.id, vars.is_active),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];
  const open = creating || Boolean(editing);

  return (
    <>
      <PageHeader
        title="Coupons"
        description={`${rows.length} discount codes`}
        actions={
          <Link to="/admin/coupons/create">
            <Button>New coupon</Button>
          </Link>
        }
      />
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="coupons.csv"
        searchPlaceholder="Search code"
        searchKeys={(r) => [r.code, r.description]}
        columns={[
          {
            key: "code",
            header: "Code",
            cell: (r) => <span className="font-medium">{r.code}</span>,
            csv: (r) => r.code,
          },
          {
            key: "value",
            header: "Discount",
            cell: (r) =>
              r.discount_type === "percentage"
                ? `${num(r.discount_value)}%`
                : formatMoney(num(r.discount_value)),
            csv: (r) => `${r.discount_value} ${r.discount_type}`,
          },
          {
            key: "min",
            header: "Min spend",
            cell: (r) => formatMoney(num(r.min_amount)),
            csv: (r) => r.min_amount,
          },
          {
            key: "used",
            header: "Redemptions",
            cell: (r) =>
              `${r.redemption_count}${r.max_redemptions ? ` / ${r.max_redemptions}` : ""}`,
            csv: (r) => r.redemption_count,
          },
          {
            key: "expires",
            header: "Expires",
            cell: (r) => (r.expires_at ? String(r.expires_at).slice(0, 10) : "—"),
            csv: (r) => r.expires_at ?? "",
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
                  onClick={() => toggleMutation.mutate({ id: r.id, is_active: !r.is_active })}
                >
                  {r.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                  Edit
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Sheet
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setCreating(false);
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit coupon" : "New coupon"}</SheetTitle>
          </SheetHeader>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              saveMutation.mutate({
                ...(editing ? { id: editing.id } : {}),
                code: String(f.get("code")),
                description: String(f.get("description")),
                discount_type: String(f.get("discount_type")),
                discount_value: Number(f.get("discount_value")),
                min_amount: Number(f.get("min_amount")) || 0,
                max_discount: Number(f.get("max_discount")) || null,
                max_redemptions: Number(f.get("max_redemptions")) || null,
                per_user_limit: Number(f.get("per_user_limit")) || 1,
                first_booking_only: f.get("first_booking_only") === "on",
                expires_at: String(f.get("expires_at")) || null,
              });
            }}
          >
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" required defaultValue={editing?.code ?? ""} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="discount_type">Type</Label>
                <select
                  id="discount_type"
                  name="discount_type"
                  defaultValue={editing?.discount_type ?? "percentage"}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div>
                <Label htmlFor="discount_value">Value</Label>
                <Input
                  id="discount_value"
                  name="discount_value"
                  type="number"
                  step="any"
                  required
                  defaultValue={editing?.discount_value ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="min_amount">Min spend</Label>
                <Input
                  id="min_amount"
                  name="min_amount"
                  type="number"
                  step="any"
                  defaultValue={editing?.min_amount ?? 0}
                />
              </div>
              <div>
                <Label htmlFor="max_discount">Max discount</Label>
                <Input
                  id="max_discount"
                  name="max_discount"
                  type="number"
                  step="any"
                  defaultValue={editing?.max_discount ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="max_redemptions">Max redemptions</Label>
                <Input
                  id="max_redemptions"
                  name="max_redemptions"
                  type="number"
                  defaultValue={editing?.max_redemptions ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="per_user_limit">Per user limit</Label>
                <Input
                  id="per_user_limit"
                  name="per_user_limit"
                  type="number"
                  defaultValue={editing?.per_user_limit ?? 1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="expires_at">Expires at</Label>
              <Input
                id="expires_at"
                name="expires_at"
                type="date"
                defaultValue={editing?.expires_at ? String(editing.expires_at).slice(0, 10) : ""}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="first_booking_only"
                defaultChecked={editing?.first_booking_only ?? false}
              />
              First booking only
            </label>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              Save coupon
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
