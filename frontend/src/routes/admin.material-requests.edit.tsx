import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  getAdminMaterialRequests,
  updateAdminMaterialRequestStatus,
} from "@/frontend/lib/api-services";
import { AdminMaterialRequest, AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/material-requests/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditMaterialRequestPage,
});

function EditMaterialRequestPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: requestsData } = useAdminQuery("material_requests", getAdminMaterialRequests);
  const requests: AdminMaterialRequest[] = (requestsData as AdminMaterialRequest[]) ?? AdminDataStore.getMaterialRequests();

  const req = requests.find((r) => r.id === id || String(r.id) === String(id)) ?? AdminDataStore.getMaterialRequests().find((r) => r.id === id || String(r.id) === String(id));

  const [requestedBy, setRequestedBy] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [status, setStatus] = useState<"Pending" | "Approved" | "Dispatched" | "Rejected">("Pending");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (req) {
      setRequestedBy(req.requestedBy || "");
      setCompanyName(req.companyName || "");
      setUrgency(req.urgency || "Normal");
      setStatus(req.status || "Pending");
      setNotes(req.notes || "");
    }
  }, [req]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      toast.error("Missing request ID");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateAdminMaterialRequestStatus(id, status, notes);

      toast.success(`Material request status updated to "${status}"!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "material_requests"] });
      navigate({ to: "/admin/material-requests" });
    } catch {
      toast.error("Failed to update material request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 max-w-5xl">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
            Dashboard
          </Link>
          <span>/</span>
          <Link to="/admin/material-requests" className="text-cyan-600 hover:underline font-semibold">
            Material Requests
          </Link>
          <span>/</span>
          <span className="text-slate-600">Review Request</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Review Material Request</h1>
      </div>

      {/* Main Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Requester */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Requested By</Label>
              <Input
                value={requestedBy}
                readOnly
                className="h-11 bg-slate-50 border-slate-200 rounded-lg text-xs font-semibold cursor-not-allowed"
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Assigned Company</Label>
              <Input
                value={companyName}
                readOnly
                className="h-11 bg-slate-50 border-slate-200 rounded-lg text-xs font-semibold cursor-not-allowed"
              />
            </div>

            {/* Priority / Urgency */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Request Urgency</Label>
              <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal" className="text-xs">Normal Dispatch</SelectItem>
                  <SelectItem value="Urgent" className="text-xs text-rose-600 font-bold">Urgent Dispatch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Approval Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Approval / Fulfillment Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending" className="text-xs text-amber-600 font-bold">Pending Review</SelectItem>
                  <SelectItem value="Approved" className="text-xs text-blue-600 font-bold">Approved</SelectItem>
                  <SelectItem value="Dispatched" className="text-xs text-emerald-600 font-bold">Dispatched & Fulfilled</SelectItem>
                  <SelectItem value="Rejected" className="text-xs text-rose-600 font-bold">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items Summary */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Requested Items</Label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                {req?.items && req.items.length > 0 ? (
                  <ul className="space-y-1">
                    {req.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{item.materialName}</span>
                        <span className="font-bold text-slate-600">{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-400 italic">No specific items specified</span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Notes / Remarks</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for logistics / warehouse"
                className="bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/material-requests" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              <Save className="size-3.5 me-1.5" /> {isSubmitting ? "Saving..." : "Save Status"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
