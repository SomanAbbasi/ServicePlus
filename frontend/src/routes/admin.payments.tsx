import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { getAdminPayments } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { ErrorState, downloadCsv, TableSkeleton, PageHeader, PageActions, StatusBadge, ActionIconButton } from "@/frontend/components/admin/shell";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import { formatMoney, num } from "@/frontend/lib/money";
import { Search, Download, RefreshCw, Filter, Eye, ChevronsUpDown } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminPayments() {
  const { data, isPending, isError } = useAdminQuery("payments", getAdminPayments);

  const [showFilters, setShowFilters] = useState(false);
  const [filterRef, setFilterRef] = useState("");
  const [filterTx, setFilterTx] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortAsc, setSortAsc] = useState(true);

  const handleReset = () => {
    setFilterRef("");
    setFilterTx("");
    setFilterUser("");
    setFilterStatus("All");
    setFilterStart("");
    setFilterEnd("");
    setPage(1);
  };

  const rows = useMemo(() => {
    if (!data) return [];
    let result = [...data] as Row[];

    if (filterRef) {
      const lower = filterRef.toLowerCase();
      result = result.filter(r => 
        (r.bookings?.booking_number || r.id).toLowerCase().includes(lower)
      );
    }
    if (filterTx) {
      const lower = filterTx.toLowerCase();
      result = result.filter(r => 
        (r.provider_reference || "").toLowerCase().includes(lower)
      );
    }
    if (filterUser) {
      const lower = filterUser.toLowerCase();
      result = result.filter(r => 
        (r.bookings?.profile?.full_name || "Customer").toLowerCase().includes(lower)
      );
    }
    if (filterStatus && filterStatus !== "All") {
      result = result.filter(r => {
        if (filterStatus === "Success") return r.status === "PAID";
        if (filterStatus === "Refunded") return r.status === "REFUNDED";
        if (filterStatus === "Failed") return r.status === "FAILED";
        if (filterStatus === "Pending") return r.status === "PENDING";
        return true;
      });
    }
    if (filterStart) {
      const start = new Date(filterStart).getTime();
      result = result.filter(r => new Date(r.created_at).getTime() >= start);
    }
    if (filterEnd) {
      const end = new Date(filterEnd).getTime();
      // Add 1 day to end date to make it inclusive
      result = result.filter(r => new Date(r.created_at).getTime() <= end + 86400000);
    }

    if (sortKey) {
      result.sort((a, b) => {
        let valA, valB;
        if (sortKey === "date") {
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
        } else if (sortKey === "amount") {
          valA = num(a.amount);
          valB = num(b.amount);
        } else if (sortKey === "ref") {
          valA = a.bookings?.booking_number || a.id;
          valB = b.bookings?.booking_number || b.id;
        } else {
          valA = a[sortKey];
          valB = b[sortKey];
        }
        
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filterRef, filterTx, filterUser, filterStatus, filterStart, filterEnd, sortKey, sortAsc]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const totalPages = Math.ceil(rows.length / pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <StatusBadge status="Success" />;
      case "REFUNDED":
        return <StatusBadge status="Refunded" />;
      case "PENDING":
        return <StatusBadge status="Pending" />;
      case "FAILED":
        return <StatusBadge status="Failed" />;
      default:
        return <StatusBadge status={status} />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    hh = hh ? hh : 12;
    const hhStr = String(hh).padStart(2, '0');
    return `${mm}-${dd}-${yyyy} ${hhStr}:${min} ${ampm}`;
  };

  if (isError) return <ErrorState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Management"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Payment Management" }]}
        actions={
          <PageActions
            onSearchToggle={() => setShowFilters(!showFilters)}
            isSearchOpen={showFilters}
            onExport={() => {
              downloadCsv("payments.csv", rows.map(r => ({
                "Payment Reference Number": r.bookings?.booking_number ? `TI${new Date(r.created_at).getTime()}` : r.id,
                "Gateway Transaction ID": r.provider_reference || "",
                "User Name": r.bookings?.profile?.full_name || "Customer",
                "Final Amount": num(r.amount),
                "Refund Amount": r.status === "REFUNDED" ? num(r.amount) : 0,
                "Status": r.status,
                "Created On": formatDate(r.created_at)
              })));
            }}
          />
        }
      />

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4 bg-white shadow-sm border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Payment Reference Number</label>
              <Input
                placeholder="Enter Reference"
                value={filterRef}
                onChange={e => setFilterRef(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Gateway Transaction ID</label>
              <Input
                placeholder="Enter Transaction ID"
                value={filterTx}
                onChange={e => setFilterTx(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">User Name</label>
              <Input
                placeholder="Enter Name"
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <AdminDateInput value={filterStart} onChange={setFilterStart} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">End Date</label>
              <AdminDateInput value={filterEnd} onChange={setFilterEnd} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </Card>
      )}

      {/* Table Card */}
      <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
        {isPending ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("ref")}>
                    <div className="flex items-center gap-1">
                      Payment Reference Number
                      <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("provider_reference")}>
                    <div className="flex items-center gap-1">
                      Gateway Transaction ID
                      <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("user")}>
                    <div className="flex items-center gap-1">
                      User Name
                      <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("amount")}>
                    <div className="flex items-center gap-1">
                      Final Amount
                      <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Refund Amount</th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">
                      Status
                      <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Refund Status</th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("date")}>
                    <div className="flex items-center gap-1">
                      Created On
                      <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.length > 0 ? (
                  paginated.map((r, i) => {
                    const rowIdx = (page - 1) * pageSize + i + 1;
                    const refNumber = r.bookings?.booking_number ? `TI${new Date(r.created_at).getTime()}` : r.id;
                    const gatewayId = r.provider_reference || "—";
                    const userName = r.bookings?.profile?.full_name || "Customer";
                    const finalAmount = formatMoney(num(r.amount));
                    const refundAmt = r.status === "REFUNDED" ? finalAmount : formatMoney(0);
                    const refundStatus = r.status === "REFUNDED" ? "Refunded" : "—";

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-500">{rowIdx}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{refNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{gatewayId}</td>
                        <td className="px-4 py-3 text-slate-700">{userName}</td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{finalAmount}</td>
                        <td className="px-4 py-3 text-slate-600">{refundAmt}</td>
                        <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                        <td className="px-4 py-3 text-slate-600">{refundStatus}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-3 text-center">
                          <ActionIconButton icon={Eye} label="View" action="view" />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isPending && rows.length > 0 && (
          <div className="border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select value={pageSize.toString()} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>Showing {Math.min((page - 1) * pageSize + 1, rows.length)} to {Math.min(page * pageSize, rows.length)} of {rows.length} entries</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                &lt;
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center gap-1">
                    {i > 0 && p - arr[i - 1]! > 1 && <span className="px-2">...</span>}
                    <Button
                      variant={p === page ? "default" : "outline"}
                      className="h-8 w-8"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </div>
                ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                &gt;
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
