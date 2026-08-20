import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createProfessional,
  deleteProfessional,
  getAdminCatalog,
  getAdminLocations,
  getAdminProfessionalDetail,
  getAdminProfessionals,
  setProfessionalSkill,
  setProfessionalStatus,
  updateProfessional,
} from "@/frontend/lib/api-services";
import { EntityForm, type FieldDef } from "@/frontend/components/admin/EntityForm";
import { DataTable } from "@/frontend/components/admin/data-table";
import {
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Switch } from "@/frontend/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import { formatMoney, num } from "@/frontend/lib/money";

export const Route = createFileRoute("/admin/professionals")({ component: AdminProfessionals });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const STATUSES = ["AVAILABLE", "BUSY", "OFFLINE", "SUSPENDED", "ON_LEAVE"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function AdminProfessionals() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("professionals", getAdminProfessionals);
  const [openId, setOpenId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any>(null);
  const locations = useAdminQuery("locations", getAdminLocations);
  const catalog = useAdminQuery("catalog", getAdminCatalog);
  const saveMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (vars: any) => {
      if (vars.id) await updateProfessional(vars);
      else await createProfessional(vars);
    },
    onSuccess: () => {
      toast.success("Professional saved");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteProfessional(id),
    onSuccess: () => {
      toast.success("Professional deleted");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: string; is_active?: boolean }) =>
      setProfessionalStatus(vars.id, vars.status, vars.is_active),
    onSuccess: () => {
      toast.success("Professional updated");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Professionals"
        description={`${rows.length} team members`}
        actions={<Button onClick={() => setEditing({ ...BLANK_PRO })}>Add professional</Button>}
      />
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="professionals.csv"
        searchPlaceholder="Search name, phone or city"
        searchKeys={(r) => [r.full_name, r.phone, r.cities?.name]}
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (r) => <span className="font-medium">{r.full_name}</span>,
            csv: (r) => r.full_name,
          },
          { key: "phone", header: "Phone", cell: (r) => r.phone ?? "—", csv: (r) => r.phone ?? "" },
          {
            key: "city",
            header: "City",
            cell: (r) => r.cities?.name ?? "—",
            csv: (r) => r.cities?.name ?? "",
          },
          { key: "rating", header: "Rating", cell: (r) => `${r.rating}★`, csv: (r) => r.rating },
          {
            key: "jobs",
            header: "Jobs",
            cell: (r) => r.completed_jobs,
            csv: (r) => r.completed_jobs,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <StatusBadge status={r.status} />,
            csv: (r) => r.status,
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
              <div className="flex items-center justify-end gap-2">
                <select
                  value={r.status}
                  onChange={(e) => mutation.mutate({ id: r.id, status: e.target.value })}
                  className="h-8 rounded-md border border-input bg-transparent px-1 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    mutation.mutate({ id: r.id, status: r.status, is_active: !r.is_active })
                  }
                >
                  {r.is_active ? "Suspend" : "Activate"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpenId(r.id)}>
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditing({
                      ...BLANK_PRO,
                      ...r,
                      work_start: String(r.work_start ?? "09:00").slice(0, 5),
                      work_end: String(r.work_end ?? "21:00").slice(0, 5),
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
                    if (confirm(`Delete ${r.full_name}?`)) del.mutate(r.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />
      <ProDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        categories={(catalog.data?.categories ?? []) as Row[]}
      />

      <EntityForm
        open={Boolean(editing)}
        title={editing?.id ? "Edit professional" : "Add professional"}
        fields={proFields((locations.data?.cities ?? []) as Row[])}
        initial={editing ?? BLANK_PRO}
        saving={saveMutation.isPending}
        onClose={() => setEditing(null)}
        onSubmit={(v) =>
          saveMutation.mutate({
            ...v,
            city_id: v.city_id || null,
            experience_years: Number(v.experience_years) || 0,
            rating: Number(v.rating) || 0,
          })
        }
      />
    </>
  );
}

const BLANK_PRO = {
  full_name: "",
  phone: "",
  email: "",
  photo_url: "",
  city_id: "",
  status: "AVAILABLE",
  experience_years: 0,
  rating: 5,
  work_start: "09:00",
  work_end: "21:00",
  notes: "",
  is_active: true,
};

function proFields(cities: Row[]): FieldDef[] {
  return [
    { name: "full_name", label: "Full name", half: true },
    { name: "phone", label: "Phone", half: true },
    { name: "email", label: "Email", half: true },
    {
      name: "city_id",
      label: "City",
      type: "select",
      half: true,
      options: cities.map((c) => ({ value: c.id, label: c.name })),
    },
    { name: "photo_url", label: "Photo", type: "image" },
    {
      name: "status",
      label: "Status",
      type: "select",
      half: true,
      options: STATUSES.map((s) => ({ value: s, label: s })),
    },
    { name: "experience_years", label: "Experience (years)", type: "number", half: true },
    { name: "rating", label: "Rating", type: "number", half: true },
    { name: "work_start", label: "Shift start", type: "time", half: true },
    { name: "work_end", label: "Shift end", type: "time", half: true },
    { name: "notes", label: "Notes", type: "textarea" },
    { name: "is_active", label: "Active", type: "switch", half: true },
  ];
}

function ProDrawer({
  id,
  onClose,
  categories,
}: {
  id: string | null;
  onClose: () => void;
  categories: Row[];
}) {
  const qc = useQueryClient();
  const skillMutation = useMutation({
    mutationFn: (vars: { professional_id: string; category_id: string; enabled: boolean }) =>
      setProfessionalSkill(vars),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "professional", id] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const { data, isPending } = useQuery({
    queryKey: ["admin", "professional", id],
    queryFn: () => getAdminProfessionalDetail(id!),
    enabled: Boolean(id),
  });
  const pro = data?.professional as Row;

  return (
    <Sheet open={Boolean(id)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{pro?.full_name ?? "Professional"}</SheetTitle>
        </SheetHeader>
        {isPending || !data || !pro ? (
          <div className="mt-4">
            <TableSkeleton rows={6} />
          </div>
        ) : (
          <div className="mt-4 space-y-5 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={pro.status} />
              <span className="text-muted-foreground">
                {pro.rating}★ · {pro.completed_jobs} jobs · {pro.experience_years} yrs
              </span>
            </div>
            <p className="text-muted-foreground">
              {pro.phone ?? "—"} · {pro.cities?.name ?? "—"} · Shift{" "}
              {String(pro.work_start).slice(0, 5)}–{String(pro.work_end).slice(0, 5)}
            </p>

            <Group title="Skills">
              {categories.map((c) => {
                const on = data.skills.some((s: Row) => s.category_id === c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <span>{c.name}</span>
                    <Switch
                      checked={on}
                      onCheckedChange={(v) =>
                        skillMutation.mutate({
                          professional_id: pro.id,
                          category_id: c.id,
                          enabled: v,
                        })
                      }
                    />
                  </div>
                );
              })}
            </Group>

            <Group title="Weekly availability">
              {data.availability.length ? (
                data.availability.map((a: Row) => (
                  <div key={a.id} className="flex justify-between">
                    <span>{DAYS[a.day_of_week]}</span>
                    <span className={a.is_available ? "" : "text-muted-foreground line-through"}>
                      {String(a.start_time).slice(0, 5)}–{String(a.end_time).slice(0, 5)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Using default shift hours.</p>
              )}
            </Group>

            <Group title="Recent jobs">
              {data.bookings.length ? (
                data.bookings.map((b: Row) => (
                  <div key={b.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {b.scheduled_date} · {b.service?.name}
                    </span>
                    <StatusBadge status={b.status} />
                    <span>{formatMoney(num(b.total))}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No jobs assigned yet.</p>
              )}
            </Group>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
