import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  getAdminCatalog,
  setServiceListing,
  updateCategory,
} from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { EntityForm, type FieldDef } from "@/frontend/components/admin/EntityForm";
import {
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Switch } from "@/frontend/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";

export const Route = createFileRoute("/admin/categories/")({ component: AdminCategories });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminCategories() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("catalog", getAdminCatalog);
  const [editing, setEditing] = useState<Row | null>(null);
  const [listingFor, setListingFor] = useState<Row | null>(null);

  const catMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (vars: any) => {
      if (vars.id) await updateCategory(vars);
      else await createCategory(vars);
    },
    onSuccess: () => {
      toast.success("Category saved");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const listMutation = useMutation({
    mutationFn: (vars: { category_id: string; service_id: string; listed: boolean }) =>
      setServiceListing(vars),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  if (isPending || !data) {
    return (
      <>
        <PageHeader title="Categories" />
        <TableSkeleton rows={6} />
      </>
    );
  }

  const categories = data.categories as Row[];
  const services = data.services as Row[];
  const listings = data.listings as Row[];

  const listedIds = (categoryId: string) =>
    new Set([
      ...services.filter((s) => s.category_id === categoryId).map((s) => s.id),
      ...listings.filter((l) => l.category_id === categoryId).map((l) => l.service_id),
    ]);

  return (
    <>
      <PageHeader
        title="Categories"
        description={`${categories.length} categories`}
        actions={
          <Link to="/admin/categories/create">
            <Button>Add category</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const count = listedIds(c.id).size;
          return (
            <Card key={c.id} className="overflow-hidden">
              {c.image_url ? (
                <img src={resolveImageUrl(c.image_url)} alt="" className="h-28 w-full object-cover" />
              ) : null}
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{c.name}</p>
                  <StatusBadge status={c.is_active ? "ACTIVE" : "INACTIVE"} />
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.description ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{count} services listed</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setEditing(c)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setListingFor(c)}>
                    Manage services
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => catMutation.mutate({ id: c.id, is_active: !c.is_active })}
                  >
                    {c.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${c.name}"?`)) delMutation.mutate(c.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <EntityForm
        open={Boolean(editing)}
        title={editing?.id ? "Edit category" : "Add category"}
        fields={CATEGORY_FIELDS_UI}
        initial={editing ?? {}}
        saving={catMutation.isPending}
        onClose={() => setEditing(null)}
        onSubmit={(v) => catMutation.mutate({ ...v, sort_order: Number(v.sort_order) || 0 })}
      />

      <Sheet open={Boolean(listingFor)} onOpenChange={(o) => !o && setListingFor(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{listingFor?.name} — services</SheetTitle>
          </SheetHeader>
          {listingFor ? (
            <div className="mt-4 space-y-3">
              {services.map((s) => {
                const primary = s.category_id === listingFor.id;
                const listed = listings.some(
                  (l) => l.category_id === listingFor.id && l.service_id === s.id,
                );
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">
                      {s.name}
                      {primary ? (
                        <span className="ms-2 text-xs text-muted-foreground">primary</span>
                      ) : null}
                    </span>
                    <Switch
                      checked={primary || listed}
                      disabled={primary}
                      onCheckedChange={(v) =>
                        listMutation.mutate({
                          category_id: listingFor.id,
                          service_id: s.id,
                          listed: v,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

const CATEGORY_FIELDS_UI: FieldDef[] = [
  { name: "name", label: "Name (English)", half: true },
  { name: "name_ar", label: "Name (Arabic)", half: true },
  { name: "slug", label: "Slug", half: true, hint: "Leave blank to generate from the name" },
  { name: "sort_order", label: "Sort order", type: "number", half: true },
  {
    name: "image_url",
    label: "Category image",
    type: "image",
    hint: "Shown everywhere the category appears",
  },
  { name: "description", label: "Description (English)", type: "textarea" },
  { name: "description_ar", label: "Description (Arabic)", type: "textarea" },
  {
    name: "intro",
    label: "Intro (English)",
    type: "textarea",
    hint: "Paragraphs for the category landing page. Separate paragraphs with blank lines.",
  },
  {
    name: "intro_ar",
    label: "Intro (Arabic)",
    type: "textarea",
    hint: "فقرات صفحة هبوط الفئة. فصل الفقرات بسطر فارغ.",
  },
  {
    name: "seo_title",
    label: "SEO title",
    hint: "If blank, defaults to \"{name} services in Dubai & UAE — ServicePlus\"",
  },
  {
    name: "seo_description",
    label: "SEO description",
    type: "textarea",
    hint: "Meta description for search engines",
  },
  {
    name: "sections",
    label: "Sections (English)",
    type: "list",
    hint: 'JSON: [{"title":"Section Title","body":"Content paragraph..."}]',
  },
  {
    name: "sections_ar",
    label: "Sections (Arabic)",
    type: "list",
    hint: 'JSON: [{"title":"عنوان القسم","body":"نص الفقرة..."}]',
  },
  {
    name: "faqs",
    label: "FAQs (English)",
    type: "list",
    hint: 'JSON: [{"q":"Question?","a":"Answer text..."}]',
  },
  {
    name: "faqs_ar",
    label: "FAQs (Arabic)",
    type: "list",
    hint: 'JSON: [{"q":"سؤال؟","a":"نص الإجابة..."}]',
  },
  { name: "is_active", label: "Active", type: "switch", half: true },
];
