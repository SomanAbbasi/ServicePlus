import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminBookingDetail } from "@/frontend/lib/api-services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/frontend/components/ui/tabs";
import { formatMoney, num } from "@/frontend/lib/money";
import { StatusBadge, TableSkeleton } from "@/frontend/components/admin/shell";
import { MapPin, ExternalLink } from "lucide-react";

interface BookingDetailModalProps {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

const KeyValueRow = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row py-2.5 border-b border-slate-100 last:border-0 text-sm">
    <div className="sm:w-1/3 text-slate-500 font-medium">{label}:</div>
    <div className="sm:w-2/3 text-slate-900 font-semibold">{value || "—"}</div>
  </div>
);

function safeFormatDate(dateStr?: string | null, timeStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `${dateStr} ${timeStr || ""}`.trim();
    const formatted = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return timeStr ? `${formatted} ${timeStr}` : formatted;
  } catch {
    return `${dateStr} ${timeStr || ""}`.trim();
  }
}

export function BookingDetailModal({
  bookingId,
  open,
  onClose,
}: BookingDetailModalProps) {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "booking", bookingId],
    queryFn: () => getAdminBookingDetail(bookingId!),
    enabled: Boolean(bookingId) && open,
  });

  const {
    booking,
    addons = [],
    history = [],
  } = (data as AnyRow) || {};

  const isRescheduled = useMemo(() => {
    if (!booking) return false;
    if (booking.is_rescheduled || booking.status === "RESCHEDULED") return true;
    return history.some((h: AnyRow) => h.to_status === "RESCHEDULED");
  }, [booking, history]);

  const startJobTime = useMemo(() => {
    const entry = history.find((h: AnyRow) => h.to_status === "IN_PROGRESS" || h.to_status === "ASSIGNED");
    if (entry?.created_at) {
      return safeFormatDate(entry.created_at, new Date(entry.created_at).toLocaleTimeString());
    }
    if (booking?.scheduled_date) {
      return safeFormatDate(booking.scheduled_date, booking.scheduled_start || "07:00 AM");
    }
    return "—";
  }, [history, booking]);

  const endJobTime = useMemo(() => {
    const entry = history.find((h: AnyRow) => h.to_status === "COMPLETED");
    if (entry?.created_at) {
      return safeFormatDate(entry.created_at, new Date(entry.created_at).toLocaleTimeString());
    }
    if (booking?.scheduled_date && booking?.scheduled_end) {
      return safeFormatDate(booking.scheduled_date, booking.scheduled_end);
    }
    return "—";
  }, [history, booking]);

  const totalJobMinutes = useMemo(() => {
    const start = history.find((h: AnyRow) => h.to_status === "IN_PROGRESS");
    const end = history.find((h: AnyRow) => h.to_status === "COMPLETED");
    if (start?.created_at && end?.created_at) {
      const diffMs = Math.abs(new Date(end.created_at).getTime() - new Date(start.created_at).getTime());
      const mins = Math.round(diffMs / 60000);
      return `${mins} Minutes`;
    }
    return booking?.hours ? `${booking.hours * 60} Minutes` : "—";
  }, [history, booking]);

  const subtotal = num(booking?.subtotal, 0);
  const addonsTotal = num(booking?.addons_total, addons.reduce((acc: number, a: AnyRow) => acc + (num(a.unit_price) * num(a.quantity, 1)), 0));
  const serviceCharge = num(booking?.service_charge, 0);
  const otherCharges = num(booking?.fees, 0);
  const subTotalCalculated = subtotal + addonsTotal + otherCharges + serviceCharge;
  const vat = num(booking?.tax, 0);
  const finalAmount = num(booking?.total, subTotalCalculated + vat);

  const customerName = booking?.profile?.fullName || booking?.profile?.full_name || booking?.guestPhone || booking?.guest_phone || "—";
  const customerEmail = booking?.profile?.email || "—";
  const customerPhone = booking?.profile?.phone || booking?.guestPhone || booking?.guest_phone || "—";
  const companyName = booking?.company?.name || booking?.professional?.company?.name || "—";
  const supervisorName = booking?.supervisor?.name || "—";
  const teamLeaderName = booking?.team_leader?.name || "—";
  const categoryName = booking?.service?.category?.name || booking?.service?.name || "—";
  const bookingNumber = booking?.bookingNumber || booking?.booking_number || "—";

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <DialogTitle className="text-xl font-extrabold text-slate-900">View Booking</DialogTitle>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
              {bookingNumber}
            </span>
          </div>
        </DialogHeader>

        {isPending ? (
          <div className="p-4">
            <TableSkeleton rows={8} />
          </div>
        ) : booking ? (
          <Tabs defaultValue="booking-info" className="w-full mt-2">
            <TabsList className="w-full flex overflow-x-auto justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0 space-x-6">
              {[
                { value: "booking-info", label: "Booking Information" },
                { value: "addon-info", label: "Addon Information" },
                { value: "booking-customer", label: "Booking Customer Details" },
                { value: "customer-info", label: "Customer Information" },
                { value: "additional-instructions", label: "Additional Instructions" },
                { value: "assigned-professionals", label: "Assigned Professionals" },
                { value: "address-info", label: "Address Information" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 px-1 text-xs whitespace-nowrap"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4">
              {/* Tab 1: Booking Information */}
              <TabsContent value="booking-info" className="m-0 space-y-0">
                <KeyValueRow label="Booking Id" value={<span className="font-mono text-primary font-bold">{bookingNumber}</span>} />
                <KeyValueRow
                  label="Booking From"
                  value={customerName !== "—" ? `${customerName} (${customerEmail}) ${customerPhone}` : "—"}
                />
                <KeyValueRow
                  label="Rescheduled Status"
                  value={
                    isRescheduled ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">Yes</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">No</span>
                    )
                  }
                />
                <KeyValueRow
                  label="Booking Date"
                  value={safeFormatDate(booking.scheduled_date || booking.scheduledDate, booking.scheduled_start || booking.scheduledStart)}
                />
                <KeyValueRow label="Company" value={companyName} />
                <KeyValueRow label="Supervisor" value={supervisorName} />
                <KeyValueRow label="Team Leader" value={teamLeaderName} />
                <KeyValueRow label="Category" value={categoryName} />
                <KeyValueRow
                  label="Plan"
                  value={booking.hours ? "Hourly" : "Fixed"}
                />
                <KeyValueRow
                  label="Request Hours"
                  value={booking.hours ? `${booking.hours} Hours` : "—"}
                />
                <KeyValueRow
                  label="Request Professionals"
                  value={booking.professionals_count || booking.professionalsCount || 1}
                />
                <KeyValueRow label="Amount" value={formatMoney(subtotal)} />
                {addonsTotal > 0 && (
                  <KeyValueRow
                    label="Addons Amount"
                    value={formatMoney(addonsTotal)}
                  />
                )}
                {serviceCharge > 0 && (
                  <KeyValueRow
                    label="Service Charges"
                    value={formatMoney(serviceCharge)}
                  />
                )}
                {otherCharges > 0 && (
                  <KeyValueRow
                    label="Other Charges"
                    value={formatMoney(otherCharges)}
                  />
                )}
                <KeyValueRow
                  label="Sub Total"
                  value={formatMoney(subTotalCalculated)}
                />
                {vat > 0 && <KeyValueRow label="VAT" value={formatMoney(vat)} />}
                <KeyValueRow label="Final Amount" value={<span className="text-emerald-700 font-extrabold">{formatMoney(finalAmount)}</span>} />
                <KeyValueRow
                  label="Tools / Materials"
                  value={booking.materials ? "Yes" : "No"}
                />
                <KeyValueRow label="Start Job Time" value={startJobTime} />
                <KeyValueRow label="End Job Time" value={endJobTime} />
                <KeyValueRow label="Total Job Minutes" value={totalJobMinutes} />
                <KeyValueRow
                  label="Status"
                  value={<StatusBadge status={booking.status} />}
                />
              </TabsContent>

              {/* Tab 2: Addon Information */}
              <TabsContent value="addon-info" className="m-0">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="px-4 py-3">Addon Service Name</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Service Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {addons.length > 0 ? (
                        addons.map((a: AnyRow) => (
                          <tr key={a.id}>
                            <td className="px-4 py-3 font-semibold">{a.label || a.name || a.addon?.name}</td>
                            <td className="px-4 py-3">{a.quantity || 1}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {formatMoney(a.unit_price || a.unitPrice || a.price)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                            No add-on services selected for this booking.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Tab 3: Booking Customer Details */}
              <TabsContent value="booking-customer" className="m-0 space-y-0">
                <KeyValueRow
                  label="Name"
                  value={customerName}
                />
                <KeyValueRow
                  label="Email"
                  value={customerEmail}
                />
                <KeyValueRow
                  label="Phone"
                  value={customerPhone}
                />
              </TabsContent>

              {/* Tab 4: Customer Information */}
              <TabsContent value="customer-info" className="m-0 space-y-0">
                <KeyValueRow
                  label="Name"
                  value={customerName}
                />
                <KeyValueRow
                  label="Email"
                  value={customerEmail}
                />
                <KeyValueRow
                  label="Phone Number"
                  value={customerPhone}
                />
                <KeyValueRow
                  label="Registered On"
                  value={
                    booking.profile?.createdAt || booking.profile?.created_at
                      ? safeFormatDate(booking.profile.createdAt || booking.profile.created_at)
                      : "—"
                  }
                />
              </TabsContent>

              {/* Tab 5: Additional Instructions */}
              <TabsContent value="additional-instructions" className="m-0">
                <div className="space-y-4">
                  <KeyValueRow
                    label="Instructions"
                    value={booking.instructions || "No additional instructions provided."}
                  />
                </div>
              </TabsContent>

              {/* Tab 6: Booking Assigned Professionals */}
              <TabsContent value="assigned-professionals" className="m-0 space-y-0">
                <KeyValueRow
                  label="Name"
                  value={booking.professional?.fullName || booking.professional?.full_name || "Unassigned"}
                />
                <KeyValueRow
                  label="Phone"
                  value={booking.professional?.phone || "—"}
                />
                <KeyValueRow
                  label="Rating"
                  value={booking.professional?.rating ? `${booking.professional.rating} ★` : "—"}
                />
                <KeyValueRow
                  label="Company"
                  value={companyName}
                />
                <KeyValueRow
                  label="City"
                  value={booking.professional?.city?.name || booking.city?.name || "—"}
                />
              </TabsContent>

              {/* Tab 7: Address Information */}
              <TabsContent value="address-info" className="m-0 space-y-0">
                <KeyValueRow
                  label="Label"
                  value={booking.address?.label || "—"}
                />
                <KeyValueRow
                  label="Building"
                  value={booking.address?.building || "—"}
                />
                <KeyValueRow
                  label="Unit/Apt"
                  value={booking.address?.unit || "—"}
                />
                <KeyValueRow
                  label="Street"
                  value={booking.address?.street || "—"}
                />
                <KeyValueRow label="City" value={booking.city?.name || "—"} />
                {booking.address?.latitude && booking.address?.longitude && (
                  <KeyValueRow
                    label="Coordinates / Map"
                    value={
                      <a
                        href={`https://maps.google.com/?q=${booking.address.latitude},${booking.address.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-primary hover:underline gap-1 text-xs"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        View on Google Maps
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    }
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

