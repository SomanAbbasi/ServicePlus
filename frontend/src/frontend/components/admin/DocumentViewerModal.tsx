import React, { useState } from "react";
import { ComplianceDocument } from "@/frontend/lib/admin-mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { FileText, Calendar, ShieldCheck, AlertTriangle, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentViewerModalProps {
  document: ComplianceDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onRenew?: (docId: string, updated: Partial<ComplianceDocument>) => void;
}

export function DocumentViewerModal({
  document,
  isOpen,
  onClose,
  onRenew,
}: DocumentViewerModalProps) {
  if (!document) return null;

  const [isRenewing, setIsRenewing] = useState(false);
  const [newDocNumber, setNewDocNumber] = useState(document.documentNumber);
  const [newIssueDate, setNewIssueDate] = useState(document.issueDate);
  const [newExpiryDate, setNewExpiryDate] = useState(document.expiryDate);
  const [newRemarks, setNewRemarks] = useState(document.remarks || "");
  const [newFileName, setNewFileName] = useState(document.fileName || "");

  const isExpired = document.expiryDate && new Date(document.expiryDate) < new Date();
  const diffDays = Math.ceil(
    (new Date(document.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24),
  );

  const handleSaveRenewal = () => {
    if (!newExpiryDate) {
      toast.error("Please enter a valid expiry date.");
      return;
    }
    if (onRenew) {
      onRenew(document.id, {
        documentNumber: newDocNumber,
        issueDate: newIssueDate,
        expiryDate: newExpiryDate,
        remarks: newRemarks,
        fileName: newFileName || document.fileName || "renewed_document.pdf",
        status: "Active",
      });
      toast.success(`Document ${document.documentType} renewed successfully!`);
    }
    setIsRenewing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-100 text-cyan-700">
              <FileText className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {document.documentType}
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium">
                {document.entityType}: <span className="font-bold text-slate-700">{document.entityName}</span>
                {document.companyName ? ` (${document.companyName})` : ""}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Expiry Badge */}
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
              isExpired
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : diffDays <= 30
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {isExpired ? (
              <AlertTriangle className="size-4 shrink-0 text-rose-600" />
            ) : diffDays <= 30 ? (
              <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            ) : (
              <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
            )}
            <div>
              {isExpired ? (
                <p>This document expired on {document.expiryDate}. Immediate renewal is required.</p>
              ) : diffDays <= 30 ? (
                <p>Warning: This document expires in {diffDays} days ({document.expiryDate}).</p>
              ) : (
                <p>Valid document — {diffDays} days remaining until {document.expiryDate}.</p>
              )}
            </div>
          </div>

          {!isRenewing ? (
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-medium block">Document Number</span>
                  <span className="text-slate-800 font-bold">{document.documentNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    document.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                  }`}>
                    {document.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Issue Date</span>
                  <span className="text-slate-800 font-semibold">{document.issueDate || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Expiry Date</span>
                  <span className="text-slate-800 font-semibold">{document.expiryDate}</span>
                </div>
              </div>

              {document.remarks && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-medium block">Remarks</span>
                  <p className="text-slate-700 font-medium">{document.remarks}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Attachment</span>
                <span className="text-cyan-700 font-bold flex items-center gap-1">
                  <FileText className="size-3.5" /> {document.fileName || `${document.documentType.toLowerCase().replace(/\s+/g, "_")}.pdf`}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs p-3 rounded-xl border border-cyan-200 bg-cyan-50/40">
              <h5 className="font-bold text-cyan-900">Renew / Update Document Record</h5>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Document Number</Label>
                <Input
                  value={newDocNumber}
                  onChange={(e) => setNewDocNumber(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Issue Date</Label>
                  <Input
                    type="date"
                    value={newIssueDate}
                    onChange={(e) => setNewIssueDate(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">New Expiry Date *</Label>
                  <Input
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="h-8 text-xs bg-white border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Upload New Copy</Label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-300 bg-white hover:bg-cyan-50 text-cyan-800 text-xs font-bold transition-colors">
                    <Upload className="size-3.5" />
                    <span>Choose File (PDF/Image)</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setNewFileName(f.name);
                      }}
                    />
                  </label>
                  {newFileName && (
                    <span className="text-xs text-slate-700 font-semibold truncate">{newFileName}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Remarks</Label>
                <Input
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  placeholder="e.g. Renewed via official portal"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!isRenewing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => setIsRenewing(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold"
              >
                Renew / Update Document
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRenewing(false)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveRenewal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <CheckCircle2 className="size-3.5 me-1" /> Save Renewal
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
