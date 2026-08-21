import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createService,
  deleteService,
  duplicateService,
  getAdminCatalog,
  updateService,
} from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { DataTable } from "@/frontend/components/admin/data-table";
import { EntityForm, type FieldDef } from "@/frontend/components/admin/EntityForm";
import { FilterSelect } from "@/frontend/components/admin/filters";
import { OptionsManager } from "@/frontend/components/admin/OptionsManager";
import { ErrorState, PageHeader, StatusBadge } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/services/")({ component: AdminServices });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Values = any;

const BLANK: Values = {
  name: "",
  slug: "",
  category_id: "",
  short_description: "",
  description: "",
  image_url: "",

  booking_type: "hourly",
  base_price: 0,
  original_price: "",
  hourly_rate: "",
  materials_price: 0,
  extra_professional_pct: 0,
  min_hours: 1,
  max_hours: 8,
  max_professionals: 4,
  duration_minutes: 60,
  includes: "",
  is_featured: false,
  is_active: true,
  sort_order: 0,
};

function AdminServices() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("catalog", getAdminCatalog);
  const [editing, setEditing] = useState<Values | null>(null);
  const [optionsFor, setOptionsFor] = useState<Row | null>(null);
  const [fCategory, setFCategory] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fType, setFType] = useState("all");
  const [fFeatured, setFFeatured] = useState("all");

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin"] });

  const mutation = useMutation({
    mutationFn: async (vars: Values) => {
      if (vars.id) await updateService(vars);
      else await createService(vars);
    },
    onSuccess: () => {
      toast.success("Service saved");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quick = useMutation({
    mutationFn: (vars: Values) => updateService(vars),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("Service deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dup = useMutation({
    mutationFn: (id: string) => duplicateService(id),
    onSuccess: () => {
      toast.success("Copy created (inactive)");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const services = (data?.services ?? []) as Row[];
  const categories = (data?.categories ?? []) as Row[];
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const filtered = services.filter(
    (s) =>
      (fCategory === "all" || s.category_id === fCategory) &&
      (fStatus === "all" || (fStatus === "active" ? s.is_active : !s.is_active)) &&
      (fType === "all" || s.booking_type === fType) &&
      (fFeatured === "all" || Boolean(s.is_featured)),
  );
  const filtersOn =
    fCategory !== "all" || fStatus !== "all" || fType !== "all" || fFeatured !== "all";
  const clearFilters = () => {
    setFCategory("all");
    setFStatus("all");
    setFType("all");
    setFFeatured("all");
  };

  const fields: FieldDef[] = [
    { name: "name", label: "Name", half: true },
    { name: "slug", label: "Slug", half: true, hint: "Leave blank to generate from the name" },
    {
      name: "category_id",
      label: "Category",
      type: "select",
      half: true,
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: "booking_type",
      label: "Booking type",
      type: "select",
      half: true,
      options: [
        { value: "hourly", label: "Hourly" },
        { value: "fixed", label: "Fixed price" },
        { value: "variant", label: "Variants" },
      ],
    },
    { name: "image_url", label: "Cover image", type: "image" },
    { name: "short_description", label: "Short description", type: "textarea" },
    { name: "description", label: "Full description", type: "textarea" },
    { name: "base_price", label: "Base price (AED)", type: "number", half: true },
    {
      name: "original_price",
      label: "Original price (strike-through)",
      type: "number",
      half: true,
    },
    { name: "hourly_rate", label: "Hourly rate", type: "number", half: true },
    { name: "materials_price", label: "Materials price", type: "number", half: true },
    { name: "extra_professional_pct", label: "Extra professional %", type: "number", half: true },
    { name: "duration_minutes", label: "Duration (min)", type: "number", half: true },
    { name: "min_hours", label: "Min hours", type: "number", half: true },
    { name: "max_hours", label: "Max hours", type: "number", half: true },
    { name: "max_professionals", label: "Max professionals", type: "number", half: true },
    { name: "sort_order", label: "Sort order", type: "number", half: true },

    {
      name: "includes",
      label: "What's included",
      type: "list",
      hint: "One item per line",
    },
    { name: "is_active", label: "Active", type: "switch", half: true },
    { name: "is_featured", label: "Featured", type: "switch", half: true },
  ];

  return (
    <>
      <PageHeader
        title="Services"
        description={
          filtersOn
            ? `${filtered.length} of ${services.length} services`
            : `${services.length} services in the catalogue`
        }
        actions={
          <Link to="/admin/services/create">
            <Button>Add service</Button>
          </Link>
        }
      />
      <DataTable<Row>
        rows={filtered}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Category"
              value={fCategory}
              onChange={setFCategory}
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((c) => ({ value: c.id as string, label: c.name as string })),
              ]}
            />
            <FilterSelect
              label="Status"
              value={fStatus}
              onChange={setFStatus}
              options={[
                { value: "all", label: "Any status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
            <FilterSelect
              label="Type"
              value={fType}
              onChange={setFType}
              options={[
                { value: "all", label: "Any type" },
                { value: "hourly", label: "Hourly" },
                { value: "fixed", label: "Fixed price" },
                { value: "variant", label: "Variants" },
              ]}
            />
            <FilterSelect
              label="Featured"
              value={fFeatured}
              onChange={setFFeatured}
              options={[
                { value: "all", label: "All" },
                { value: "featured", label: "Featured only" },
              ]}
            />
            {filtersOn ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        }
        loading={isPending}
        csvName="services.csv"
        searchPlaceholder="Search service or category"
        searchKeys={(r) => [r.name, r.slug, catName(r.category_id)]}
        columns={[
          {
            key: "name",
            header: "Service",
            cell: (r) => (
              <div className="flex items-center gap-2">
                {r.image_url ? (
                  <img src={resolveImageUrl(r.image_url)} alt="" className="size-8 rounded-md object-cover" />
                ) : (
                  <div className="size-8 rounded-md bg-muted" />
                )}
                <span className="font-medium">{r.name}</span>
              </div>
            ),
            csv: (r) => r.name,
          },
          {
            key: "category",
            header: "Category",
            cell: (r) => catName(r.category_id),
            csv: (r) => catName(r.category_id),
          },
          { key: "type", header: "Type", cell: (r) => r.booking_type, csv: (r) => r.booking_type },
          {
            key: "price",
            header: "Base price",
            cell: (r) => formatMoney(num(r.base_price)),
            csv: (r) => r.base_price,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <StatusBadge status={r.is_active ? "ACTIVE" : "INACTIVE"} />,
            csv: (r) => (r.is_active ? "active" : "inactive"),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => quick.mutate({ id: r.id, is_active: !r.is_active })}
                >
                  {r.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOptionsFor(r)}>
                  Options
                </Button>
                <Button variant="ghost" size="sm" onClick={() => dup.mutate(r.id)}>
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditing({
                      ...BLANK,
                      ...r,
                      original_price: r.original_price ?? "",
                      hourly_rate: r.hourly_rate ?? "",
                      includes: Array.isArray(r.includes) ? r.includes.join("\n") : "",
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${r.name}"? This cannot be undone.`)) del.mutate(r.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      <EntityForm
        open={Boolean(editing)}
        title={editing?.id ? "Edit service" : "Add service"}
        fields={fields}
        initial={editing ?? BLANK}
        saving={mutation.isPending}
        onClose={() => setEditing(null)}
        onSubmit={(v) =>
          mutation.mutate({
            ...v,
            base_price: Number(v.base_price) || 0,
            original_price: v.original_price === "" ? null : Number(v.original_price),
            hourly_rate: v.hourly_rate === "" ? null : Number(v.hourly_rate),
            materials_price: Number(v.materials_price) || 0,
            extra_professional_pct: Number(v.extra_professional_pct) || 0,
            min_hours: Number(v.min_hours) || 1,
            max_hours: Number(v.max_hours) || 8,
            max_professionals: Number(v.max_professionals) || 1,
            duration_minutes: Number(v.duration_minutes) || 60,
            sort_order: Number(v.sort_order) || 0,
            includes: String(v.includes ?? "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
      />

      <OptionsManager service={optionsFor} onClose={() => setOptionsFor(null)} />
    </>
  );
}
