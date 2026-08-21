import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminCompany } from "@/frontend/lib/api-services";
import { ComplianceDocument } from "@/frontend/lib/admin-mock-data";
import { useQueryClient } from "@tanstack/react-query";
import { DocumentUploadTable } from "@/frontend/components/admin/DocumentUploadTable";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/companies/create")({ component: AddCompanyPage });

function AddCompanyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic Information State
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Company Documents State: initialized with 1 empty row
  const [documents, setDocuments] = useState<ComplianceDocument[]>([
    {
      id: `doc-${Date.now()}`,
      entityId: "new",
      entityType: "Company",
      entityName: "",
      companyName: "",
      documentType: "",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      status: "Active",
      fileName: "",
      remarks: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyEmail.trim() || !phone.trim()) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAdminCompany({
        name: companyName.trim(),
        email: companyEmail.trim(),
        phone: phone.trim(),
        status: "Activated",
        documents: documents.filter((d) => d.documentType || d.documentNumber),
      });

      toast.success(`Company ${companyName} registered successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      navigate({ to: "/admin/companies" });
    } catch {
      toast.error("Failed to register company");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 max-w-5xl">
      {/* Breadcrumbs matching reference screenshot */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Link to="/admin" className="text-cyan-600 hover:underline font-semibold">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/admin/companies" className="text-cyan-600 hover:underline font-semibold">
          Company Management
        </Link>
        <span>/</span>
        <span className="text-slate-600">Add New Company</span>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Add New Company
        </h1>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-800">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Company Name *"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="comp_name_field"
                data-lpignore="true"
              />

              <Input
                type="email"
                placeholder="Company Email *"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="comp_email_field"
                data-lpignore="true"
              />

              <Input
                placeholder="Phone Number *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="comp_phone_field"
                data-lpignore="true"
              />
            </div>
          </div>

          {/* Section 2: Company Documents */}
          <div className="pt-2">
            <DocumentUploadTable
              entityType="Company"
              documents={documents}
              onChange={setDocuments}
              entityName={companyName || "Company"}
              companyName={companyName || "Company"}
            />
          </div>

          {/* Footer Actions matching screenshot */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/companies" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-6 rounded-lg"
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-10 px-7 rounded-lg shadow-sm"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
