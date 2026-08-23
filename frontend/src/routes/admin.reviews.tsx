import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { getAdminReviews } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { ErrorState, TableSkeleton, downloadCsv, PageHeader, PageActions, StatusBadge, ActionIconButton } from "@/frontend/components/admin/shell";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import { Search, RefreshCw, Filter, Star, Eye, ChevronsUpDown, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminReviews() {
  const { data, isPending, isError } = useAdminQuery("reviews", getAdminReviews);
  const rows = (data ?? []) as Row[];

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  // Pagination & Sorting States
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<string>("date");
  const [sortDesc, setSortDesc] = useState(true);

  // Dialog State
  const [selectedReview, setSelectedReview] = useState<Row | null>(null);

  // KPI Calculations
  const averageRating = rows.length > 0 
    ? rows.reduce((acc, row) => acc + (row.rating || 0), 0) / rows.length 
    : 0;
  const fiveStarReviews = rows.filter(r => r.rating === 5).length;
  const belowThreeStarReviews = rows.filter(r => (r.rating || 0) < 3).length;

  // Filtering
  const filteredData = useMemo(() => {
    return rows.filter((row) => {
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const customer = (row.profile?.full_name || "").toLowerCase();
        const service = (row.service?.name || "").toLowerCase();
        const pro = (row.professionals?.full_name || "").toLowerCase();
        const comment = (row.comment || "").toLowerCase();
        if (
          !customer.includes(lowerSearch) &&
          !service.includes(lowerSearch) &&
          !pro.includes(lowerSearch) &&
          !comment.includes(lowerSearch)
        ) {
          return false;
        }
      }

      if (ratingFilter !== "All") {
        if (String(row.rating) !== ratingFilter) return false;
      }

      if (startDate && row.created_at) {
        if (new Date(row.created_at) < new Date(startDate)) return false;
      }
      if (endDate && row.created_at) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(row.created_at) > end) return false;
      }

      return true;
    });
  }, [rows, searchTerm, ratingFilter, startDate, endDate]);

  // Sorting
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA, valB;
      switch (sortCol) {
        case "rating":
          valA = a.rating || 0;
          valB = b.rating || 0;
          break;
        case "service":
          valA = (a.service?.name || "").toLowerCase();
          valB = (b.service?.name || "").toLowerCase();
          break;
        case "professional":
          valA = (a.professionals?.full_name || "").toLowerCase();
          valB = (b.professionals?.full_name || "").toLowerCase();
          break;
        case "customer":
          valA = (a.profile?.full_name || "").toLowerCase();
          valB = (b.profile?.full_name || "").toLowerCase();
          break;
        case "comment":
          valA = (a.comment || "").toLowerCase();
          valB = (b.comment || "").toLowerCase();
          break;
        case "date":
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
          break;
        default:
          valA = 0;
          valB = 0;
      }
      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [filteredData, sortCol, sortDesc]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(false);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setRatingFilter("All");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  if (isError) return <ErrorState />;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Rating & Reviews"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Rating & Reviews" }]}
        actions={
          <PageActions
            onSearchToggle={() => setShowFilters(!showFilters)}
            isSearchOpen={showFilters}
          />
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Average Rating</p>
              <h3 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                {averageRating.toFixed(1)} <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">5-Star Reviews</p>
              <h3 className="text-3xl font-bold text-slate-900">{fiveStarReviews}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Star className="w-6 h-6 text-green-500 fill-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Below 3-Star</p>
              <h3 className="text-3xl font-bold text-slate-900">{belowThreeStarReviews}</h3>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <Star className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Search</label>
              <Input
                placeholder="Search comment/name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Rating</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Start Date</label>
              <AdminDateInput value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">End Date</label>
              <AdminDateInput value={endDate} onChange={setEndDate} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset} className="border-slate-300">
              <RefreshCw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button className="rounded-full px-6">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isPending ? (
            <TableSkeleton rows={8} />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("rating")}
                  >
                    <div className="flex items-center justify-between">
                      Rating
                      <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("service")}
                  >
                    <div className="flex items-center justify-between">
                      Service
                      <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("professional")}
                  >
                    <div className="flex items-center justify-between">
                      Professional
                      <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("customer")}
                  >
                    <div className="flex items-center justify-between">
                      Customer
                      <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("comment")}
                  >
                    <div className="flex items-center justify-between">
                      Comment
                      <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center justify-between">
                      Date
                      <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, i) => (
                    <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {(currentPage - 1) * pageSize + i + 1}
                      </td>
                      <td className="px-4 py-3">
                        {renderStars(row.rating || 0)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.service?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.professionals?.full_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.profile?.full_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.comment && row.comment.length > 100
                          ? row.comment.substring(0, 100) + "..."
                          : row.comment || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row.created_at ? format(new Date(row.created_at), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionIconButton icon={Eye} label="View" action="view" onClick={() => setSelectedReview(row)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {!isPending && sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 gap-4">
            <div className="flex items-center text-sm text-slate-500">
              <span>Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="mx-2 w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="text-sm text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                &laquo;
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                &lsaquo;
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage - 2 + i;
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                
                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                &rsaquo;
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                &raquo;
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={(o) => !o && setSelectedReview(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-500" />
              Review Details
            </DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Customer</p>
                  <p className="font-semibold text-slate-900">{selectedReview.profile?.full_name || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium">Date</p>
                  <p className="font-medium text-slate-900">
                    {selectedReview.created_at ? format(new Date(selectedReview.created_at), "dd MMM yyyy, h:mm a") : "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase mb-1">Service</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedReview.service?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase mb-1">Professional</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedReview.professionals?.full_name || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Rating</p>
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating || 0)}
                  <span className="font-bold text-slate-700">{selectedReview.rating}/5</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Comment</p>
                <p className="text-slate-700 text-sm bg-white border border-slate-200 p-4 rounded-lg shadow-sm whitespace-pre-wrap">
                  {selectedReview.comment || <span className="text-slate-400 italic">No comment provided</span>}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
