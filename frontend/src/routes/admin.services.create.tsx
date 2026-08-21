import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminService, getAdminCategories } from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/services/create")({ component: AddServicePage });

function AddServicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: catData } = useAdminQuery("categories", getAdminCategories);
  const categories = (catData as any[]) ?? [];

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("120.00");
  const [durationMinutes, setDurationMinutes] = useState("120");
  const [description, setDescription] = useState("");
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, { maxDimension: 600, quality: 0.82 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setIconPreview(dataUrl);
      toast.success("Image compressed and loaded");
    } catch {
      toast.error("Failed to compress image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !basePrice) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedCategory = categories.find((c) => c.id === categoryId);
      await createAdminService({
        name: name.trim(),
        categoryId: categoryId,
        categoryName: selectedCategory?.name || "Cleaning",
        basePrice: parseFloat(basePrice) || 0,
        durationMinutes: parseInt(durationMinutes) || 60,
        description: description.trim(),
        imageUrl: iconPreview || undefined,
        status: "Activated",
      });

      toast.success(`Service ${name} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      navigate({ to: "/admin/services" });
    } catch {
      toast.error("Failed to create service");
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
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Service Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Standard Home Cleaning"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="svc_name_field"
                data-lpignore="true"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg text-xs">
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

            {/* Base Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Base Price (AED) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="120.00"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Estimated Duration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Estimated Duration (Minutes)</Label>
              <Input
                type="number"
                placeholder="120"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Description</Label>
              <Input
                placeholder="Enter service scope and details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="svc_desc_field"
                data-lpignore="true"
              />
            </div>

            {/* Image */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Service Image</Label>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center px-4 h-11 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-700 transition-colors shrink-0">
                  <Upload className="size-3.5 me-2 text-slate-500" />
                  {isCompressing ? "Compressing..." : "Choose file"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <span className="text-xs text-slate-500 truncate">
                  {iconPreview ? "Image selected" : "No file chosen"}
                </span>
                {iconPreview && (
                  <div className="relative size-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 ms-auto">
                    <img src={iconPreview} alt="Preview" className="size-full object-cover" />
                  </div>
                )}
              </div>
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
