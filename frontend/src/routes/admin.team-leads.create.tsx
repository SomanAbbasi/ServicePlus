import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { createAdminTeamLead, getAdminCompanies } from "@/frontend/lib/api-services";
import { ComplianceDocument } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { DocumentUploadTable } from "@/frontend/components/admin/DocumentUploadTable";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { ChevronDown, Eye, EyeOff, Send, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/team-leads/create")({ component: AddTeamLeadPage });

export const CITY_AREAS: Record<string, string[]> = {
  "Abu Dhabi": [
    "Al Reem Island",
    "Yas Island",
    "Khalifa City",
    "Al Corniche",
    "Saadiyat Island",
    "Al Khalidiyah",
    "Al Bateen",
    "Mohammed Bin Zayed City",
    "Al Mushrif",
    "Al Zahiyah",
  ],
  "Dubai": [
    "Downtown Dubai",
    "Dubai Marina",
    "Palm Jumeirah",
    "Business Bay",
    "Jumeirah Lakes Towers (JLT)",
    "Deira",
    "Al Barsha",
    "Jumeirah Village Circle (JVC)",
    "Dubai Hills",
    "Mirdif",
  ],
  "Sharjah": [
    "Al Majaz",
    "Al Nahda",
    "Al Taawun",
    "Muwailih",
    "Al Khan",
    "Al Qasimia",
  ],
  "Ajman": [
    "Al Nuaimia",
    "Al Rashidiya",
    "Ajman Downtown",
    "Al Jurf",
  ],
  "Ras Al Khaimah": [
    "Al Hamra Village",
    "Mina Al Arab",
    "Al Nakheel",
  ],
  "Umm Al Quwain": [
    "Al Salamah",
    "Old Town Area",
  ],
  "Fujairah": [
    "Fujairah City",
    "Dibba Al Fujairah",
  ],
};

function AddTeamLeadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: companiesData } = useAdminQuery("companies", getAdminCompanies);
  const companies = (companiesData as any[]) ?? [];

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [city, setCity] = useState("Abu Dhabi");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState("");
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Documents: initialized with 1 empty row
  const [documents, setDocuments] = useState<ComplianceDocument[]>([
    {
      id: `doc-${Date.now()}`,
      entityId: "new",
      entityType: "TeamLead",
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

  // Available areas based on chosen city
  const availableAreas = useMemo(() => {
    return CITY_AREAS[city] || CITY_AREAS["Abu Dhabi"];
  }, [city]);

  // Handle Photo Selection & Compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);
    try {
      setIsCompressingPhoto(true);
      const compressed = await compressImageFile(file, { maxDimension: 800, quality: 0.85 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setPhotoPreview(dataUrl);
      toast.success(`Photo compressed (${Math.round(compressed.sizeBytes / 1024)} KB)`);
    } catch {
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Areas Multi-Select Handlers
  const isAllAreasSelected = selectedAreas.length === availableAreas.length;
  const handleToggleArea = (area: string, checked: boolean) => {
    if (checked) {
      setSelectedAreas([...selectedAreas, area]);
    } else {
      setSelectedAreas(selectedAreas.filter((a) => a !== area));
    }
  };
  const handleToggleAllAreas = (checked: boolean) => {
    if (checked) setSelectedAreas([...availableAreas]);
    else setSelectedAreas([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !companyId) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedCompany = companies.find((c) => c.id === companyId);
      await createAdminTeamLead({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        companyId: companyId,
        companyName: selectedCompany?.name || "Partner Company",
        city: city,
        status: "Activated",
        documents: documents.filter((d) => d.documentType || d.documentNumber),
      });

      toast.success(`Team Lead ${fullName} onboarded successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "team_leads"] });
      navigate({ to: "/admin/team-leads" });
    } catch {
      toast.error("Failed to onboard team lead");
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
          <Link to="/admin/team-leads" className="text-cyan-600 hover:underline font-semibold">
            Team Lead Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Add Team Lead</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add New Team Lead</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          {/* Row 1: Full Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Input
                placeholder="Full Name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="tl_name_field"
                data-lpignore="true"
              />
            </div>

            <div className="space-y-1.5">
              <Input
                type="email"
                placeholder="E-mail *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="tl_email_field"
                data-lpignore="true"
              />
            </div>
          </div>

          {/* Row 2: Phone Number & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="tl_phone_field"
                data-lpignore="true"
              />
            </div>

            <div className="relative">
              <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs pe-10"
                  autoComplete="new-password"
                  name="tl_pass_field"
                  data-lpignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Confirm Password & Upload Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password *"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs pe-10"
                  autoComplete="new-password"
                  name="tl_conf_pass_field"
                  data-lpignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                Upload image
              </label>
              <div className="flex items-center h-11 px-3 border border-slate-200 rounded-lg bg-white">
                <label className="cursor-pointer inline-flex items-center px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors me-2.5 shrink-0">
                  <span>Choose file</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handlePhotoUpload}
                  />
                </label>
                <span className="text-xs text-slate-400 truncate">
                  {photoFileName || "No file chosen"}
                </span>
              </div>
            </div>
          </div>

          {/* Row 4: Select Company & Select Cities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <label className="absolute -top-2 start-3 px-1 text-[11px] font-semibold text-slate-500 bg-white z-10">
                Select Company <span className="text-red-500">*</span>
              </label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                      {c.name}
                    </SelectItem>
                  ))}
                  {companies.length === 0 && (
                    <SelectItem value="default" className="text-xs font-medium">
                      ServicePlus Network
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
                  <SelectValue placeholder="Select Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abu Dhabi" className="text-xs">Abu Dhabi</SelectItem>
                  <SelectItem value="Dubai" className="text-xs">Dubai</SelectItem>
                  <SelectItem value="Sharjah" className="text-xs">Sharjah</SelectItem>
                  <SelectItem value="Ajman" className="text-xs">Ajman</SelectItem>
                  <SelectItem value="Ras Al Khaimah" className="text-xs">Ras Al Khaimah</SelectItem>
                  <SelectItem value="Umm Al Quwain" className="text-xs">Umm Al Quwain</SelectItem>
                  <SelectItem value="Fujairah" className="text-xs">Fujairah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Select Areas Multi-Select Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-xs text-start hover:border-slate-300 transition-colors"
                >
                  <span className={selectedAreas.length > 0 ? "text-slate-900 font-medium" : "text-slate-400 italic"}>
                    {selectedAreas.length > 0
                      ? `${selectedAreas.length} area${selectedAreas.length > 1 ? "s" : ""} selected`
                      : "Select Areas"}
                  </span>
                  <ChevronDown className="size-4 text-slate-400 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2 bg-white border-slate-200 rounded-xl shadow-md max-h-64 overflow-y-auto">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-1">
                    <Checkbox
                      checked={isAllAreasSelected}
                      onCheckedChange={(c) => handleToggleAllAreas(Boolean(c))}
                      className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                    />
                    <span>Select All</span>
                  </label>
                  {availableAreas.map((area) => {
                    const isChecked = selectedAreas.includes(area);
                    return (
                      <label
                        key={area}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(c) => handleToggleArea(area, Boolean(c))}
                          className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                        />
                        <span>{area}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Team Lead Documents Section */}
          <div className="pt-2">
            <DocumentUploadTable
              entityType="TeamLead"
              documents={documents}
              onChange={setDocuments}
              entityName={fullName || "Team Lead"}
              companyName={companies.find((c) => c.id === companyId)?.name || "Company"}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/team-leads" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isCompressingPhoto}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
