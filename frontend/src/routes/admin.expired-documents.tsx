import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ComplianceDocument } from "@/frontend/lib/admin-mock-data";
import {
  getAdminComplianceDocuments,
  renewComplianceDocument,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { DocumentViewerModal } from "@/frontend/components/admin/DocumentViewerModal";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import {
  AlertTriangle,
  BellRing,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Filter,
  ArrowUpDown,
  MessageSquare,
  Copy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";

export const Route = createFileRoute("/admin/expired-documents")({ component: AdminExpiredDocumentsPage });

function AdminExpiredDocumentsPage() {
  const queryClient = useQueryClient();
  const { data: docsData } = useAdminQuery("compliance_documents", getAdminComplianceDocuments);
  const documents: ComplianceDocument[] = (docsData as ComplianceDocument[]) ?? [];

  // Search box closed by default for clean and clear view
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [staffName, setStaffName] = useState("");
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Viewer / Renewal Modal
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Full Remarks Modal State
  const [remarksModalDoc, setRemarksModalDoc] = useState<ComplianceDocument | null>(null);

  const now = new Date();

  const hasActiveFilters = Boolean(
    roleFilter !== "ALL" ||
    staffName.trim() ||
    docType.trim() ||
    docNumber.trim() ||
    expiryDate ||
    statusFilter !== "ALL" ||
    createdFrom ||
    createdTo
  );

  // Filter logic
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Role filter
      if (roleFilter !== "ALL" && doc.entityType !== roleFilter) return false;

      // Status filter
      if (doc.expiryDate) {
        const expDate = new Date(doc.expiryDate);
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (statusFilter === "EXPIRED" && diffDays >= 0) return false;
        if (statusFilter === "EXPIRING_30" && (diffDays < 0 || diffDays > 30)) return false;
        if (statusFilter === "EXPIRING_60" && (diffDays < 31 || diffDays > 60)) return false;
        if (statusFilter === "VALID" && diffDays <= 60) return false;
      }

      // Text filters
      if (staffName.trim() && !(doc.entityName || "").toLowerCase().includes(staffName.toLowerCase())) return false;
      if (docType.trim() && !(doc.documentType || "").toLowerCase().includes(docType.toLowerCase())) return false;
      if (docNumber.trim() && !(doc.documentNumber || "").toLowerCase().includes(docNumber.toLowerCase())) return false;

      // Date filters
      if (expiryDate && doc.expiryDate !== expiryDate) return false;

      const docCreatedAt = (doc as any).createdAt ? new Date((doc as any).createdAt).getTime() : new Date(doc.issueDate).getTime();
      if (createdFrom && docCreatedAt) {
        if (docCreatedAt < new Date(createdFrom).getTime()) return false;
      }
      if (createdTo && docCreatedAt) {
        if (docCreatedAt > new Date(createdTo).getTime() + 86400000) return false;
      }

      return true;
    });
  }, [documents, roleFilter, statusFilter, staffName, docType, docNumber, expiryDate, createdFrom, createdTo]);

  // Statistics
  const expiredCount = useMemo(
    () => documents.filter((d) => d.expiryDate && new Date(d.expiryDate) < now).length,
    [documents],
  );

  const expiring30Count = useMemo(
    () =>
      documents.filter((d) => {
        if (!d.expiryDate) return false;
        const diff = Math.ceil((new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diff >= 0 && diff <= 30;
      }).length,
    [documents],
  );

  const validCount = useMemo(
    () =>
      documents.filter((d) => {
        if (!d.expiryDate) return false;
        const diff = Math.ceil((new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diff > 30;
      }).length,
    [documents],
  );

  const totalPages = Math.ceil(filteredDocs.length / pageSize) || 1;
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, currentPage, pageSize]);

  const handleOpenViewer = (doc: ComplianceDocument) => {
    setSelectedDoc(doc);
    setIsViewerOpen(true);
  };

  const handleRenew = async (docId: string, patch: Partial<ComplianceDocument>) => {
    await renewComplianceDocument(docId, patch);
    queryClient.invalidateQueries({ queryKey: ["admin", "compliance_documents"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const handleSendReminder = (doc: ComplianceDocument) => {
    toast.success(`Renewal reminder dispatched!`, {
      description: `Notification alert sent to ${doc.entityName} regarding ${doc.documentType} (Expires: ${doc.expiryDate}).`,
    });
  };

  const handleExport = () => {
    downloadCsv(
      "serviceplus_compliance_documents.csv",
      filteredDocs.map((d, i) => ({
        "#": i + 1,
        "Staff Role": d.entityType,
        "Staff Name": d.entityName,
        Company: d.companyName || "—",
        "Document Type": d.documentType,
        "Document Number": d.documentNumber,
        "Issue Date": d.issueDate,
        "Expiry Date": d.expiryDate,
        Status: d.status,
        Remarks: d.remarks || "—",
      })),
    );
  };

  const resetFilters = () => {
    setRoleFilter("ALL");
    setStaffName("");
    setDocType("");
    setDocNumber("");
    setExpiryDate("");
    setStatusFilter("ALL");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <span className="text-cyan-600 font-semibold">Dashboard</span>
          <span>/</span>
          <span>Expired Documents</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Expired Documents</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Monitor, renew, and audit official licenses, visas, IDs, and permits across all registered entities.
            </p>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`font-semibold text-xs h-9 px-4 rounded-full shadow-sm transition-all gap-1.5 ${
              showFilters
                ? "bg-slate-800 hover:bg-slate-900 text-white"
                : "bg-cyan-500 hover:bg-cyan-600 text-white"
            }`}
          >
            <Search className="size-3.5" />
            <span>Search</span>
            {hasActiveFilters && (
              <span className="size-2 rounded-full bg-amber-400" />
            )}
          </Button>
        </div>
      </div>

      {/* KPI Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Card
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === "ALL"
              ? "border-cyan-400 bg-cyan-50/40 shadow-xs ring-1 ring-cyan-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Registered Docs</span>
            <FileText className="size-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{documents.length}</p>
        </Card>

        <Card
          onClick={() => setStatusFilter("EXPIRED")}
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === "EXPIRED"
              ? "border-rose-400 bg-rose-50/40 shadow-xs ring-1 ring-rose-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Expired Documents</span>
            <ShieldAlert className="size-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{expiredCount}</p>
        </Card>

        <Card
          onClick={() => setStatusFilter("EXPIRING_30")}
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === "EXPIRING_30"
              ? "border-amber-400 bg-amber-50/40 shadow-xs ring-1 ring-amber-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Expiring in ≤ 30 Days</span>
            <AlertTriangle className="size-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{expiring30Count}</p>
        </Card>

        <Card
          onClick={() => setStatusFilter("VALID")}
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === "VALID"
              ? "border-emerald-400 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Compliant & Valid</span>
            <ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{validCount}</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs">
        {/* Filters Toolbar (Closed by default) */}
        {showFilters && (
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 mb-4 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80 animate-in fade-in-50 duration-200">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Roles</SelectItem>
                    <SelectItem value="Company" className="text-xs">Company</SelectItem>
                    <SelectItem value="Professional" className="text-xs">Professional</SelectItem>
                    <SelectItem value="TeamLead" className="text-xs">Team Leader</SelectItem>
                    <SelectItem value="Supervisor" className="text-xs">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  value={staffName}
                  onChange={(e) => { setStaffName(e.target.value); setCurrentPage(1); }}
                  placeholder="Staff Name"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div>
                <Input
                  value={docType}
                  onChange={(e) => { setDocType(e.target.value); setCurrentPage(1); }}
                  placeholder="Document Type"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div>
                <Input
                  value={docNumber}
                  onChange={(e) => { setDocNumber(e.target.value); setCurrentPage(1); }}
                  placeholder="Document Number"
                  className="h-9 text-xs bg-white"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <AdminDateInput
                  value={expiryDate}
                  onChange={(val) => { setExpiryDate(val); setCurrentPage(1); }}
                  placeholder="Expiry Date"
                  className="h-9 bg-white"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="EXPIRED" className="text-xs text-rose-700 font-bold">Expired Documents</SelectItem>
                    <SelectItem value="EXPIRING_30" className="text-xs text-amber-700 font-bold">Expiring in ≤ 30 Days</SelectItem>
                    <SelectItem value="EXPIRING_60" className="text-xs text-yellow-700 font-semibold">Expiring in 31–60 Days</SelectItem>
                    <SelectItem value="VALID" className="text-xs text-emerald-700 font-semibold">Valid & Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <AdminDateInput
                  value={createdFrom}
                  onChange={(val) => { setCreatedFrom(val); setCurrentPage(1); }}
                  placeholder="Document Created From"
                  className="h-9 bg-white"
                />
              </div>
              <div>
                <AdminDateInput
                  value={createdTo}
                  onChange={(val) => { setCreatedTo(val); setCurrentPage(1); }}
                  placeholder="Document Created To"
                  className="h-9 bg-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
              >
                <Download className="size-3.5 mr-1.5 text-slate-500" /> Export CSV
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 text-xs font-semibold text-slate-600"
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  className="h-8 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-full px-4"
                >
                  <Filter className="size-3.5 mr-1.5" />
                  Apply Filter
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page Size & Table Count Header */}
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
            <span>entries</span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total {filteredDocs.length} {filteredDocs.length === 1 ? "document" : "documents"}
          </div>
        </div>

        {/* Documents Table - Single Consistent Page UI */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 font-semibold bg-slate-50/70 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3.5 py-3">Staff Role</th>
                <th className="px-3.5 py-3">Staff Name</th>
                <th className="px-3.5 py-3">Document Type</th>
                <th className="px-3.5 py-3">Document Number</th>
                <th className="px-3 py-3">Issue Date</th>
                <th className="px-3 py-3">Expiry Date</th>
                <th className="px-3 py-3 text-center">Document Status</th>
                <th className="px-3 py-3 text-center">Document File</th>
                <th className="px-3.5 py-3">Remarks</th>
                <th className="px-3 py-3">Created At</th>
                <th className="px-3 py-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                    No compliance documents match your selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const expDate = new Date(doc.expiryDate);
                  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  const isExpired = diffDays < 0;

                  const roleBadgeColor =
                    doc.entityType === "Company"
                      ? "bg-slate-100 text-slate-800 border-slate-200"
                      : doc.entityType === "TeamLead"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : doc.entityType === "Supervisor"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-cyan-50 text-cyan-800 border-cyan-200";

                  const roleLabel =
                    doc.entityType === "TeamLead" ? "Team Leader" : doc.entityType;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-3.5 text-center font-bold text-slate-400">
                        {globalIdx}
                      </td>
                      <td className="px-3.5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${roleBadgeColor}`}>
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5">
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{doc.entityName}</p>
                          {doc.companyName && doc.companyName !== doc.entityName && (
                            <p className="text-[11px] text-slate-400 font-normal">{doc.companyName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <FileText className="size-3.5 text-cyan-600 shrink-0" />
                          <span>{doc.documentType}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 font-mono text-slate-600 text-[11px]">
                        {doc.documentNumber || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-slate-700 font-medium whitespace-nowrap">
                        {doc.issueDate || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-slate-700 font-medium whitespace-nowrap">
                        {doc.expiryDate}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {isExpired ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500 text-white shadow-2xs">
                            Expired
                          </span>
                        ) : diffDays <= 30 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-white shadow-2xs">
                            Expiring ({diffDays}d)
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500 text-white shadow-2xs">
                            Valid
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenViewer(doc)}
                          className="text-cyan-600 hover:text-cyan-800 font-bold text-xs hover:underline cursor-pointer"
                        >
                          View File
                        </button>
                      </td>

                      {/* Remarks Column with View modal if large text */}
                      <td className="px-3.5 py-3.5 max-w-[170px]">
                        {!doc.remarks || doc.remarks.trim() === "-" ? (
                          <span className="text-slate-400 font-mono">—</span>
                        ) : doc.remarks.length <= 25 ? (
                          <span className="text-slate-700 text-xs block leading-tight">{doc.remarks}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-700 text-xs truncate max-w-[110px]" title={doc.remarks}>
                              {doc.remarks.slice(0, 20)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => setRemarksModalDoc(doc)}
                              className="text-cyan-600 hover:text-cyan-800 font-extrabold text-[11px] underline shrink-0 cursor-pointer"
                              title="Click to view full remarks"
                            >
                              View
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {(doc as any).createdAt
                          ? new Date((doc as any).createdAt).toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" })
                          : doc.issueDate || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/70 border border-slate-200/60 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleOpenViewer(doc)}
                            title="Preview & Renew Document"
                            className="p-1 rounded-lg text-cyan-700 hover:bg-cyan-100 transition-colors cursor-pointer"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReminder(doc)}
                            title="Send Expiry Reminder Notification"
                            className="p-1 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <BellRing className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredDocs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredDocs.length)} of {filteredDocs.length} entries
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

      {/* Full Remarks Detail Dialog */}
      <Dialog open={Boolean(remarksModalDoc)} onOpenChange={(open) => !open && setRemarksModalDoc(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl bg-white shadow-2xl border border-slate-200">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-cyan-600 mb-1">
              <MessageSquare className="size-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Document Remarks</span>
            </div>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              {remarksModalDoc?.documentType}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="font-bold text-slate-900">{remarksModalDoc?.entityName}</span>
              <span>•</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                {remarksModalDoc?.entityType === "TeamLead" ? "Team Leader" : remarksModalDoc?.entityType}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-600">
                Doc #{remarksModalDoc?.documentNumber || "—"}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {remarksModalDoc?.remarks || "No remarks provided."}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (remarksModalDoc?.remarks) {
                  navigator.clipboard.writeText(remarksModalDoc.remarks);
                  toast.success("Remarks copied to clipboard!");
                }
              }}
              className="text-xs font-bold text-slate-700 rounded-full gap-1.5"
            >
              <Copy className="size-3.5 text-slate-500" />
              <span>Copy</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setRemarksModalDoc(null)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full px-5"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer & Renewal Modal */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedDoc(null);
        }}
        onRenew={handleRenew}
      />
    </div>
  );
}

