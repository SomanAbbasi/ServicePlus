import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminCompanies, updateAdminCompany } from "@/frontend/lib/api-services";
import { AdminCompany, AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/companies/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditCompanyPage,
});

function EditCompanyPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: companiesData } = useAdminQuery("companies", getAdminCompanies);
  const companies: AdminCompany[] = (companiesData as AdminCompany[]) ?? AdminDataStore.getCompanies();

  const company = companies.find((c) => c.id === id || String(c.id) === String(id)) ?? AdminDataStore.getCompanies().find((c) => c.id === id || String(c.id) === String(id));

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"Activated" | "Deactivated">("Activated");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (company) {
      const c = company as any;
      setCompanyName(c.name || c.companyName || "");
      setCompanyEmail(c.email || c.companyEmail || "");
      setPhone(c.phone || "");
      setStatus(c.status === "Activated" || c.isActive !== false ? "Activated" : "Deactivated");
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyEmail.trim() || !phone.trim()) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    if (!id) {
      toast.error("Missing company ID");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateAdminCompany(id, {
        name: companyName.trim(),
        email: companyEmail.trim(),
        phone: phone.trim(),
        status: status,
      });

      toast.success(`Company ${companyName} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      navigate({ to: "/admin/companies" });
    } catch {
      toast.error("Failed to update company");
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
          <Link to="/admin/companies" className="text-cyan-600 hover:underline font-semibold">
            Company Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit Company</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Company</h1>
      </div>

      {/* Main Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Company Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter company legal name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="company_edit_name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Contact Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                inputMode="email"
                placeholder="company@example.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="company_edit_email"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="050 XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="company_edit_phone"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Account Status</Label>
              <Select value={status} onValueChange={(val: "Activated" | "Deactivated") => setStatus(val)}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activated" className="text-xs text-emerald-600 font-bold">Activated</SelectItem>
                  <SelectItem value="Deactivated" className="text-xs text-rose-600 font-bold">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/companies" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              <Save className="size-3.5 me-1.5" /> {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
