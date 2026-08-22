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
  AlertCircle,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  FileWarning,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";

export const Route = createFileRoute("/admin/expired-documents")({ component: AdminExpiredDocumentsPage });

function AdminExpiredDocumentsPage() {
  const queryClient = useQueryClient();
  const { data: docsData } = useAdminQuery("compliance_documents", getAdminComplianceDocuments);
  const documents: ComplianceDocument[] = (docsData as ComplianceDocument[]) ?? [];

  const [showFilters, setShowFilters] = useState(true);

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

  const now = new Date();

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
          <span>Expired Documents Compliance Hub</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Document Compliance Hub</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Monitor, renew, and audit official licenses, visas, IDs, and permits across all registered entities.
            </p>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs h-9 px-4 rounded-full shadow-sm"
          >
            <Search className="size-4 mr-1.5" /> Search
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
        {/* Filters Toolbar */}
        {showFilters && (
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 mb-4 bg-slate-50 p-3 rounded-lg">
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
                    <SelectItem value="TeamLead" className="text-xs">Team Lead</SelectItem>
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
                  className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
                >
                  <Filter className="size-3.5 mr-1.5" />
                  Filter
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page Size & Table Header */}
        <div className="flex justify-between items-center mb-2">
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

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-4 py-3 min-w-[120px]">
                  <div className="flex items-center gap-1">
                    Staff Role <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[160px]">
                  <div className="flex items-center gap-1">
                    Staff Name <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[160px]">
                  <div className="flex items-center gap-1">
                    Document Type <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[140px]">
                  <div className="flex items-center gap-1">
                    Document Number <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[110px]">
                  <div className="flex items-center gap-1">
                    Issue Date <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[110px]">
                  <div className="flex items-center gap-1">
                    Expiry Date <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center min-w-[130px]">
                  <div className="flex items-center justify-center gap-1">
                    Document Status <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[120px]">
                  <div className="flex items-center gap-1">
                    Document File <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[120px]">
                  <div className="flex items-center gap-1">
                    Remarks <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[150px]">
                  <div className="flex items-center gap-1">
                    Created At <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-24 sticky right-0 bg-white">
                  <div className="flex items-center justify-center gap-1 text-slate-600 font-bold">
                    Action
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No compliance documents match your selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const expDate = new Date(doc.expiryDate);
                  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  const isExpired = diffDays < 0;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 text-center font-bold text-slate-400">{globalIdx}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {doc.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-slate-900">{doc.entityName}</p>
                          {doc.companyName && doc.companyName !== doc.entityName && (
                            <p className="text-[11px] text-slate-400">{doc.companyName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-1.5 pt-3.5">
                        <FileText className="size-3.5 text-cyan-600 shrink-0" />
                        <span>{doc.documentType}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{doc.documentNumber || "—"}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{doc.issueDate || "—"}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{doc.expiryDate}</td>
                      <td className="px-3 py-3 text-center">
                        {isExpired ? (
                          <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-rose-500 text-white shadow-sm">
                            Expired
                          </span>
                        ) : diffDays <= 30 ? (
                          <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-amber-500 text-white shadow-sm">
                            Expiring ({diffDays}d)
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-emerald-500 text-white shadow-sm">
                            Valid
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleOpenViewer(doc)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1"
                        >
                          View File
                        </button>
                      </td>
                      <td className="px-3 py-3 truncate max-w-[150px]" title={doc.remarks || "—"}>
                        {doc.remarks || "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {(doc as any).createdAt ? new Date((doc as any).createdAt).toLocaleString() : new Date(doc.issueDate || now).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center sticky right-0 bg-white">
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/70 border border-slate-200/60 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenViewer(doc)}
                            title="Preview & Renew Document"
                            className="p-1.5 rounded-lg text-cyan-700 hover:bg-cyan-100/80 transition-colors"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReminder(doc)}
                            title="Send Expiry Reminder Notification"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100/80 transition-colors"
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

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
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
