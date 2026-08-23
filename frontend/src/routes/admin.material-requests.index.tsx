import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminMaterialRequest } from "@/frontend/lib/admin-mock-data";
import {
  getAdminMaterialRequests,
  createAdminMaterialRequest,
  updateAdminMaterialRequestStatus,
  getAdminProfessionals,
  getAdminTeamLeads,
  getAdminMaterials,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/frontend/components/ui/dialog";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import {
  Check,
  Download,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Trash2,
  Truck,
  X,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";

export const Route = createFileRoute("/admin/material-requests/")({ component: AdminMaterialRequestsPage });

function AdminMaterialRequestsPage() {
  const queryClient = useQueryClient();
  const { data: reqsData } = useAdminQuery("material_requests", getAdminMaterialRequests);
  const { data: prosData } = useAdminQuery("professionals", getAdminProfessionals);
  const { data: leadsData } = useAdminQuery("team_leads", getAdminTeamLeads);
  const { data: matsData } = useAdminQuery("materials", getAdminMaterials);

  const requests: AdminMaterialRequest[] = (reqsData as AdminMaterialRequest[]) ?? [];
  const pros = (prosData as any[]) ?? [];
  const teamLeads = (leadsData as any[]) ?? [];
  const materials = (matsData as any[]) ?? [];

  // Search box closed by default
  const [showFilters, setShowFilters] = useState(false);
  const [searchProvider, setSearchProvider] = useState("");
  const [searchLead, setSearchLead] = useState("");
  const [searchMaterial, setSearchMaterial] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // New Request Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProName, setSelectedProName] = useState("");
  const [selectedLeadName, setSelectedLeadName] = useState("");
  const [selectedMatId, setSelectedMatId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [notes, setNotes] = useState("");

  const hasActiveFilters = Boolean(
    searchProvider.trim() ||
    searchLead.trim() ||
    searchMaterial.trim() ||
    statusFilter !== "ALL"
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

      const proName = (r.serviceProviderName || r.requestedBy || "").toLowerCase();
      const leadName = (r.teamLeaderName || "").toLowerCase();
      const matName = (r.materialName || (r.items && r.items[0]?.materialName) || "").toLowerCase();

      if (searchProvider.trim() && !proName.includes(searchProvider.toLowerCase().trim())) return false;
      if (searchLead.trim() && !leadName.includes(searchLead.toLowerCase().trim())) return false;
      if (searchMaterial.trim() && !matName.includes(searchMaterial.toLowerCase().trim())) return false;

      return true;
    });
  }, [requests, statusFilter, searchProvider, searchLead, searchMaterial]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const handleUpdateStatus = async (id: string, newStatus: AdminMaterialRequest["status"]) => {
    await updateAdminMaterialRequestStatus(id, newStatus);
    toast.success(`Material request status marked as ${newStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "material_requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProName.trim() || !selectedMatId) {
      toast.error("Please enter Service Provider and select Material.");
      return;
    }

    const matchedMat = materials.find((m) => m.id === selectedMatId);
    const matName = matchedMat?.name || "Cleaning Supply";
    const now = new Date();
    const requestOnStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    await createAdminMaterialRequest({
      serviceProviderName: selectedProName.trim(),
      requestedBy: selectedProName.trim(),
      requesterRole: "Professional",
      companyName: "ServicePlus Network",
      teamLeaderName: selectedLeadName.trim() || "—",
      materialName: matName,
      materialId: selectedMatId,
      quantity: parseInt(quantity) || 1,
      items: [
        {
          materialId: selectedMatId,
          materialName: matName,
          quantity: parseInt(quantity) || 1,
        },
      ],
      urgency,
      status: "Pending",
      requestOn: requestOnStr,
      notes,
    });

    toast.success(`Material request for ${matName} created!`);
    setIsAddOpen(false);
    setSelectedProName("");
    setSelectedLeadName("");
    setSelectedMatId("");
    setQuantity("1");
    setNotes("");
    queryClient.invalidateQueries({ queryKey: ["admin", "material_requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const handleExport = () => {
    downloadCsv(
      "serviceplus_material_requests.csv",
      filteredRequests.map((r, i) => ({
        "#": i + 1,
        "Service Provider Name": r.serviceProviderName || r.requestedBy,
        "Team Leader Name": r.teamLeaderName || "—",
        "Material Name": r.materialName || (r.items && r.items[0]?.materialName) || "—",
        Quantity: r.quantity || (r.items && r.items[0]?.quantity) || 1,
        Status: r.status,
        "Request On": r.requestOn || r.requestDate || "—",
      })),
    );
  };

  const resetFilters = () => {
    setSearchProvider("");
    setSearchLead("");
    setSearchMaterial("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-600">Material Request</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Material Request</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review and manage supply replenishment requests from field staff and team leaders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`font-semibold text-xs h-9 px-4 rounded-lg shadow-sm transition-all gap-1.5 ${
                showFilters
                  ? "bg-slate-800 hover:bg-slate-900 text-white"
                  : "bg-[#0088cc] hover:bg-[#0077b5] text-white"
              }`}
            >
              <Search className="size-3.5" />
              <span>Search</span>
              {hasActiveFilters && <span className="size-2 rounded-full bg-amber-400" />}
            </Button>
            <Button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs h-9 px-4 rounded-lg shadow-sm"
            >
              <Plus className="size-4 me-1" /> Add Request
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs">
        {/* Search / Filter Drawer (Closed by default) */}
        {showFilters && (
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 mb-4 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Input
                  value={searchProvider}
                  onChange={(e) => {
                    setSearchProvider(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Service Provider Name"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div>
                <Input
                  value={searchLead}
                  onChange={(e) => {
                    setSearchLead(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Team Leader Name"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div>
                <Input
                  value={searchMaterial}
                  onChange={(e) => {
                    setSearchMaterial(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Material Name"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="Pending" className="text-xs text-amber-700 font-bold">Pending</SelectItem>
                    <SelectItem value="Approved" className="text-xs text-emerald-700 font-bold">Approved</SelectItem>
                    <SelectItem value="Rejected" className="text-xs text-rose-700 font-bold">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <Download className="size-3.5 mr-1.5 text-slate-500" />
                Export CSV
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 text-xs font-semibold text-slate-600"
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Reset
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  className="h-8 text-xs font-semibold bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-md px-4"
                >
                  Filter
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page Size & Table Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20 text-xs bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="20" className="text-xs">20</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
              </SelectContent>
            </Select>
            <span>Entries</span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing 1 to {filteredRequests.length} of {filteredRequests.length} Entries
          </div>
        </div>

        {/* Table Matching Reference Screenshot 3 */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 font-semibold bg-slate-50/70 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center text-slate-400">#</th>
                <th className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    Service Provider Name <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    Team Leader Name <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    Material Name <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-20">
                  <div className="flex items-center justify-center gap-1">
                    Quantity <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-28">
                  <div className="flex items-center justify-center gap-1">
                    Status <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 w-44">
                  <div className="flex items-center gap-1">
                    Request On <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-24">
                  <div className="flex items-center justify-center gap-1 text-slate-600 font-bold">
                    Action
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No material requests found.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const providerName = req.serviceProviderName || req.requestedBy || "Service Provider";
                  const teamLead = req.teamLeaderName || "—";
                  const matName = req.materialName || (req.items && req.items[0]?.materialName) || "Supply Item";
                  const qty = req.quantity || (req.items && req.items[0]?.quantity) || 1;
                  const reqDate = req.requestOn || req.requestDate || "07-14-2026 4:54 PM";

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-3.5 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-4 py-3.5 font-normal text-slate-900 text-xs">{providerName}</td>
                      <td className="px-4 py-3.5 font-normal text-slate-700 text-xs">{teamLead}</td>
                      <td className="px-4 py-3.5 font-normal text-slate-800 text-xs">{matName}</td>
                      <td className="px-3 py-3.5 text-center font-bold text-slate-900 text-xs">{qty}</td>
                      <td className="px-3 py-3.5 text-center">
                        {req.status === "Pending" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#fff8e5] text-[#d97706]">
                            Pending
                          </span>
                        ) : req.status === "Approved" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#e8f8f0] text-[#1bb366]">
                            Approved
                          </span>
                        ) : req.status === "Dispatched" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800">
                            Dispatched
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-normal text-xs whitespace-nowrap">{reqDate}</td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {req.status === "Pending" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(req.id, "Approved")}
                                title="Approve Request"
                                className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Check className="size-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(req.id, "Rejected")}
                                title="Reject Request"
                                className="size-6 grid place-items-center rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                <X className="size-3.5 stroke-[2.5]" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, "Pending")}
                              title="Reset to Pending"
                              className="text-[11px] font-semibold text-[#0088cc] hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination: [Previous] [1] [Next] matching Screenshot 3 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} Entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 px-3 text-xs"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(p)}
                className={`h-8 w-8 p-0 text-xs font-bold ${
                  p === currentPage ? "bg-[#0088cc] text-white hover:bg-[#0077b5]" : "text-slate-600"
                }`}
              >
                {p}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Manual Admin Add Request Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Create Material Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Manually dispatch or record a supplies replenishment request for a service provider.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRequest} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Service Provider Name *</Label>
              <Input
                value={selectedProName}
                onChange={(e) => setSelectedProName(e.target.value)}
                placeholder="e.g. Naomi Blanchard"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Team Leader Name (Optional)</Label>
              <Input
                value={selectedLeadName}
                onChange={(e) => setSelectedLeadName(e.target.value)}
                placeholder="e.g. Hammett Pratt"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700">Material Supply *</Label>
                <Select value={selectedMatId} onValueChange={setSelectedMatId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs font-medium">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Notes / Instructions</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs"
              >
                Create Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

