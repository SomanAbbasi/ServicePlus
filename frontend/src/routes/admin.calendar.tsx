import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getAdminBookings } from "@/frontend/lib/api-services";
import { ErrorState, TableSkeleton } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { cn } from "@/frontend/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingDetailModal } from "@/frontend/components/admin/BookingDetailModal";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, isToday } from "date-fns";

export const Route = createFileRoute("/admin/calendar")({
  component: AdminCalendarPage,
});

function AdminCalendarPage() {
  const { data, isPending, isError } = useAdminQuery("bookings", getAdminBookings);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-slate-200 text-slate-800";
    const s = status.toUpperCase();
    if (["PENDING", "DRAFT", "ASSIGNING"].includes(s)) return "bg-amber-400 text-white";
    if (["ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(s)) return "bg-emerald-500 text-white";
    if (["COMPLETED", "CONFIRMED"].includes(s)) return "bg-blue-500 text-white";
    if (["CANCELLED", "PAYMENT_FAILED", "RESCHEDULED"].includes(s)) return "bg-rose-500 text-white";
    return "bg-slate-200 text-slate-800";
  };

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    if (!data) return map;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data as any[]).forEach((b: any) => {
      const d = b.scheduled_date || b.scheduledDate;
      if (d) {
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(b);
      }
    });
    return map;
  }, [data]);

  const renderMonthView = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 border border-slate-200 rounded-md bg-white overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="py-2 text-center text-sm font-semibold text-slate-500 border-b border-slate-200">
            {day}
          </div>
        ))}
        
        {days.map((day, idx) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayBookings = bookingsByDate.get(dateStr) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div key={dateStr} className={cn(
              "min-h-[120px] p-2 border-r border-b border-slate-100 flex flex-col gap-1",
              !isCurrentMonth && "bg-slate-50 opacity-50",
              idx % 7 === 6 && "border-r-0"
            )}>
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full cursor-pointer",
                  isToday(day) ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
                )} onClick={() => setExpandedDate(day)}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="flex flex-col gap-1 flex-1">
                {dayBookings.slice(0, 3).map(b => {
                  const bNum = b.booking_number || b.bookingNumber || b.id;
                  const sName = b.service?.name || b.service_name || b.serviceName || "Home Service";
                  const cName = b.profile?.full_name || b.profile?.fullName || b.customer_name || b.customer_phone || "Customer";
                  const time = (b.scheduled_start || b.scheduledStart || "").substring(0, 5);

                  return (
                    <div 
                      key={b.id || bNum} 
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-sm truncate cursor-pointer h-5 leading-4 font-medium",
                        getStatusColor(b.status)
                      )}
                      onClick={() => setSelectedBookingId(b.id)}
                      title={`${bNum} (${sName}) - ${cName}`}
                    >
                      {time} {cName}
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div 
                    className="text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800 px-1"
                    onClick={() => setExpandedDate(day)}
                  >
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    return <div className="p-8 text-center text-slate-500 bg-white rounded-md border">Week view grid with time slots would go here</div>;
  };

  const renderDayView = () => {
    return <div className="p-8 text-center text-slate-500 bg-white rounded-md border">Day view timeline would go here</div>;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-slate-500 mb-1">Dashboard / Calendar</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Calendar</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-400"></div> Pending</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Inprocess</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Completed</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Cancelled</div>
            </div>
            <Button asChild className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/admin/bookings">View Booking</Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={handleToday} className="bg-slate-800 text-white hover:bg-slate-700">
              today
            </Button>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800">
            {viewMode === "month" && format(currentDate, "MMMM yyyy")}
            {viewMode === "week" && `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`}
            {viewMode === "day" && format(currentDate, "MMMM d, yyyy")}
          </h2>
          
          <div className="flex bg-slate-800 rounded-md p-1">
            <button 
              className={cn("px-4 py-1.5 text-sm font-medium rounded", viewMode === "month" ? "bg-slate-600 text-white" : "text-slate-300 hover:text-white")}
              onClick={() => setViewMode("month")}
            >month</button>
            <button 
              className={cn("px-4 py-1.5 text-sm font-medium rounded", viewMode === "week" ? "bg-slate-600 text-white" : "text-slate-300 hover:text-white")}
              onClick={() => setViewMode("week")}
            >week</button>
            <button 
              className={cn("px-4 py-1.5 text-sm font-medium rounded", viewMode === "day" ? "bg-slate-600 text-white" : "text-slate-300 hover:text-white")}
              onClick={() => setViewMode("day")}
            >day</button>
          </div>
        </div>

        {isError ? (
          <ErrorState />
        ) : isPending ? (
          <TableSkeleton rows={8} />
        ) : (
          <div className="min-h-[600px]">
            {viewMode === "month" && renderMonthView()}
            {viewMode === "week" && renderWeekView()}
            {viewMode === "day" && renderDayView()}
          </div>
        )}
      </Card>

      {expandedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setExpandedDate(null)}>
          <Card className="w-full max-w-md p-6 bg-white shadow-xl max-h-[80vh] flex flex-col" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Bookings for {format(expandedDate, "MMM d, yyyy")}</h3>
              <button onClick={() => setExpandedDate(null)} className="text-slate-500 hover:text-slate-800 text-xl font-bold">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {(() => {
                const dayBookings = bookingsByDate.get(format(expandedDate, "yyyy-MM-dd")) || [];
                if (dayBookings.length === 0) return <div className="text-slate-500 py-4 text-center">No bookings on this day</div>;
                
                return dayBookings.map((b: any) => (
                  <div 
                    key={b.id || b.booking_number}
                    className="p-3 border rounded-md hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setSelectedBookingId(b.id);
                      setExpandedDate(null);
                    }}
                  >
                    <div>
                      <div className="font-semibold text-sm">
                        BK{b.booking_number} ({b.service?.name || "Service"}) 
                      </div>
                      <div className="text-sm text-slate-600">
                        ({b.profile?.full_name || b.guest_phone || 'Guest'})
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {b.scheduled_start?.substring(0, 5)} - {b.scheduled_end?.substring(0, 5)}
                      </div>
                    </div>
                    <div className={cn("px-2 py-1 text-xs rounded-full font-medium", getStatusColor(b.status))}>
                      {b.status}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>
      )}

      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          open={!!selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
        />
      )}
    </div>
  );
}
