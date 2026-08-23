import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  getAdminBundles,
  createBundle,
  deleteBundle,
  getAdminCatalog,
} from "@/frontend/lib/api-services";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/frontend/components/ui/dialog";
import { Label } from "@/frontend/components/ui/label";
import { Boxes, Layers, Package, Plus, Sliders, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageActions, StatusBadge, ActionIconButton } from "@/frontend/components/admin/shell";

export const Route = createFileRoute("/admin/service-grouping/")({ component: AdminServiceGroupingPage });

function AdminServiceGroupingPage() {
  const queryClient = useQueryClient();
  const { data: bundlesData } = useAdminQuery("bundles", getAdminBundles);
  const { data: catalogData } = useAdminQuery("catalog", getAdminCatalog);

  const bundles = (bundlesData as any[]) ?? [];
  const services = (catalogData as any)?.services ?? [];

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("299");
  const [originalPrice, setOriginalPrice] = useState("399");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Package Name is required");
      return;
    }
    await createBundle({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description,
      price: parseFloat(price) || 0,
      original_price: parseFloat(originalPrice) || null,
      is_active: true,
    });
    toast.success(`Service package "${name}" created!`);
    setIsAddOpen(false);
    setName("");
    setSlug("");
    setDescription("");
    queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove package "${name}"?`)) {
      await deleteBundle(id);
      toast.success(`Package "${name}" removed.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      <PageHeader
        title="Service Grouping & Packages"
        description="Bundle multiple related services and addons into high-converting special offers and multi-room packages."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Service Management" },
          { label: "Service Grouping" }
        ]}
        actions={
          <PageActions
            addNewLabel="Create Grouped Package"
            addNewTo="/admin/service-grouping/create"
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bundles.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-slate-400 bg-white border-slate-200">
            <Layers className="size-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No service bundles currently active.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Create Grouped Package" to create combos.</p>
          </Card>
        ) : (
          bundles.map((bundle) => (
            <Card key={bundle.id} className="p-5 bg-white border-slate-200 shadow-xs flex flex-col justify-between hover:border-cyan-300 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{bundle.name}</h3>
                    <span className="text-[11px] font-mono text-primary">/{bundle.slug}</span>
                  </div>
                  <StatusBadge status={bundle.is_active !== false ? "Active" : "Paused"} />
                </div>

                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {bundle.description || "Comprehensive multi-service cleaning bundle with included add-ons."}
                </p>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">AED {bundle.price}</span>
                  {bundle.original_price && (
                    <span className="text-xs text-slate-400 line-through">AED {bundle.original_price}</span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">{bundle.items?.length || 2} Included Services</span>
                <div className="flex items-center gap-1">
                  <ActionIconButton icon={Sliders} label="Edit" action="edit" to="/admin/service-grouping/edit" search={{ id: bundle.id }} />
                  <ActionIconButton icon={Trash2} label="Remove" action="delete" onClick={() => handleDelete(bundle.id, bundle.name)} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Bundle Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Sparkles className="size-5 text-primary" /> Create Service Package
            </DialogTitle>
            <DialogDescription className="text-xs">
              Combine multiple cleaning services into a promotional bundle.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} autoComplete="off" className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Package Name *</Label>
              <Input
                placeholder="Enter package or bundle name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="off"
                name="pkg_name_field"
                data-lpignore="true"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Description</Label>
              <Input
                placeholder="Enter package description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoComplete="off"
                name="pkg_desc_field"
                data-lpignore="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Bundle Price (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Original Price (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-bold text-xs">
                Create Package
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
