import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminMaterialRequest } from "@/frontend/lib/admin-mock-data";
import {
  getAdminMaterialRequests,
  createAdminMaterialRequest,
  updateAdminMaterialRequestStatus,
  getAdminProfessionals,
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
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Download,
  Package,
  PackageCheck,
  Plus,
  Search,
  Send,
  Sliders,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";

export const Route = createFileRoute("/admin/material-requests/")({ component: AdminMaterialRequestsPage });

function AdminMaterialRequestsPage() {
  const queryClient = useQueryClient();
  const { data: reqsData } = useAdminQuery("material_requests", getAdminMaterialRequests);
  const { data: prosData } = useAdminQuery("professionals", getAdminProfessionals);
  const { data: matsData } = useAdminQuery("materials", getAdminMaterials);

  const requests: AdminMaterialRequest[] = (reqsData as AdminMaterialRequest[]) ?? [];
  const pros = (prosData as any[]) ?? [];
  const materials = (matsData as any[]) ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // New Request Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [proId, setProId] = useState("");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [notes, setNotes] = useState("");
  const [selectedItemMatId, setSelectedItemMatId] = useState("");
  const [selectedItemQty, setSelectedItemQty] = useState("3");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          (r.requestId || "").toLowerCase().includes(q) ||
          (r.requestedBy || "").toLowerCase().includes(q) ||
          (r.companyName || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const handleUpdateStatus = async (id: string, newStatus: AdminMaterialRequest["status"]) => {
    await updateAdminMaterialRequestStatus(id, newStatus);
    toast.success(`Material request status updated to ${newStatus}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "material_requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proId || !selectedItemMatId) {
      toast.error("Please select a professional and at least one item.");
      return;
    }

    const matchedPro = pros.find((p) => p.id === proId);
    const matchedMat = materials.find((m) => m.id === selectedItemMatId);

    await createAdminMaterialRequest({
      requestedBy: matchedPro?.name || "Professional",
      requesterRole: "Professional",
      companyName: matchedPro?.companyName || "ServicePlus",
      items: [
        {
          materialId: selectedItemMatId,
          materialName: matchedMat?.name || "Cleaning Supply",
          quantity: parseInt(selectedItemQty) || 1,
        },
      ],
      urgency,
      status: "Pending",
      notes,
    });

    toast.success("Material replenishment request created!");
    setIsAddOpen(false);
    setProId("");
    setSelectedItemMatId("");
    setSelectedItemQty("3");
    setNotes("");
    queryClient.invalidateQueries({ queryKey: ["admin", "material_requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const handleExport = () => {
    downloadCsv(
      "serviceplus_material_requests.csv",
      filteredRequests.map((r, i) => ({
        "#": i + 1,
        "Request ID": r.requestId,
        "Requested By": r.requestedBy,
        Role: r.requesterRole,
        Company: r.companyName,
        Urgency: r.urgency,
        "Request Date": r.requestDate,
        Status: r.status,
      })),
    );
  };

  return (
    <div className="space-y-5 text-slate-800">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-600">Material Management</span>
          <span>/</span>
          <span className="text-slate-600">Material Request</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Material Requests</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review, approve, and dispatch inventory replenishment requests from field professionals and team leads.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs"
            >
              <Download className="size-3.5 me-1.5 text-slate-500" /> Export Requests
            </Button>
            <Link to="/admin/material-requests/create">
              <Button
                type="button"
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm"
              >
                <Plus className="size-3.5 me-1.5" /> Raise New Request
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card className="p-4 bg-white border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search request ID, cleaner, company…"
                className="ps-9 h-9 text-xs bg-slate-50/50"
              />
            </div>

            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 text-xs w-40 bg-slate-50">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="Pending" className="text-xs text-amber-600 font-bold">Pending Approval</SelectItem>
                <SelectItem value="Approved" className="text-xs text-cyan-600 font-bold">Approved</SelectItem>
                <SelectItem value="Dispatched" className="text-xs text-emerald-600 font-bold">Dispatched</SelectItem>
                <SelectItem value="Rejected" className="text-xs text-rose-600 font-bold">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            <span>entries</span>
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center text-slate-400">#</th>
                <th className="px-4 py-3 min-w-[130px]">
                  <div className="flex items-center gap-1">
                    Request ID <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[160px]">
                  <div className="flex items-center gap-1">
                    Requested By <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[160px]">
                  <div className="flex items-center gap-1">
                    Company <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[220px]">
                  <div className="flex items-center gap-1">
                    Requested Items <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    Urgency <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[140px]">
                  <div className="flex items-center gap-1">
                    Request Date <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center min-w-[110px]">
                  <div className="flex items-center justify-center gap-1">
                    Status <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-24">
                  <div className="flex items-center justify-center gap-1 text-slate-600 font-bold">
                    Action <ChevronsUpDown className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No material requests found.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-700">{req.requestId}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{req.requestedBy}</p>
                        <p className="text-[11px] text-slate-400 font-semibold">{req.requesterRole}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{req.companyName}</td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1">
                          {req.items.map((it, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="grid size-4 place-items-center rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold shrink-0">
                                {it.quantity}
                              </span>
                              <span className="font-medium text-slate-800 truncate">{it.materialName}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.urgency === "Urgent" ? "bg-rose-100/70 text-rose-700 animate-pulse" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{req.requestDate}</td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {req.status === "Pending" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/70 text-amber-800">
                            Pending
                          </span>
                        ) : req.status === "Approved" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100/70 text-cyan-700">
                            Approved
                          </span>
                        ) : req.status === "Dispatched" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/70 text-emerald-700">
                            Dispatched
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100/70 text-rose-700">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to="/admin/material-requests/edit"
                            search={{ id: req.id }}
                            title="Review & Edit Status"
                            className="text-cyan-600 hover:scale-125 transition-transform inline-flex items-center justify-center"
                          >
                            <Sliders className="size-4 text-cyan-600 stroke-[2.5]" />
                          </Link>
                          {req.status === "Pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(req.id, "Approved")}
                                title="Approve Request"
                                className="text-emerald-600 hover:scale-125 transition-transform"
                              >
                                <Check className="size-4 text-emerald-600 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(req.id, "Rejected")}
                                title="Reject Request"
                                className="text-rose-500 hover:scale-125 transition-transform"
                              >
                                <X className="size-4 text-rose-500 stroke-[2.5]" />
                              </button>
                            </>
                          )}
                          {req.status === "Approved" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, "Dispatched")}
                              title="Mark as Dispatched"
                              className="text-cyan-600 hover:scale-125 transition-transform"
                            >
                              <Truck className="size-4 text-cyan-600 stroke-[2.5]" />
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 px-2 text-xs"
            >
              ‹
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(p)}
                className={`h-8 w-8 p-0 text-xs font-bold ${
                  p === currentPage ? "bg-cyan-600 text-white hover:bg-cyan-700" : "text-slate-600"
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
              className="h-8 px-2 text-xs"
            >
              ›
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Request Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <PackageCheck className="size-5 text-cyan-600" /> Raise Material Replenishment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create a stock replenishment order for an active cleaning crew.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRequest} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Requesting Professional / Cleaner *</Label>
              <Select value={proId} onValueChange={setProId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Professional" />
                </SelectTrigger>
                <SelectContent>
                  {pros.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-semibold">
                      {p.name} ({p.companyName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700">Select Supply Item *</Label>
                <Select value={selectedItemMatId} onValueChange={setSelectedItemMatId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Item" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs font-medium">
                        {m.name} ({m.stock} {m.unit} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Quantity</Label>
                <Input
                  type="number"
                  value={selectedItemQty}
                  onChange={(e) => setSelectedItemQty(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Urgency Level</Label>
              <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal" className="text-xs">Normal (Standard Restock)</SelectItem>
                  <SelectItem value="Urgent" className="text-xs text-rose-600 font-bold">Urgent (Tomorrow Morning Shift)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Operational Notes / Reason</Label>
              <Input
                placeholder="Enter operational notes or reason (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                autoComplete="off"
                name="mat_req_notes"
                data-lpignore="true"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
