import React from "react";
import { ComplianceDocument } from "@/frontend/lib/admin-mock-data";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { AdminDateInput } from "@/frontend/components/admin/AdminDateInput";
import { Calendar, Plus, Trash2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { compressImageFile } from "@/frontend/lib/image-compression";
import { toast } from "sonner";

export const DEFAULT_DOC_TYPES = {
  Professional: [
    "Passport",
    "Emirates ID / National ID",
    "Work Visa",
    "Labor Card",
    "Health Insurance Card",
    "Police Clearance Certificate",
    "Training Certificate",
    "COVID-19 Vaccination Certificate",
  ],
  TeamLead: [
    "Passport",
    "Emirates ID / National ID",
    "Work Visa",
    "Labor Card",
    "Team Leadership Certificate",
    "First Aid Certificate",
    "Communication Skills Certificate",
    "Health & Safety Certificate",
  ],
  Company: [
    "Trade License",
    "VAT Registration Certificate",
    "Municipality License",
    "Environmental Permit",
    "Labor Card",
  ],
  Supervisor: [
    "Passport",
    "Emirates ID / National ID",
    "Work Visa",
    "Supervisor Accreditation",
    "Health Insurance Card",
  ],
};

interface DocumentUploadTableProps {
  entityType: "Company" | "Professional" | "TeamLead" | "Supervisor";
  documents?: ComplianceDocument[];
  onChange: (docs: ComplianceDocument[]) => void;
  entityName?: string;
  companyName?: string;
}

export function DocumentUploadTable({
  entityType,
  documents = [],
  onChange,
  entityName = "Entity",
  companyName = "ServicePlus",
}: DocumentUploadTableProps) {
  const allowedDocTypes = DEFAULT_DOC_TYPES[entityType] || DEFAULT_DOC_TYPES.Professional;

  const handleAddRow = () => {
    const newDoc: ComplianceDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityId: "new",
      entityType,
      entityName,
      companyName,
      documentType: "",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      status: "Active",
      fileName: "",
      remarks: "",
    };
    onChange([...documents, newDoc]);
  };

  const handleRemoveRow = (id: string) => {
    onChange(documents.filter((d) => d.id !== id));
  };

  const handleUpdateRow = (id: string, patch: Partial<ComplianceDocument>) => {
    onChange(
      documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  };

  const handleFileUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds maximum allowed size of 5MB.");
      return;
    }

    if (file.type.startsWith("image/")) {
      try {
        const compressed = await compressImageFile(file, { maxDimension: 1200, quality: 0.85 });
        const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
        handleUpdateRow(id, {
          fileName: file.name,
          fileUrl: dataUrl,
        });
        toast.success(`Image compressed (${Math.round(compressed.sizeBytes / 1024)} KB)`);
      } catch {
        handleUpdateRow(id, {
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
        });
      }
    } else {
      handleUpdateRow(id, {
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
      });
      toast.success(`Attached ${file.name}`);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-slate-800">
          {entityType === "Professional" ? "Professional Documents" : `${entityType} Documents`}
        </h3>
        <p className="text-xs text-slate-500">
          Upload important {entityType} documents.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 min-w-[160px]">Document Type</th>
              <th className="px-3 py-3 min-w-[130px]">Document Number</th>
              <th className="px-3 py-3 min-w-[140px]">Issue Date</th>
              <th className="px-3 py-3 min-w-[140px]">Expiry Date</th>
              <th className="px-3 py-3 min-w-[160px]">Document File</th>
              <th className="px-3 py-3 min-w-[130px]">Remarks</th>
              <th className="px-3 py-3 text-center min-w-[100px]">Status</th>
              <th className="px-3 py-3 text-center w-14">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                  No documents added yet. Click "+ Add More Document" below.
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/60">
                    {/* Document Type */}
                    <td className="px-3 py-2.5">
                      <Select
                        value={doc.documentType}
                        onValueChange={(val) => handleUpdateRow(doc.id, { documentType: val })}
                      >
                        <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedDocTypes.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Document Number */}
                    <td className="px-3 py-2.5">
                      <Input
                        value={doc.documentNumber}
                        onChange={(e) => handleUpdateRow(doc.id, { documentNumber: e.target.value })}
                        placeholder="Enter"
                        className="h-9 text-xs bg-white border-slate-200"
                      />
                    </td>

                    {/* Issue Date */}
                    <td className="px-3 py-2.5">
                      <AdminDateInput
                        placeholder="Issue Date"
                        value={doc.issueDate || ""}
                        onChange={(val) => handleUpdateRow(doc.id, { issueDate: val })}
                        className="h-9"
                      />
                    </td>

                    {/* Expiry Date */}
                    <td className="px-3 py-2.5">
                      <AdminDateInput
                        placeholder="Expiry Date"
                        value={doc.expiryDate || ""}
                        onChange={(val) => handleUpdateRow(doc.id, { expiryDate: val })}
                        className={`h-9 ${isExpired ? "border-rose-300 bg-rose-50/50 text-rose-700 font-bold" : ""}`}
                      />
                    </td>

                    {/* Document File with Choose button & Max 5MB description */}
                    <td className="px-3 py-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center justify-center px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors">
                            <span>Choose</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="sr-only"
                              onChange={(e) => handleFileUpload(doc.id, e)}
                            />
                          </label>
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={doc.fileName || "No file chosen"}>
                            {doc.fileName || "No file chosen"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Max 5MB (PDF, JPG, PNG)
                        </div>
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="px-3 py-2.5">
                      <Input
                        value={doc.remarks || ""}
                        onChange={(e) => handleUpdateRow(doc.id, { remarks: e.target.value })}
                        placeholder=""
                        className="h-9 text-xs bg-white border-slate-200"
                      />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-center">
                      <Select
                        value={doc.status}
                        onValueChange={(val: "Active" | "Inactive") => handleUpdateRow(doc.id, { status: val })}
                      >
                        <SelectTrigger className="h-9 text-xs w-24 mx-auto bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active" className="text-xs text-emerald-600 font-semibold">Active</SelectItem>
                          <SelectItem value="Inactive" className="text-xs text-slate-500">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2.5 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(doc.id)}
                        className="size-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div>
        <Button
          type="button"
          onClick={handleAddRow}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold h-9 px-4 rounded-lg shadow-2xs"
        >
          <Plus className="size-3.5 me-1" /> Add More Document
        </Button>
      </div>
    </div>
  );
}
