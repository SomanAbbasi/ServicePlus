import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminMaterial } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Save, X, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/materials/create")({ component: AddMaterialPage });

function AddMaterialPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"en" | "ar" | "ur">("en");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameUr, setNameUr] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !nameAr.trim() && !nameUr.trim()) {
      toast.error("Please enter a material name (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      const now = new Date();
      const createdOnStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      await createAdminMaterial({
        name: nameEn.trim() || nameAr.trim() || nameUr.trim(),
        nameAr: nameAr.trim(),
        nameUr: nameUr.trim(),
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&q=80",
        status: "Activated",
        isActive: true,
        createdOn: createdOnStr,
        category: "Chemicals",
        sku: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
        stock: 100,
        unit: "pcs",
        minStockAlert: 15,
        unitPrice: 15.0,
      });

      toast.success(`Material "${nameEn || nameAr || nameUr}" added successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      navigate({ to: "/admin/materials" });
    } catch {
      toast.error("Failed to add material");
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
          <Link to="/admin/materials" className="text-cyan-600 hover:underline font-semibold">
            Material Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Add New Material</span>
        </div>
      </div>

      {/* Main Creation Card matching Screenshot 2 */}
      <Card className="bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header Title */}
        <div className="px-6 py-5 border-b border-slate-100">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Add New Material</h1>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-6 sm:p-8 space-y-6">
          {/* Upload Image Row */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label className="text-xs font-semibold text-slate-600">
                Upload image <span className="text-red-500">*</span>
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex items-center w-full max-w-md rounded-lg border border-slate-200 bg-white p-1 text-xs">
                <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md border border-slate-300 text-xs transition-colors shrink-0">
                  Choose file
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <span className="ms-3 text-slate-500 truncate text-xs">
                  {fileName || "No file chosen"}
                </span>
              </div>

              {imageUrl && (
                <div className="size-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs shrink-0">
                  <img src={imageUrl} alt="Preview" className="size-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Bilingual Language Selection Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex items-center gap-4">
              {/* English Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("en")}
                className={`flex items-center gap-2 pb-3 pt-2 text-xs font-bold transition-colors relative cursor-pointer ${
                  activeTab === "en"
                    ? "text-[#0088cc] font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="text-base leading-none">🇺🇸</span>
                <span>English</span>
                {activeTab === "en" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0088cc]" />
                )}
              </button>

              {/* Arabic Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("ar")}
                className={`flex items-center gap-2 pb-3 pt-2 text-xs font-bold transition-colors relative cursor-pointer ${
                  activeTab === "ar"
                    ? "text-[#0088cc] font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="text-base leading-none">🇦🇪</span>
                <span>عربي</span>
                {activeTab === "ar" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0088cc]" />
                )}
              </button>

              {/* Urdu Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("ur")}
                className={`flex items-center gap-2 pb-3 pt-2 text-xs font-bold transition-colors relative cursor-pointer ${
                  activeTab === "ur"
                    ? "text-[#0088cc] font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="text-base leading-none">🇵🇰</span>
                <span>اردو</span>
                {activeTab === "ur" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0088cc]" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content: Name Input */}
          <div className="pt-2">
            {activeTab === "en" && (
              <div className="space-y-1.5 max-w-md">
                <Label className="text-xs font-semibold text-slate-700">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter material name in English"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="h-10 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                  name="mat_name_en"
                  data-lpignore="true"
                />
              </div>
            )}

            {activeTab === "ar" && (
              <div className="space-y-1.5 max-w-md">
                <Label className="text-xs font-semibold text-slate-700">
                  Name (عربي) <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="أدخل اسم المادة بالعربية (مثال: معقمات)"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                  className="h-10 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                  name="mat_name_ar"
                  data-lpignore="true"
                />
              </div>
            )}

            {activeTab === "ur" && (
              <div className="space-y-1.5 max-w-md">
                <Label className="text-xs font-semibold text-slate-700">
                  Name (اردو) <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="مواد کا نام اردو میں درج کریں (مثال: سینیٹائزرز)"
                  value={nameUr}
                  onChange={(e) => setNameUr(e.target.value)}
                  dir="rtl"
                  className="h-10 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                  name="mat_name_ur"
                  data-lpignore="true"
                />
              </div>
            )}
          </div>

          {/* Form Action Buttons: [✕ Close] and [💾 Submit] matching Screenshot 2 */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/materials" })}
              className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              <Save className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

