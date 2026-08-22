import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminBookings, getAdminProfessionals, setBookingStatus, assignProfessional, getAdminBookingDetail } from "@/frontend/lib/api-services";
import { StatusBadge, TableSkeleton, ErrorState, downloadCsv } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { formatMoney, num } from "@/frontend/lib/money";
import { cn } from "@/frontend/lib/utils";
import { Search, Calendar, Download, RefreshCw, Filter, MapPin, Navigation, ChevronLeft, ChevronRight } from "lucide-react";
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
      if (appliedFilters.serviceName && !b.service?.name?.toLowerCase().includes(appliedFilters.serviceName.toLowerCase())) return false;
      if (appliedFilters.categoryName && !b.category?.name?.toLowerCase().includes(appliedFilters.categoryName.toLowerCase())) return false;
      if (appliedFilters.bookingDate && b.scheduled_date !== appliedFilters.bookingDate) return false;
      if (appliedFilters.bookingNumber && !b.booking_number?.toLowerCase().includes(appliedFilters.bookingNumber.toLowerCase())) return false;
      
      const areaMatch = b.city?.name?.toLowerCase() || b.cities?.name?.toLowerCase() || b.area?.name?.toLowerCase() || "";
      if (appliedFilters.area && !areaMatch.includes(appliedFilters.area.toLowerCase())) return false;
      
      if (appliedFilters.companyName && !b.company?.name?.toLowerCase().includes(appliedFilters.companyName.toLowerCase())) return false;
      if (appliedFilters.supervisor && !b.supervisor?.name?.toLowerCase().includes(appliedFilters.supervisor.toLowerCase())) return false;
      if (appliedFilters.teamLeader && !b.team_leader?.name?.toLowerCase().includes(appliedFilters.teamLeader.toLowerCase())) return false;
      if (appliedFilters.professional && !b.professionals?.full_name?.toLowerCase().includes(appliedFilters.professional.toLowerCase())) return false;
      
      if (appliedFilters.autoAssign !== "all") {
        const isAuto = Boolean(b.is_auto_assign);
        if (appliedFilters.autoAssign === "yes" && !isAuto) return false;
        if (appliedFilters.autoAssign === "no" && isAuto) return false;
      }
      
      if (appliedFilters.rescheduled !== "all") {
        const isRescheduled = Boolean(b.is_rescheduled);
        if (appliedFilters.rescheduled === "yes" && !isRescheduled) return false;
        if (appliedFilters.rescheduled === "no" && isRescheduled) return false;
      }

      if (appliedFilters.paymentMethod !== "all" && b.payment_method !== appliedFilters.paymentMethod) return false;
      
      if (appliedFilters.startDate && b.scheduled_date && b.scheduled_date < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && b.scheduled_date && b.scheduled_date > appliedFilters.endDate) return false;

      return true;
    });
  }, [data, appliedFilters]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);

  const handleExport = () => {
    downloadCsv(
      "bookings.csv",
      rows.map((b) => ({
        booking: b.booking_number,
        service: b.service?.name ?? "",
        customer: b.profile?.full_name ?? b.guest_phone ?? "",
        date: b.scheduled_date ?? "",
        status: b.status,
        total: b.total,
      }))
    );
  };

  if (isError) return <ErrorState />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500 mb-1">Dashboard / Booking Management</div>
          <h1 className="text-2xl font-extrabold text-slate-900">Booking Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="rounded-full bg-cyan-500 hover:bg-cyan-600 text-white" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Link to="/admin/calendar">
            <Button className="rounded-full bg-amber-500 hover:bg-amber-600 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar View
            </Button>
          </Link>
          <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Service Name" value={fServiceName} onChange={e => setFServiceName(e.target.value)} />
            <Input placeholder="Category Name" value={fCategoryName} onChange={e => setFCategoryName(e.target.value)} />
            <AdminDateInput placeholder="Booking Date" value={fBookingDate} onChange={setFBookingDate} className="h-10" />
            
            <Input placeholder="Booking Number" value={fBookingNumber} onChange={e => setFBookingNumber(e.target.value)} />
            <Input placeholder="Area" value={fArea} onChange={e => setFArea(e.target.value)} />
            <Input placeholder="Company Name" value={fCompanyName} onChange={e => setFCompanyName(e.target.value)} />
            
            <Input placeholder="Supervisor Name" value={fSupervisor} onChange={e => setFSupervisor(e.target.value)} />
            <Input placeholder="Team Leader Name" value={fTeamLeader} onChange={e => setFTeamLeader(e.target.value)} />
            <Input placeholder="Professional Name" value={fProfessional} onChange={e => setFProfessional(e.target.value)} />
            
            <Select value={fAutoAssign} onValueChange={setFAutoAssign}>
              <SelectTrigger><SelectValue placeholder="Auto Assign Preference" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Auto Assign Preference</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fRescheduled} onValueChange={setFRescheduled}>
              <SelectTrigger><SelectValue placeholder="Rescheduled Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Rescheduled Status (All)</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fPaymentMethod} onValueChange={setFPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Payment Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Payment Method (All)</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
              </SelectContent>
            </Select>

            <AdminDateInput placeholder="Start Date" value={fStartDate} onChange={setFStartDate} className="h-10" />
            <AdminDateInput placeholder="End Date" value={fEndDate} onChange={setFEndDate} className="h-10" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-slate-200" onClick={resetFilters}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full" onClick={applyFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </Card>
      )}

      {/* Table Card */}
      <Card className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="px-4 py-3 font-semibold w-12">#</th>
                <th className="px-4 py-3 font-semibold">Booking Details</th>
                <th className="px-4 py-3 font-semibold">Booking Date</th>
                <th className="px-4 py-3 font-semibold">Customer Details</th>
                <th className="px-4 py-3 font-semibold">Area</th>
                <th className="px-4 py-3 font-semibold">Auto Assign</th>
                <th className="px-4 py-3 font-semibold text-right">Navigate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isPending ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <TableSkeleton rows={8} />
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No bookings match your filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((b, idx) => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setOpenId(b.id)}
                  >
                    <td className="px-4 py-4 text-slate-500">{page * pageSize + idx + 1}</td>
                    
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{b.service?.name ?? "—"}</div>
                      <div className="text-xs text-slate-500 mb-1">{b.category?.name ?? "General"}</div>
                      <div className="text-xs text-slate-600 mb-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                        {b.hours ?? 0} Hours, {b.professionals_count ?? 1} Professional
                      </div>
                      <div className="font-mono font-bold text-blue-600 mb-1">{b.booking_number}</div>
                      <div className="font-semibold text-slate-900 mb-2">{formatMoney(num(b.total))}</div>
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-slate-900 mb-2">
                        {b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString() : "—"}
                        <br />
                        <span className="text-xs text-slate-500">
                          {String(b.scheduled_start ?? "").slice(0, 5)}
                        </span>
                      </div>
                      <div className="mb-2">
                        <StatusBadge status={b.payment_status} />
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        Rescheduled: {b.is_rescheduled ? "Yes" : "No"}
                      </div>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-slate-900 mb-1">
                        {b.profile?.full_name ?? b.guest_phone ?? "Guest"}
                      </div>
                      <div className="text-xs text-slate-500 mb-1">{b.profile?.email ?? "—"}</div>
                      <div className="text-xs text-slate-500">{b.profile?.phone ?? b.guest_phone ?? "—"}</div>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-medium text-slate-900">{b.city?.name ?? b.cities?.name ?? "Dubai"}</div>
                          <div className="text-xs text-slate-500">{b.area?.name ?? "—"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold",
                        b.is_auto_assign ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                      )}>
                        {b.is_auto_assign ? "Auto" : "Manual"}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-top text-right" onClick={e => e.stopPropagation()}>
                      {b.professional_id ? (
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs px-3 h-8">
                          <Navigation className="w-3 h-3 mr-1.5" />
                          Navigate to professional
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Show</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-500">
              Showing {rows.length === 0 ? 0 : page * pageSize + 1} to {Math.min(rows.length, (page + 1) * pageSize)} of {rows.length} entries
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="w-8 h-8 rounded" 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={page === i ? "default" : "outline"}
                className={cn("w-8 h-8 rounded p-0 text-sm", page === i && "bg-blue-600 text-white")}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </Button>
            ))}
            <Button 
              variant="outline" 
              size="icon" 
              className="w-8 h-8 rounded" 
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
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
