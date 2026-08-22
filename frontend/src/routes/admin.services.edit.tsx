import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAdminCatalog, updateService, uploadMedia } from "@/frontend/lib/api-services";
import { AdminService, AdminDataStore } from "@/frontend/lib/admin-mock-data";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/services/edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id ? String(search.id) : "",
  }),
  component: EditServicePage,
});

function EditServicePage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: catalogData } = useAdminQuery("catalog", getAdminCatalog);
  const services: AdminService[] = (catalogData as any)?.services ?? AdminDataStore.getServices();
  const allCategories = (catalogData as any)?.categories ?? AdminDataStore.getCategories();
  // Filter only active categories for selection
  const categories = (allCategories as any[]).filter(
    (c) => c.is_active === true || c.isActive === true || c.status === "Activated"
  );

  const service = services.find((s) => s.id === id || String(s.id) === String(id)) ?? AdminDataStore.getServices().find((s) => s.id === id || String(s.id) === String(id));

  const [activeTab, setActiveTab] = useState<"en" | "ar">("en");

  // English fields
  const [nameEn, setNameEn] = useState("");
  const [shortDescEn, setShortDescEn] = useState("");
  const [descEn, setDescEn] = useState("");

  // Arabic fields
  const [nameAr, setNameAr] = useState("");
  const [shortDescAr, setShortDescAr] = useState("");
  const [descAr, setDescAr] = useState("");

  // Configuration fields
  const [categoryId, setCategoryId] = useState("");
  const [bookingType, setBookingType] = useState("hourly");
  const [basePrice, setBasePrice] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      setNameEn(service.name || "");
      setNameAr(service.name_ar || service.nameAr || "");
      setShortDescEn(service.short_description || service.shortDescription || "");
      setShortDescAr((service as any).short_description_ar || (service as any).shortDescriptionAr || "");
      setDescEn(service.description || "");
      setDescAr(service.description_ar || service.descriptionAr || "");
      setCategoryId(service.category_id || service.categoryId || "");
      setBookingType(service.booking_type || service.bookingType || "hourly");
      setBasePrice(String(service.base_price ?? service.basePrice ?? "0"));
      setDurationMinutes(String(service.duration_minutes ?? service.durationMinutes ?? "60"));
      setIsActive(service.is_active ?? service.isActive ?? true);
      const existingImg = service.imageUrl || service.image_url || null;
      setImagePreview(existingImg);
    }
  }, [service]);

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
      toast.error("Please enter a service name (*)");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category (*)");
      return;
    }

    if (!id) {
      toast.error("Missing service ID");
      return;
    }

    try {
      setIsSubmitting(true);
      let finalImageUrl = imagePreview || undefined;

      if (imageFile) {
        try {
          const compressed = await compressImageFile(imageFile, { maxDimension: 800, quality: 0.85 });
          const res = await uploadMedia(compressed.filename, compressed.contentType, compressed.base64);
          if (res?.url) finalImageUrl = res.url;
        } catch {
          // Fallback to data URL
        }
      }

      await updateService({
        id,
        name: nameEn.trim() || nameAr.trim(),
        name_ar: nameAr.trim() || undefined,
        nameAr: nameAr.trim() || undefined,
        categoryId: categoryId,
        category_id: categoryId,
        shortDescription: shortDescEn.trim() || undefined,
        short_description: shortDescEn.trim() || undefined,
        shortDescriptionAr: shortDescAr.trim() || undefined,
        short_description_ar: shortDescAr.trim() || undefined,
        description: descEn.trim() || undefined,
        description_ar: descAr.trim() || undefined,
        descriptionAr: descAr.trim() || undefined,
        bookingType: bookingType,
        booking_type: bookingType,
        basePrice: parseFloat(basePrice) || 0,
        base_price: parseFloat(basePrice) || 0,
        durationMinutes: parseInt(durationMinutes, 10) || 0,
        duration_minutes: parseInt(durationMinutes, 10) || 0,
        imageUrl: finalImageUrl,
        image_url: finalImageUrl,
        isActive: isActive,
        is_active: isActive,
      });

      toast.success(`Service "${nameEn.trim() || nameAr.trim()}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "catalog"] });
      navigate({ to: "/admin/services" });
    } catch {
      toast.error("Failed to update service");
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
          <Link to="/admin/services" className="text-cyan-600 hover:underline font-semibold">
            Services
          </Link>
          <span>/</span>
          <span className="text-slate-600">Edit Service</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Service Offering</h1>
      </div>

      {/* Main Edit Card matching Add New Service layout */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/90 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          {/* Top Image Upload Section */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Service Image</Label>
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

          {/* Language Switcher Tabs */}
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

          {/* Tab 1: English Content */}
          {activeTab === "en" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Service Name (English) <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Standard Home Cleaning"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                  name="service_name_en"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Short Description (English)</Label>
                <Input
                  placeholder="Brief summary for listings and search cards"
                  value={shortDescEn}
                  onChange={(e) => setShortDescEn(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                  name="service_short_desc_en"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Full Description (English)</Label>
                <Textarea
                  placeholder="Detailed description of what is included in this service"
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  rows={4}
                  className="bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                  name="service_desc_en"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Arabic Content */}
          {activeTab === "ar" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150" dir="rtl">
              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-700">
                  اسم الخدمة (عربي) <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="مثال: تنظيف المنازل القياسي"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs text-right"
                  autoComplete="off"
                  name="service_name_ar"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-700">الوصف المختصر (عربي)</Label>
                <Input
                  placeholder="ملخص موجز لبطاقات العرض والبحث"
                  value={shortDescAr}
                  onChange={(e) => setShortDescAr(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs text-right"
                  autoComplete="off"
                  name="service_short_desc_ar"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-700">الوصف التفصيلي (عربي)</Label>
                <Textarea
                  placeholder="وصف تفصيلي للخدمة وما تشمله من مزايا"
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  rows={4}
                  className="bg-white border-slate-200 rounded-lg text-xs text-right"
                  autoComplete="off"
                  name="service_desc_ar"
                />
              </div>
            </div>
          )}

          {/* General Configuration & Pricing */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              General Configuration & Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category (Active Only) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs font-semibold">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Booking Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Booking Type</Label>
                <Select value={bookingType} onValueChange={setBookingType}>
                  <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs font-semibold">
                    <SelectValue placeholder="Select booking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly" className="text-xs font-semibold">
                      Hourly Rate
                    </SelectItem>
                    <SelectItem value="fixed" className="text-xs font-semibold">
                      Fixed Price
                    </SelectItem>
                    <SelectItem value="variant" className="text-xs font-semibold">
                      Options & Variants
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Base Price */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Base Price (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Estimated Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Estimated Duration (Minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-700">Active Status</p>
                <p className="text-[11px] text-slate-400">
                  Enable or disable this service offering in customer search and catalog
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/services" })}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-5 rounded-lg"
            >
              <X className="size-3.5 me-1.5" /> Close
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isCompressing}
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
