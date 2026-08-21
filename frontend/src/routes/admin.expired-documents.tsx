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
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/frontend/components/admin/shell";

export const Route = createFileRoute("/admin/expired-documents")({ component: AdminExpiredDocumentsPage });

function AdminExpiredDocumentsPage() {
  const queryClient = useQueryClient();
  const { data: docsData } = useAdminQuery("compliance_documents", getAdminComplianceDocuments);
  const documents: ComplianceDocument[] = (docsData as ComplianceDocument[]) ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Viewer / Renewal Modal
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const now = new Date();

  // Filter logic
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Entity filter
      if (entityFilter !== "ALL" && doc.entityType !== entityFilter) return false;

      // Expiry status filter
      if (doc.expiryDate) {
        const expDate = new Date(doc.expiryDate);
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (expiryStatusFilter === "EXPIRED" && diffDays >= 0) return false;
        if (expiryStatusFilter === "EXPIRING_30" && (diffDays < 0 || diffDays > 30)) return false;
        if (expiryStatusFilter === "EXPIRING_60" && (diffDays < 31 || diffDays > 60)) return false;
        if (expiryStatusFilter === "VALID" && diffDays <= 60) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          (doc.entityName || "").toLowerCase().includes(q) ||
          (doc.documentType || "").toLowerCase().includes(q) ||
          (doc.documentNumber || "").toLowerCase().includes(q) ||
          (doc.companyName || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [documents, entityFilter, expiryStatusFilter, searchTerm]);

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
        "Entity Name": d.entityName,
        "Entity Type": d.entityType,
        Company: d.companyName || "—",
        "Document Type": d.documentType,
        "Document Number": d.documentNumber,
        "Issue Date": d.issueDate,
        "Expiry Date": d.expiryDate,
        Status: d.status,
      })),
    );
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
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs"
          >
            <Download className="size-3.5 me-1.5 text-slate-500" /> Export Compliance Audit
          </Button>
        </div>
      </div>

      {/* KPI Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Card
          onClick={() => setExpiryStatusFilter("ALL")}
          className={`p-4 cursor-pointer transition-all ${
            expiryStatusFilter === "ALL"
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
          onClick={() => setExpiryStatusFilter("EXPIRED")}
          className={`p-4 cursor-pointer transition-all ${
            expiryStatusFilter === "EXPIRED"
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
          onClick={() => setExpiryStatusFilter("EXPIRING_30")}
          className={`p-4 cursor-pointer transition-all ${
            expiryStatusFilter === "EXPIRING_30"
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
          onClick={() => setExpiryStatusFilter("VALID")}
          className={`p-4 cursor-pointer transition-all ${
            expiryStatusFilter === "VALID"
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
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search document, person, company…"
                className="ps-9 h-9 text-xs bg-slate-50/50"
              />
            </div>

            {/* Entity Filter */}
            <Select value={entityFilter} onValueChange={(val) => { setEntityFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 text-xs w-40 bg-slate-50">
                <SelectValue placeholder="All Entity Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Entities</SelectItem>
                <SelectItem value="Company" className="text-xs">Companies Only</SelectItem>
                <SelectItem value="Professional" className="text-xs">Professionals Only</SelectItem>
                <SelectItem value="TeamLead" className="text-xs">Team Leads Only</SelectItem>
                <SelectItem value="Supervisor" className="text-xs">Supervisors Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={expiryStatusFilter} onValueChange={(val) => { setExpiryStatusFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 text-xs w-44 bg-slate-50">
                <SelectValue placeholder="All Statuses" />
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
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center text-slate-400">#</th>
                <th className="px-4 py-3 min-w-[160px]">Entity Name</th>
                <th className="px-3 py-3 min-w-[120px]">Entity Type</th>
                <th className="px-4 py-3 min-w-[180px]">Document Type</th>
                <th className="px-4 py-3 min-w-[140px]">Document Number</th>
                <th className="px-3 py-3 min-w-[110px]">Expiry Date</th>
                <th className="px-3 py-3 text-center min-w-[130px]">Compliance Status</th>
                <th className="px-4 py-3 text-center min-w-[130px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
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
                        <div>
                          <p className="font-bold text-slate-900">{doc.entityName}</p>
                          {doc.companyName && doc.companyName !== doc.entityName && (
                            <p className="text-[11px] text-slate-400">{doc.companyName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {doc.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-1.5 pt-3.5">
                        <FileText className="size-3.5 text-cyan-600 shrink-0" />
                        <span>{doc.documentType}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{doc.documentNumber || "—"}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{doc.expiryDate}</td>
                      <td className="px-3 py-3 text-center">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                            <AlertCircle className="size-3" /> Expired ({Math.abs(diffDays)}d ago)
                          </span>
                        ) : diffDays <= 30 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                            <AlertTriangle className="size-3" /> Expires in {diffDays}d
                          </span>
                        ) : diffDays <= 60 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-800">
                            <Clock className="size-3" /> {diffDays}d remaining
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="size-3" /> Valid ({diffDays}d)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
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
