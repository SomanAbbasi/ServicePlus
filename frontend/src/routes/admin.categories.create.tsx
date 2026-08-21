import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createCategory, uploadMedia } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Save, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/categories/create")({ component: AddCategoryPage });

function slugify(text: string): string {
  const ascii = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `category-${Date.now().toString(36)}`;
}

function AddCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"en" | "ar">("en");

  // English fields
  const [nameEn, setNameEn] = useState("");

  // Arabic fields
  const [nameAr, setNameAr] = useState("");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      setImageFile(file);
      const compressed = await compressImageFile(file, { maxDimension: 800, quality: 0.85 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setImagePreview(dataUrl);
      toast.success("Image selected and compressed");
    } catch {
      toast.error("Failed to process image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !nameAr.trim()) {
      toast.error("Please enter a category name (*)");
      return;
    }

    try {
      setIsSubmitting(true);

      let finalImageUrl = imagePreview || undefined;

      // If a file was selected, upload it to media server
      if (imageFile) {
        try {
          const compressed = await compressImageFile(imageFile, { maxDimension: 800, quality: 0.85 });
          const res = await uploadMedia(compressed.filename, compressed.contentType, compressed.base64);
          if (res?.url) {
            finalImageUrl = res.url;
          }
        } catch {
          // Fallback to compressed base64 data URL
        }
      }

      const generatedSlug = slugify(nameEn.trim() || nameAr.trim());

      await createCategory({
        name: nameEn.trim() || nameAr.trim(),
        name_ar: nameAr.trim() || undefined,
        slug: generatedSlug,
        image_url: finalImageUrl,
        is_active: true,
      });

      toast.success(`Category "${nameEn.trim() || nameAr.trim()}" created successfully!`);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void navigate({ to: "/admin/categories" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create category");
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
          <Link to="/admin/categories" className="text-cyan-600 hover:underline font-semibold">
            Category Management
          </Link>
          <span>/</span>
          <span className="text-slate-600">Create Category</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add New Category</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/90 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          {/* Top Image Upload Section */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Upload image <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center justify-center px-4 h-11 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition-colors shrink-0">
                <Upload className="size-3.5 me-2 text-slate-500" />
                {isCompressing ? "Processing..." : "Choose file"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-slate-500 truncate max-w-xs">
                {imageFile ? imageFile.name : imagePreview ? "Image selected" : "No file chosen"}
              </span>

              {imagePreview && (
                <div className="flex items-center gap-2 ms-auto">
                  <div className="relative size-12 rounded-full overflow-hidden border-2 border-slate-200 shrink-0 shadow-xs">
                    <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearImage}
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50 px-2"
                  >
                    <X className="size-3.5 me-1" /> Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Language Tabs matching Reference Screenshot */}
          <div className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("en")}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  activeTab === "en"
                    ? "border-cyan-600 text-cyan-600 bg-cyan-50/40 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
                }`}
              >
                <span className="text-sm">🇺🇸</span>
                <span>English</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ar")}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  activeTab === "ar"
                    ? "border-cyan-600 text-cyan-600 bg-cyan-50/40 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
                }`}
              >
                <span className="text-sm">🇦🇪</span>
                <span>عربي</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "en" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Deep Cleaning"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                  name="category_name_en"
                  data-lpignore="true"
                />
              </div>
            </div>
          )}

          {activeTab === "ar" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150" dir="rtl">
              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-700">
                  الاسم <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="مثال: التنظيف العميق"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs text-right"
                  autoComplete="off"
                  name="category_name_ar"
                  data-lpignore="true"
                />
              </div>
            </div>
          )}

          {/* Form Actions matching Reference Screenshot */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/categories" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 me-1.5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Save className="size-3.5 me-1.5" /> Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
