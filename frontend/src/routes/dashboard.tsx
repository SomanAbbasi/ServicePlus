import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelBooking, getMyBookings, getMyAddresses, createAddress } from "@/frontend/lib/api-services";
import { type BookingStatus, CUSTOMER_CANCELLABLE } from "@/frontend/lib/booking-status";
import { formatMoney, num } from "@/frontend/lib/money";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { toast } from "sonner";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";
import { useAuth } from "@/frontend/lib/auth-context";
import { Calendar, MapPin, User, Mail, Phone, ShoppingBag, ShieldCheck, LogOut, Edit3 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Account & Bookings — ServicePlus" },
      { name: "description", content: "Track, reschedule and view your ServicePlus bookings and profile." },
      { property: "og:title", content: "My Account & Bookings — ServicePlus" },
      { property: "og:description", content: "Track your home-service bookings and account details." },
      { property: "og:url", content: "/dashboard" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const { t, locale } = useLocale();
  const { user, token, clearAuth } = useAuth();
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => getMyBookings(),
    enabled: Boolean(token),
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => getMyAddresses(),
    enabled: Boolean(token),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
  });

  // Filter bookings by status tab
  const upcomingBookings = useMemo(
    () =>
      bookings.filter((b: any) =>
        ["PENDING", "CONFIRMED", "ASSIGNING", "ASSIGNED", "RESCHEDULED", "IN_PROGRESS"].includes(
          b.status?.toUpperCase() || "",
        ),
      ),
    [bookings],
  );

  const pastBookings = useMemo(
    () =>
      bookings.filter((b: any) =>
        ["COMPLETED", "CANCELLED", "REFUNDED", "PAYMENT_FAILED"].includes(
          b.status?.toUpperCase() || "",
        ),
      ),
    [bookings],
  );

  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editStreet, setEditStreet] = useState("");
  const [editBuilding, setEditBuilding] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const primaryAddress = addresses[0];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-slate-50/50 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Page Title & User Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
              <ShieldCheck className="size-3.5 text-cyan-600" />
              {isAr ? "حساب العميل" : "Customer Account"}
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
              {isAr ? "حسابي وحجوزاتي" : "My Account & Bookings"}
            </h1>
          </div>

          {token && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAuth}
              className="rounded-full border-slate-200 font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
            >
              <LogOut className="size-4 me-1.5" />
              {isAr ? "تسجيل الخروج" : "Log Out"}
            </Button>
          )}
        </div>

        {/* Layout Grid: Profile Card (Left) & Bookings / Addresses (Right) */}
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          
          {/* Customer Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="grid size-20 place-items-center rounded-full bg-cyan-100 text-cyan-700 font-extrabold text-2xl shadow-inner">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="size-8" />}
                </div>
                <h2 className="mt-4 text-base font-extrabold text-slate-900">
                  {user?.full_name || (isAr ? "عميل ServicePlus" : "ServicePlus Customer")}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {isAr ? "حساب نشط" : "Active Customer Account"}
                </p>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-xs">
                {user?.phone && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="size-4 text-cyan-600 shrink-0" />
                    <span className="font-semibold dir-ltr">{user.phone}</span>
                  </div>
                )}

                {user?.email && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="size-4 text-cyan-600 shrink-0" />
                    <span className="font-semibold truncate">{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Single Clean Primary Address Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <MapPin className="size-4 text-cyan-600" />
                  {isAr ? "عنوان التوصيل الرئيسي" : "Primary Address"}
                </h3>
                {primaryAddress && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditStreet(primaryAddress.street || "");
                      setEditBuilding(primaryAddress.building || "");
                      setEditAddressOpen(true);
                    }}
                    className="h-7 text-[11px] font-bold rounded-full border-cyan-500 text-cyan-700 hover:bg-cyan-50 gap-1"
                  >
                    <Edit3 className="size-3" />
                    {isAr ? "تعديل" : "Edit"}
                  </Button>
                )}
              </div>

              {!primaryAddress ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-slate-400">
                    {isAr ? "لا يوجد عنوان محدد بعد." : "No primary address saved yet."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditStreet("");
                      setEditBuilding("");
                      setEditAddressOpen(true);
                    }}
                    className="text-xs font-bold rounded-full border-slate-200"
                  >
                    {isAr ? "+ إضافة عنوان" : "+ Add Address"}
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-extrabold text-slate-900">
                    <span className="capitalize text-cyan-900">{primaryAddress.label || "Home"}</span>
                    <span className="rounded-full bg-cyan-200/80 px-2 py-0.5 text-[10px] font-bold text-cyan-800">
                      Primary
                    </span>
                  </div>
                  <p className="text-slate-700 font-semibold leading-relaxed">
                    {primaryAddress.street} {primaryAddress.building ? `, ${primaryAddress.building}` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bookings / Orders History List */}
          <div className="md:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between pb-2">
                <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <ShoppingBag className="size-5 text-cyan-600" />
                  {isAr ? "حجوزاتي" : "Bookings"}
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {bookings.length} {isAr ? "حجوزات" : "total"}
                </span>
              </div>

              {/* Upcoming vs Past Tab Switcher (Matching Image 2) */}
              <div className="mt-4 flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className={`flex-1 py-3 text-center text-sm font-extrabold transition-all border-b-2 ${
                    activeTab === "upcoming"
                      ? "border-cyan-500 text-cyan-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {isAr ? "القادمة" : "Upcoming"} ({upcomingBookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("past")}
                  className={`flex-1 py-3 text-center text-sm font-extrabold transition-all border-b-2 ${
                    activeTab === "past"
                      ? "border-cyan-500 text-cyan-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {isAr ? "السابقة" : "Past"} ({pastBookings.length})
                </button>
              </div>

              {isBookingsLoading ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">
                  {isAr ? "جاري تحميل الحجوزات..." : "Loading bookings..."}
                </div>
              ) : displayedBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="grid size-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-600 mx-auto mb-3">
                    <Calendar className="size-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeTab === "upcoming"
                      ? (isAr ? "لا توجد مواعيد قادمة" : "You don't have any upcoming appointments")
                      : (isAr ? "لا توجد مواعيد سابقة" : "You don't have any past appointments")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {isAr
                      ? "احجز خدماتك المنزلية بكل سهولة وتتبع المواعيد من هنا."
                      : "Book your home service and manage schedules effortlessly from here."}
                  </p>
                  <Button asChild className="mt-5 rounded-full bg-[#FFC836] hover:bg-[#f5be29] text-slate-900 font-extrabold shadow-md">
                    <Link to="/">{isAr ? "استكشف جميع الخدمات" : "Browse All Services"}</Link>
                  </Button>
                </div>
              ) : (
                <ul className="mt-5 space-y-4">
                  {displayedBookings.map((b: any) => {
                    const status = (b.status || "CONFIRMED") as BookingStatus;
                    const bookingNum = b.bookingNumber || b.booking_number || `SP-${b.id.slice(0, 6)}`;
                    const dateStr = b.scheduledDate || b.scheduled_date || "Upcoming Slot";
                    const startTime = b.scheduledStart || b.scheduled_start || "";
                    const endTime = b.scheduledEnd || b.scheduled_end || "";
                    const timeStr = startTime ? `${startTime.slice(0, 5)}${endTime ? " - " + endTime.slice(0, 5) : ""}` : "";
                    
                    // Resilient Service & Options Title Fallback (Snapshot support if deleted in Admin)
                    const title =
                      b.service?.name ||
                      (b.items && b.items.length > 0 ? b.items[0].label : null) ||
                      (isAr ? "خدمة منزلية" : "Home Cleaning Service");

                    const addressText = b.address
                      ? `${b.address.street}${b.address.building ? ", " + b.address.building : ""}`
                      : (isAr ? "دبي، الإمارات" : "Dubai, UAE");

                    const itemsList: Array<{ label: string; quantity: number }> = b.items || [];

                    return (
                      <li key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                        {/* Header: Ref & Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              Booking Ref
                            </span>
                            <span className="font-mono text-xs font-black text-cyan-700">{bookingNum}</span>
                          </div>

                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
                            status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-cyan-100 text-cyan-800"
                          }`}>
                            {t(`status.${status}`) || status}
                          </span>
                        </div>

                        {/* Booking Details Content */}
                        <div className="space-y-2 text-xs">
                          <h4 className="font-extrabold text-slate-900 text-sm">{title}</h4>

                          <div className="grid gap-2 sm:grid-cols-2 text-slate-600 pt-1">
                            <div className="flex items-start gap-2">
                              <Calendar className="size-4 text-cyan-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="block font-bold text-slate-800">{dateStr}</span>
                                {timeStr && <span className="block text-[11px] text-slate-500 font-semibold">{timeStr}</span>}
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <MapPin className="size-4 text-cyan-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="block font-bold text-slate-800">{addressText}</span>
                                {b.paymentMethod && (
                                  <span className="block text-[11px] text-slate-500 uppercase font-semibold">
                                    {b.paymentMethod} Payment
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Snapshot Selected Items / Packages List */}
                          {itemsList.length > 0 && (
                            <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 mt-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Ordered Options & Addons
                              </span>
                              {itemsList.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                                  <span>• {item.label}</span>
                                  <span className="text-slate-500">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer: Price & Actions */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Price</span>
                            <span className="text-sm font-black text-slate-900">AED {Number(b.total || 0).toFixed(2)}</span>
                          </div>

                          {CUSTOMER_CANCELLABLE.includes(status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-full"
                              disabled={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(b.id)}
                            >
                              {t("dashboard.cancel")}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT ADDRESS MODAL */}
      <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl bg-white">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              {isAr ? "تحديث عنوان التوصيل" : "Update Delivery Address"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editStreet.trim()) return;
              setIsSavingAddress(true);
              try {
                await createAddress({
                  label: "Home",
                  street: editStreet.trim(),
                  building: editBuilding.trim() || undefined,
                });
                toast.success(isAr ? "تم تحديث العنوان بنجاح!" : "Address updated successfully!");
                queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
                setEditAddressOpen(false);
              } catch {
                toast.error(isAr ? "فشل حفظ العنوان" : "Failed to update address");
              } finally {
                setIsSavingAddress(false);
              }
            }}
            className="space-y-4 pt-3"
          >
            <div>
              <Label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? "اسم الشارع والمنطقة" : "Street Address & Area"}
              </Label>
              <Input
                value={editStreet}
                onChange={(e) => setEditStreet(e.target.value)}
                placeholder={isAr ? "مثال: شارع الوصل، دبي" : "e.g. Al Wasl, Dubai"}
                className="text-xs rounded-xl"
                required
              />
            </div>

            <div>
              <Label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? "اسم المبنى / رقم الفيلا (اختياري)" : "Building / Villa Name (Optional)"}
              </Label>
              <Input
                value={editBuilding}
                onChange={(e) => setEditBuilding(e.target.value)}
                placeholder={isAr ? "مثال: برج الرستل" : "e.g. Al Wasl Building"}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                disabled={isSavingAddress}
                className="w-full bg-[#FFC836] hover:bg-[#f5be29] text-slate-900 font-extrabold py-3 rounded-full text-xs shadow-md"
              >
                {isSavingAddress ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ العنوان" : "Save Address")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
