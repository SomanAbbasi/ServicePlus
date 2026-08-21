import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAdminCategory } from "@/frontend/lib/api-services";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/frontend/lib/image-compression";

export const Route = createFileRoute("/admin/categories/create")({ component: AddCategoryPage });

function AddCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, { maxDimension: 400, quality: 0.85 });
      const dataUrl = `data:${compressed.contentType};base64,${compressed.base64}`;
      setIconPreview(dataUrl);
      toast.success("Icon compressed and loaded");
    } catch {
      toast.error("Failed to compress image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a category name (*)");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAdminCategory({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: description.trim(),
        imageUrl: iconPreview || undefined,
        status: "Activated",
      });

      toast.success(`Category ${name} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      navigate({ to: "/admin/categories" });
    } catch {
      toast.error("Failed to create category");
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
            Categories
          </Link>
          <span>/</span>
          <span className="text-slate-600">Add New Category</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Add New Service Category</h1>
      </div>

      {/* Main Creation Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Deep Cleaning"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="cat_name_field"
                data-lpignore="true"
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">URL Slug</Label>
              <Input
                placeholder="deep-cleaning"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="cat_slug_field"
                data-lpignore="true"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Description</Label>
              <Input
                placeholder="Enter category description for customers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-lg text-xs"
                autoComplete="off"
                name="cat_desc_field"
                data-lpignore="true"
              />
            </div>

            {/* Icon / Image Upload */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Category Icon / Image</Label>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center px-4 h-11 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-700 transition-colors shrink-0">
                  <Upload className="size-3.5 me-2 text-slate-500" />
                  {isCompressing ? "Compressing..." : "Choose file"}
                  <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
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
              <Send className="size-3.5 me-1.5" /> {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
