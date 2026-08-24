import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createService, getAdminCatalog, uploadMedia } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Send, Upload, X, Info } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";

export const Route = createFileRoute("/admin/services/create")({ component: AddServicePage });

function slugify(text: string): string {
  const ascii = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `service-${Date.now().toString(36)}`;
}

function AddServicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: catalogData } = useAdminQuery("catalog", getAdminCatalog);
  const categories = ((catalogData?.categories ?? []) as any[]).filter(
    (c) => c.status !== "Deactivated" && c.is_active !== false && c.isActive !== false,
  );

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
  const [hourlyRate, setHourlyRate] = useState("");
  const [materialsPrice, setMaterialsPrice] = useState("");
  const [materialsLabelEn, setMaterialsLabelEn] = useState("");
  const [materialsLabelAr, setMaterialsLabelAr] = useState("");
  const [minHours, setMinHours] = useState(1);
  const [maxHours, setMaxHours] = useState(8);
  const [maxProfessionals, setMaxProfessionals] = useState(4);
  const [extraProfessionalPct, setExtraProfessionalPct] = useState(100);
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Image upload state
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
      toast.error("Please enter a service name (*)");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category (*)");
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
          // Fallback to dataUrl
        }
      }

      const generatedSlug = slugify(nameEn.trim() || nameAr.trim());

      await createService({
        name: nameEn.trim() || nameAr.trim(),
        name_ar: nameAr.trim() || undefined,
        slug: generatedSlug,
        category_id: categoryId,
        short_description: shortDescEn.trim() || undefined,
        short_description_ar: shortDescAr.trim() || undefined,
        description: descEn.trim() || undefined,
        description_ar: descAr.trim() || undefined,
        booking_type: bookingType,
        base_price: parseFloat(basePrice) || (hourlyRate ? parseFloat(hourlyRate) : 0),
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        materials_price: parseFloat(materialsPrice) || 0,
        materials_label_en: materialsLabelEn.trim() || undefined,
        materials_label_ar: materialsLabelAr.trim() || undefined,
        min_hours: Number(minHours) || 1,
        max_hours: Number(maxHours) || 8,
        max_professionals: Number(maxProfessionals) || 4,
        extra_professional_pct: Number(extraProfessionalPct) || 100,
        duration_minutes: parseInt(durationMinutes) || 0,
        image_url: finalImageUrl,
        is_active: isActive,
      });

      toast.success(`Service "${nameEn.trim() || nameAr.trim()}" created successfully!`);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void navigate({ to: "/admin/services" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create service");
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
          <span className="text-slate-600">Add New Service</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add New Service Offering</h1>
      </div>

      {/* Main Creation Card */}
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
                  <div className="relative size-12 rounded-full overflow-hidden border-2 border-slate-200 shrink-0 shadow-xs bg-slate-100 flex items-center justify-center">
                    <img
                      src={resolveImageUrl(imagePreview) || FALLBACK_IMAGE}
                      alt="Preview"
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
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
                  data-lpignore="true"
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
                  data-lpignore="true"
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
                  data-lpignore="true"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Cleaning Materials Label (English)</Label>
                <Input
                  placeholder="e.g. Need cleaning materials? Powered by Jif"
                  value={materialsLabelEn}
                  onChange={(e) => setMaterialsLabelEn(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
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
                  data-lpignore="true"
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
                  data-lpignore="true"
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
                  data-lpignore="true"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-700">عنوان مواد التنظيف (عربي)</Label>
                <Input
                  placeholder="مثال: هل تحتاج إلى مواد تنظيف؟"
                  value={materialsLabelAr}
                  onChange={(e) => setMaterialsLabelAr(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs text-right"
                  autoComplete="off"
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
              {/* Category */}
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
                      Hourly Rate (How many hours / pros / materials)
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

              {/* Hourly Pricing & Limits Configuration */}
              {bookingType === "hourly" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Hourly Rate (AED / Hour)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 39"
                      value={hourlyRate === "0" ? "" : hourlyRate}
                      onChange={(e) => {
                        setHourlyRate(e.target.value);
                        if (!basePrice || basePrice === "0") setBasePrice(e.target.value);
                      }}
                      className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Cleaning Materials Price (AED)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 20 (0 if free/disabled)"
                      value={materialsPrice === "0" ? "" : materialsPrice}
                      onChange={(e) => setMaterialsPrice(e.target.value)}
                      className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Hours Range (Min - Max)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        placeholder="Min (1)"
                        value={minHours || ""}
                        onChange={(e) => setMinHours(Number(e.target.value) || 1)}
                        className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                      />
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        placeholder="Max (8)"
                        value={maxHours || ""}
                        onChange={(e) => setMaxHours(Number(e.target.value) || 8)}
                        className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Max Professionals & Multiplier (%)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Max Pros (4)"
                        value={maxProfessionals || ""}
                        onChange={(e) => setMaxProfessionals(Number(e.target.value) || 4)}
                        className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="500"
                        placeholder="Multiplier % (100)"
                        value={extraProfessionalPct || ""}
                        onChange={(e) => setExtraProfessionalPct(Number(e.target.value) || 100)}
                        className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Base Price */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Base Price (AED)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={basePrice === "0" ? "" : basePrice}
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
                      placeholder="60"
                      value={durationMinutes === "0" ? "" : durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </>
              )}
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Create Service"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
