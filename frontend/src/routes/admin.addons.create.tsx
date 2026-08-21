import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminAddon, getAdminServices, setAddonService, uploadMedia } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Loader2, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";
import { resolveImageUrl } from "@/frontend/lib/api-client";

export const Route = createFileRoute("/admin/addons/create")({ component: AddAddonPage });

function AddAddonPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: servicesData } = useAdminQuery("services", getAdminServices);
  const services = (servicesData as any[]) ?? [];

  // Multi-Language State
  const [activeTab, setActiveTab] = useState<"en" | "ar">("en");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [includesEn, setIncludesEn] = useState("");
  const [includesAr, setIncludesAr] = useState("");

  // Configuration State
  const [serviceId, setServiceId] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Image Upload State
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      setImageFile(file);
      const compressed = await compressImageFile(file, { maxDimension: 800, quality: 0.85 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setImageUrl(dataUrl);
      toast.success("Image selected and compressed");
    } catch {
      toast.error("Failed to process image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !nameAr.trim()) {
      toast.error("Add-on Name is required");
      return;
    }
    if (!serviceId) {
      toast.error("Please select an applicable service");
      return;
    }

    try {
      setIsSubmitting(true);

      let finalUrl = imageUrl;
      if (imageFile) {
        try {
          const compressed = await compressImageFile(imageFile, { maxDimension: 800, quality: 0.85 });
          const res = await uploadMedia(compressed.filename, compressed.contentType, compressed.base64);
          if (res?.url) finalUrl = res.url;
        } catch {
          // Fallback to data URL
        }
      }

      const selectedService = services.find((s) => s.id === serviceId);
      const includesList = includesEn
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const includesListAr = includesAr
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await createAdminAddon({
        name: nameEn.trim() || nameAr.trim(),
        name_ar: nameAr.trim() || undefined,
        serviceId: serviceId,
        serviceName: selectedService?.name || "Service",
        description: descEn.trim() || undefined,
        description_ar: descAr.trim() || undefined,
        includes: includesList.length > 0 ? includesList : undefined,
        includes_ar: includesListAr.length > 0 ? includesListAr : undefined,
        price: parseFloat(price) || 0,
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        duration_minutes: parseInt(durationMinutes) || 0,
        image_url: finalUrl || null,
        is_active: isActive,
        status: isActive ? "Activated" : "Deactivated",
      });

      if (res?.id) {
        await setAddonService({ addon_id: res.id, service_id: serviceId, linked: true });
      }

      toast.success(`Add-on "${nameEn.trim() || nameAr.trim()}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "addons"] });
      navigate({ to: "/admin/addons" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create add-on");
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
          <Link to="/admin/addons" className="text-cyan-600 hover:underline font-semibold">
            Add-ons
          </Link>
          <span>/</span>
          <span className="text-slate-600">Create Add-on</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Service Add-on</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          {/* Circular Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Add-on Image</Label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center justify-center px-4 h-11 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition-colors shrink-0">
                <Upload className="size-4 me-2 text-slate-500" />
                {isCompressing ? "Processing image..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {imageUrl && (
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                    <img src={resolveImageUrl(imageUrl)} alt="Preview" className="size-full object-cover" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImageUrl("");
                      setImageFile(null);
                    }}
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50 px-2"
                  >
                    <X className="size-3.5 me-1" /> Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Language Switcher Tabs */}
          <div className="border-b border-slate-200 pt-2">
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
                <span>English Content</span>
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
                <span>المحتوى العربي</span>
              </button>
            </div>
          </div>

          {/* Tab 1: English Content */}
          {activeTab === "en" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Add-on Name (English) <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Fridge Cleaning"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Description (English)</Label>
                <Input
                  placeholder="e.g. We will clean the refrigerator inside out."
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">What's Included (English)</Label>
                <Textarea
                  placeholder="One item per line, e.g.:&#10;Cleaning of interior and exterior&#10;Removing and re-arrangement of items"
                  value={includesEn}
                  onChange={(e) => setIncludesEn(e.target.value)}
                  rows={3}
                  className="bg-white border-slate-200 rounded-lg text-xs"
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
                  اسم الإضافة (عربي) <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="مثال: تنظيف الثلاجة"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs text-right"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-700">الوصف (عربي)</Label>
                <Input
                  placeholder="مثال: سنقوم بتنظيف الثلاجة من الداخل والخارج."
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs text-right"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-700">ما تشمله الخدمة (عربي)</Label>
                <Textarea
                  placeholder="عنصر واحد في كل سطر، مثال:&#10;تنظيف شامل للثلاجة من الداخل والخارج&#10;إعادة ترتيب الأغراض وتنظيمها"
                  value={includesAr}
                  onChange={(e) => setIncludesAr(e.target.value)}
                  rows={3}
                  className="bg-white border-slate-200 rounded-lg text-xs text-right"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* Service Link & Pricing */}
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Applicable Service */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Applicable Service <span className="text-red-500">*</span>
                </Label>
                <Select value={serviceId} onValueChange={setServiceId} required>
                  <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs font-semibold">
                    <SelectValue placeholder="Select parent service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs font-semibold">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Add-on Price (AED) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Original Price */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Original Price (Strike-through)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Additional Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Additional Time (Minutes)</Label>
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

            {/* Status Switch */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-700">Active Status</p>
                <p className="text-[11px] text-slate-400">Make this add-on visible to customers during booking</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/addons" })}
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
                  <Send className="size-3.5 me-1.5" /> Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
