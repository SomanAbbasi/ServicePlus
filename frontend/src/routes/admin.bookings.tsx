import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignProfessional,
  getAdminBookingDetail,
  getAdminBookings,
  getAdminProfessionals,
  setBookingStatus,
} from "@/frontend/lib/api-services";
import { ExternalLink, MapPin, Package, Sparkles } from "lucide-react";
import { resolveImageUrl } from "@/frontend/lib/api-client";
type BookingStatus = string;


import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { downloadCsv } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

const STATUSES: BookingStatus[] = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "ASSIGNING",
  "ASSIGNED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
  "PAYMENT_FAILED",
];

const ACTION_STATUSES: BookingStatus[] = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

const PAGE_SIZE = 20;

function AdminBookings() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("bookings", getAdminBookings);
  const { data: pros } = useAdminQuery("professionals", getAdminProfessionals);
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: BookingStatus }) =>
      setBookingStatus(vars.id, vars.status),
    onSuccess: () => {
      toast.success("Booking updated");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: (vars: { id: string; professional_id: string | null }) =>
      assignProfessional(vars.id, vars.professional_id),
    onSuccess: () => {
      toast.success("Professional assigned");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const list = (data ?? []) as unknown as AnyRow[];
    const t = term.trim().toLowerCase();
    return list.filter((b) => {
      if (status && b.status !== status) return false;
      if (date && b.scheduled_date !== date) return false;
      if (!t) return true;
      return [
        b.booking_number,
        b.service?.name,
        b.profile?.full_name,
        b.guest_phone,
        b.profile?.phone,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t));
    });
  }, [data, term, status, date]);

  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (isError) return <ErrorState />;

  return (
    <>
      <PageHeader
        title="Bookings"
        description={`${rows.length} bookings`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                "bookings.csv",
                rows.map((b) => ({
                  booking: b.booking_number,
                  service: b.service?.name ?? "",
                  customer: b.profile?.full_name ?? b.guest_phone ?? "",
                  date: b.scheduled_date ?? "",
                  status: b.status,
                  total: b.total,
                })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <Input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setPage(0);
          }}
          placeholder="Search booking, customer or service"
          className="w-full sm:w-64"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto"
        />
        {(term || status || date) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTerm("");
              setStatus("");
              setDate("");
            }}
          >
            Clear
          </Button>
        )}
      </Card>

      <Card className="p-2">
        {isPending ? (
          <TableSkeleton rows={8} />
        ) : rows.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Professional</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpenId(b.id)}>
                    <TableCell className="font-medium">{b.booking_number}</TableCell>
                    <TableCell>{b.profile?.full_name ?? b.guest_phone ?? "Guest"}</TableCell>
                    <TableCell>{b.service?.name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {b.scheduled_date ?? "—"} {String(b.scheduled_start ?? "").slice(0, 5)}
                    </TableCell>
                    <TableCell>{b.professionals?.full_name ?? "Unassigned"}</TableCell>
                    <TableCell>{formatMoney(num(b.total))}</TableCell>
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={b.status}
                        onChange={(e) =>
                          statusMutation.mutate({
                            id: b.id,
                            status: e.target.value as BookingStatus,
                          })
                        }
                        className="h-8 rounded-md border border-input bg-transparent px-1 text-xs"
                      >
                        {Array.from(new Set([b.status, ...ACTION_STATUSES])).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-3 text-sm text-muted-foreground">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of{" "}
                {rows.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * PAGE_SIZE >= rows.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="No bookings match these filters" />
        )}
      </Card>

      <BookingDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        professionals={(pros ?? []) as unknown as AnyRow[]}
        onAssign={(id, professional_id) => assignMutation.mutate({ id, professional_id })}
      />
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

function BookingDrawer({
  id,
  onClose,
  professionals,
  onAssign,
}: {
  id: string | null;
  onClose: () => void;
  professionals: AnyRow[];
  onAssign: (id: string, professionalId: string | null) => void;
}) {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "booking", id],
    queryFn: () => getAdminBookingDetail(id!),
    enabled: Boolean(id),
  });

  const booking = data?.booking as AnyRow;
  const addr = booking?.address || booking?.addresses;
  const cityObj = booking?.city || booking?.cities;
  const lat = addr?.latitude;
  const lng = addr?.longitude;
  const addressParts = [
    addr?.building,
    addr?.unit ? `Unit ${addr.unit}` : null,
    addr?.street,
    cityObj?.name,
  ].filter(Boolean);
  const formattedAddress = addressParts.join(", ");
  const googleMapsUrl =
    lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((formattedAddress || "Dubai") + ", Dubai")}`;

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{booking?.booking_number ?? "Booking"}</SheetTitle>
        </SheetHeader>
        {isPending || !booking || !data ? (
          <div className="mt-4">
            <TableSkeleton rows={6} />
          </div>
        ) : (
          <div className="mt-4 space-y-5 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.status} />
              <StatusBadge status={booking.payment_status} />
            </div>

            <Field
              label="Customer"
              value={booking.profile?.full_name ?? booking.guest_phone ?? "Guest"}
            />
            <Field label="Phone" value={booking.profile?.phone ?? booking.guest_phone ?? "—"} />
            <Field label="Service" value={booking.service?.name ?? "—"} />
            <Field
              label="Schedule"
              value={`${booking.scheduled_date ?? "—"} ${String(booking.scheduled_start ?? "").slice(0, 5)}–${String(booking.scheduled_end ?? "").slice(0, 5)}`}
            />

            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Address
              </p>
              {formattedAddress ? (
                <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{formattedAddress}</p>
                      {addr?.label ? (
                        <p className="text-xs text-muted-foreground">Label: {addr.label}</p>
                      ) : null}
                    </div>
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <ExternalLink className="size-3.5" />
                    Google Maps
                  </a>
                </div>
              ) : (
                <p className="mt-0.5 text-muted-foreground">—</p>
              )}
            </div>

            <Field label="City" value={cityObj?.name ?? "Dubai"} />
            <Field label="Notes" value={booking.instructions ?? "—"} />

            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Professional
              </p>
              <select
                value={booking.professional_id ?? ""}
                onChange={(e) => onAssign(booking.id, e.target.value || null)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="">Unassigned</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} · {p.rating}★ · {p.cities?.name ?? "—"}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Pricing
              </p>
              <Line label="Subtotal" value={num(booking.subtotal)} />
              <Line label="Add-ons" value={num(booking.addons_total)} />
              <Line label="Materials" value={num(booking.materials_total)} />
              <Line label="Discount" value={-num(booking.discount)} />
              <Line label="Fees" value={num(booking.fees)} />
              <Line label="VAT" value={num(booking.tax)} />
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span>{formatMoney(num(booking.total))}</span>
              </div>
            </div>

            {data.items?.length || data.addons?.length ? (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Booked Services & Add-ons
                </p>
                <div className="space-y-2">
                  {data.items?.map((i: AnyRow) => {
                    const imgRaw =
                      i.variant?.imageUrl ||
                      i.variant?.image_url ||
                      booking.service?.imageUrl ||
                      booking.service?.image_url;
                    const img = imgRaw ? resolveImageUrl(imgRaw) : null;
                    return (
                      <div
                        key={i.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img
                              src={img}
                              alt={i.label}
                              className="size-11 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <Package className="size-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{i.label}</p>
                            <p className="text-xs text-muted-foreground">Quantity: {i.quantity}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatMoney(num(i.unit_price) * i.quantity)}
                        </span>
                      </div>
                    );
                  })}
                  {data.addons?.map((a: AnyRow) => {
                    const imgRaw = a.addon?.imageUrl || a.addon?.image_url;
                    const img = imgRaw ? resolveImageUrl(imgRaw) : null;
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img
                              src={img}
                              alt={a.label}
                              className="size-11 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <Sparkles className="size-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{a.label}</p>
                            <p className="text-xs text-muted-foreground">Add-on × {a.quantity}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatMoney(num(a.unit_price) * a.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Timeline
              </p>
              {data.history.length ? (
                <ol className="relative space-y-3 border-s border-border ps-4">
                  {data.history.map((h: AnyRow) => (
                    <li key={h.id}>
                      <span className="absolute -start-1 mt-1.5 size-2 rounded-full bg-primary" />
                      <p className="font-medium">{String(h.to_status).replaceAll("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString()} · {h.actor ?? "system"}
                      </p>
                      {h.note ? <p className="text-xs">{h.note}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-muted-foreground">No status changes recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}


function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}
