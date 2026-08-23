import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminBookings } from "@/frontend/lib/api-services";
import { StatusBadge, TableSkeleton, ErrorState, downloadCsv, PageHeader, PageActions, ActionIconButton } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { formatMoney, num } from "@/frontend/lib/money";
import { cn } from "@/frontend/lib/utils";
import { Calendar, RefreshCw, Filter, MapPin, ChevronLeft, ChevronRight, User, Clock, CreditCard, Eye } from "lucide-react";
import { BookingDetailModal } from "@/frontend/components/admin/BookingDetailModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

function AdminBookings() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("bookings", getAdminBookings);
  
  // State for filters panel visibility
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [fServiceName, setFServiceName] = useState("");
  const [fCategoryName, setFCategoryName] = useState("");
  const [fBookingDate, setFBookingDate] = useState("");
  const [fBookingNumber, setFBookingNumber] = useState("");
  const [fArea, setFArea] = useState("");
  const [fCompanyName, setFCompanyName] = useState("");
  const [fSupervisor, setFSupervisor] = useState("");
  const [fTeamLeader, setFTeamLeader] = useState("");
  const [fProfessional, setFProfessional] = useState("");
  const [fAutoAssign, setFAutoAssign] = useState("all");
  const [fRescheduled, setFRescheduled] = useState("all");
  const [fPaymentMethod, setFPaymentMethod] = useState("all");
  const [fStartDate, setFStartDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  
  // Actually applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    serviceName: "",
    categoryName: "",
    bookingDate: "",
    bookingNumber: "",
    area: "",
    companyName: "",
    supervisor: "",
    teamLeader: "",
    professional: "",
    autoAssign: "all",
    rescheduled: "all",
    paymentMethod: "all",
    startDate: "",
    endDate: "",
  });

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  // Modal
  const [openId, setOpenId] = useState<string | null>(null);

  const resetFilters = () => {
    setFServiceName("");
    setFCategoryName("");
    setFBookingDate("");
    setFBookingNumber("");
    setFArea("");
    setFCompanyName("");
    setFSupervisor("");
    setFTeamLeader("");
    setFProfessional("");
    setFAutoAssign("all");
    setFRescheduled("all");
    setFPaymentMethod("all");
    setFStartDate("");
    setFEndDate("");
    
    setAppliedFilters({
      serviceName: "",
      categoryName: "",
      bookingDate: "",
      bookingNumber: "",
      area: "",
      companyName: "",
      supervisor: "",
      teamLeader: "",
      professional: "",
      autoAssign: "all",
      rescheduled: "all",
      paymentMethod: "all",
      startDate: "",
      endDate: "",
    });
    setPage(0);
  };

  const applyFilters = () => {
    setAppliedFilters({
      serviceName: fServiceName,
      categoryName: fCategoryName,
      bookingDate: fBookingDate,
      bookingNumber: fBookingNumber,
      area: fArea,
      companyName: fCompanyName,
      supervisor: fSupervisor,
      teamLeader: fTeamLeader,
      professional: fProfessional,
      autoAssign: fAutoAssign,
      rescheduled: fRescheduled,
      paymentMethod: fPaymentMethod,
      startDate: fStartDate,
      endDate: fEndDate,
    });
    setPage(0);
  };

  const rows = useMemo(() => {
    const list = (data ?? []) as AnyRow[];
    return list.filter((b) => {
      const sName = b.service?.name || b.service_name || "";
      if (appliedFilters.serviceName && !sName.toLowerCase().includes(appliedFilters.serviceName.toLowerCase())) return false;
      
      const cName = b.category?.name || b.service?.category?.name || "";
      if (appliedFilters.categoryName && !cName.toLowerCase().includes(appliedFilters.categoryName.toLowerCase())) return false;
      
      const bDate = b.scheduled_date || b.scheduledDate || "";
      if (appliedFilters.bookingDate && bDate !== appliedFilters.bookingDate) return false;
      
      const bNum = b.booking_number || b.bookingNumber || "";
      if (appliedFilters.bookingNumber && !bNum.toLowerCase().includes(appliedFilters.bookingNumber.toLowerCase())) return false;
      
      const areaMatch = b.city?.name?.toLowerCase() || b.cities?.name?.toLowerCase() || b.area?.name?.toLowerCase() || b.address?.street?.toLowerCase() || "";
      if (appliedFilters.area && !areaMatch.includes(appliedFilters.area.toLowerCase())) return false;
      
      const compName = b.company?.name || b.companyName || "";
      if (appliedFilters.companyName && !compName.toLowerCase().includes(appliedFilters.companyName.toLowerCase())) return false;
      
      const supName = b.supervisor?.name || "";
      if (appliedFilters.supervisor && !supName.toLowerCase().includes(appliedFilters.supervisor.toLowerCase())) return false;
      
      const tlName = b.team_leader?.name || "";
      if (appliedFilters.teamLeader && !tlName.toLowerCase().includes(appliedFilters.teamLeader.toLowerCase())) return false;
      
      const proName = b.professional?.fullName || b.professional?.full_name || b.professionals?.full_name || "";
      if (appliedFilters.professional && !proName.toLowerCase().includes(appliedFilters.professional.toLowerCase())) return false;
      
      if (appliedFilters.autoAssign !== "all") {
        const isAuto = Boolean(b.is_auto_assign || b.isAutoAssign);
        if (appliedFilters.autoAssign === "yes" && !isAuto) return false;
        if (appliedFilters.autoAssign === "no" && isAuto) return false;
      }
      
      if (appliedFilters.rescheduled !== "all") {
        const isRescheduled = Boolean(b.is_rescheduled || b.isRescheduled || b.status === "RESCHEDULED");
        if (appliedFilters.rescheduled === "yes" && !isRescheduled) return false;
        if (appliedFilters.rescheduled === "no" && isRescheduled) return false;
      }

      const pMethod = (b.payment_method || b.paymentMethod || "").toUpperCase();
      if (appliedFilters.paymentMethod !== "all" && pMethod !== appliedFilters.paymentMethod) return false;
      
      if (appliedFilters.startDate && bDate && bDate < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && bDate && bDate > appliedFilters.endDate) return false;

      return true;
    });
  }, [data, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);

  const handleExport = () => {
    downloadCsv(
      "bookings.csv",
      rows.map((b) => ({
        booking_number: b.booking_number || b.bookingNumber || "",
        service: b.service?.name ?? "",
        customer: b.profile?.fullName ?? b.profile?.full_name ?? b.guestPhone ?? b.guest_phone ?? "",
        date: b.scheduled_date || b.scheduledDate || "",
        status: b.status,
        payment_status: b.payment_status || b.paymentStatus || "",
        total: b.total,
      }))
    );
  };

  if (isError) return <ErrorState />;

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top Header with Breadcrumbs & Actions */}
      <PageHeader
        title="Booking Management"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Booking Management" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border font-semibold text-xs text-foreground hover:bg-muted"
            >
              <Link to="/admin/calendar">
                <Calendar className="size-3.5" />
                Calendar View
              </Link>
            </Button>
            <PageActions
              onSearchToggle={() => setShowFilters((v) => !v)}
              isSearchOpen={showFilters}
              onExport={handleExport}
            />
          </div>
        }
      />

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            <Input
              placeholder="Service Name"
              value={fServiceName}
              onChange={(e) => setFServiceName(e.target.value)}
              className="h-9 text-xs"
            />
            <Input
              placeholder="Category Name"
              value={fCategoryName}
              onChange={(e) => setFCategoryName(e.target.value)}
              className="h-9 text-xs"
            />
            <AdminDateInput
              placeholder="Booking Date"
              value={fBookingDate}
              onChange={setFBookingDate}
              className="h-9"
            />
            <Input
              placeholder="Booking Number"
              value={fBookingNumber}
              onChange={(e) => setFBookingNumber(e.target.value)}
              className="h-9 text-xs"
            />
            <Input
              placeholder="Area / City"
              value={fArea}
              onChange={(e) => setFArea(e.target.value)}
              className="h-9 text-xs"
            />
            <Input
              placeholder="Company Name"
              value={fCompanyName}
              onChange={(e) => setFCompanyName(e.target.value)}
              className="h-9 text-xs"
            />
            <Input
              placeholder="Professional Name"
              value={fProfessional}
              onChange={(e) => setFProfessional(e.target.value)}
              className="h-9 text-xs"
            />
            
            <Select value={fAutoAssign} onValueChange={setFAutoAssign}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Auto Assign" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Auto Assign (All)</SelectItem>
                <SelectItem value="yes" className="text-xs">Auto Assigned</SelectItem>
                <SelectItem value="no" className="text-xs">Manual Assigned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fRescheduled} onValueChange={setFRescheduled}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Rescheduled" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Rescheduled (All)</SelectItem>
                <SelectItem value="yes" className="text-xs">Yes</SelectItem>
                <SelectItem value="no" className="text-xs">No</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fPaymentMethod} onValueChange={setFPaymentMethod}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Payment Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Payment Method (All)</SelectItem>
                <SelectItem value="CARD" className="text-xs">Card</SelectItem>
                <SelectItem value="CASH" className="text-xs">Cash</SelectItem>
              </SelectContent>
            </Select>

            <AdminDateInput placeholder="Start Date" value={fStartDate} onChange={setFStartDate} className="h-9" />
            <AdminDateInput placeholder="End Date" value={fEndDate} onChange={setFEndDate} className="h-9" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" onClick={resetFilters}>
              <RefreshCw className="size-3.5 mr-1.5" />
              Reset Filters
            </Button>
            <Button size="sm" className="h-8 text-xs font-bold" onClick={applyFilters}>
              <Filter className="size-3.5 mr-1.5" />
              Apply Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Table Card */}
      <Card className="bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3 font-semibold">Booking ID</th>
                <th className="px-4 py-3 font-semibold">Service & Category</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Schedule</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Assignment</th>
                <th className="px-4 py-3 font-semibold">Amount & Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isPending ? (
                <tr>
                  <td colSpan={10} className="p-4">
                    <TableSkeleton rows={8} />
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-sm">No bookings found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or resetting filters.</p>
                  </td>
                </tr>
              ) : (
                pageRows.map((b, idx) => {
                  const bookingNum = b.booking_number || b.bookingNumber || "—";
                  const serviceTitle = b.service?.name || b.service_name || "Home Service";
                  const categoryTitle = b.category?.name || b.service?.category?.name || "General";
                  const custName = b.profile?.fullName || b.profile?.full_name || b.guestPhone || b.guest_phone || "Guest Customer";
                  const custPhone = b.profile?.phone || b.guestPhone || b.guest_phone || "—";
                  const custEmail = b.profile?.email || "—";
                  const dateStr = b.scheduled_date || b.scheduledDate;
                  const timeSlot = b.scheduled_start || b.scheduledStart || "";
                  const cityStr = b.city?.name || b.cities?.name || "Dubai";
                  const areaStr = b.area?.name || b.address?.street || b.address?.building || "";
                  const proName = b.professional?.fullName || b.professional?.full_name || b.professionals?.full_name;
                  const isAuto = Boolean(b.is_auto_assign || b.isAutoAssign);

                  return (
                    <tr 
                      key={b.id} 
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center text-slate-400 font-medium">
                        {page * pageSize + idx + 1}
                      </td>

                      {/* Booking ID */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => setOpenId(b.id)}
                          className="font-mono font-bold text-primary hover:underline text-xs block text-start"
                        >
                          {bookingNum}
                        </button>
                        <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}
                        </span>
                      </td>
                      
                      {/* Service & Category */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 leading-snug">{serviceTitle}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {categoryTitle}
                          </span>
                          {b.hours ? (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {b.hours}h • {b.professionals_count || b.professionalsCount || 1} Pro
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <User className="size-3 text-slate-400 shrink-0" />
                          <span>{custName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{custPhone}</div>
                        {custEmail !== "—" && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{custEmail}</div>
                        )}
                      </td>

                      {/* Scheduled Date */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <Clock className="size-3 text-slate-400 shrink-0" />
                          <span>{dateStr ? new Date(dateStr).toLocaleDateString("en-GB") : "—"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{timeSlot ? timeSlot.slice(0, 5) : "—"}</div>
                        {b.is_rescheduled || b.isRescheduled ? (
                          <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Rescheduled
                          </span>
                        ) : null}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-1">
                          <MapPin className="size-3 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 block">{cityStr}</span>
                            {areaStr && (
                              <span className="text-[11px] text-slate-500 block truncate max-w-[140px]" title={areaStr}>
                                {areaStr}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assignment */}
                      <td className="px-4 py-3.5">
                        {proName ? (
                          <div>
                            <span className="font-semibold text-slate-900 block">{proName}</span>
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                              Assigned
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 italic text-[11px] block">Unassigned</span>
                            <span className={cn(
                              "text-[10px] font-medium px-1.5 py-0.2 rounded inline-block mt-0.5",
                              isAuto ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"
                            )}>
                              {isAuto ? "Auto Assign" : "Manual"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Amount & Payment */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{formatMoney(num(b.total))}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <StatusBadge status={b.payment_status || b.paymentStatus || "UNPAID"} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={b.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <ActionIconButton
                            icon={Eye}
                            label="View Booking Details"
                            action="view"
                            onClick={() => setOpenId(b.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="w-18 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="20" className="text-xs">20</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-slate-500">
              Showing {rows.length === 0 ? 0 : page * pageSize + 1} to {Math.min(rows.length, (page + 1) * pageSize)} of {rows.length} entries
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="size-8 rounded-lg" 
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
              <Button
                key={i}
                variant={page === i ? "default" : "outline"}
                className="size-8 rounded-lg p-0 text-xs font-semibold"
                onClick={() => setPage(i)}
              >
                {i + 1}
              </Button>
            ))}
            <Button 
              variant="outline" 
              size="icon" 
              className="size-8 rounded-lg" 
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <BookingDetailModal
        bookingId={openId}
        open={Boolean(openId)}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
