import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteOptionGroup,
  deleteVariant,
  getServiceOptionGroups,
  getServiceVariants,
  upsertOptionGroup,
  upsertVariant,
} from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ImageUploader } from "@/frontend/components/admin/ImageUploader";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import { Textarea } from "@/frontend/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/frontend/components/ui/sheet";
import { formatMoney, num } from "@/frontend/lib/money";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const BLANK_GROUP = { name: "", name_ar: "", image_url: "", sort_order: 0, is_active: true };
const BLANK_OPTION = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  image_url: "",
  price: 0,
  original_price: "",
  duration_minutes: 60,
  max_quantity: 10,
  sort_order: 0,
  is_active: true,
};

/**
 * Manages the picture-tile option groups of one service and the priced
 * options inside each group (Justlife-style step 1).
 */
export function OptionsManager({ service, onClose }: { service: Row | null; onClose: () => void }) {
  const qc = useQueryClient();
  const serviceId = service?.id as string | undefined;

  const groupsQ = useQuery({
    queryKey: ["admin", "option-groups", serviceId],
    enabled: Boolean(serviceId),
    queryFn: () => getServiceOptionGroups(serviceId!),
  });
  const optionsQ = useQuery({
    queryKey: ["admin", "service-variants", serviceId],
    enabled: Boolean(serviceId),
    queryFn: () => getServiceVariants(serviceId!),
  });

  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [groupDraft, setGroupDraft] = useState<Row | null>(null);
  const [optionDraft, setOptionDraft] = useState<Row | null>(null);

  const groups = (groupsQ.data ?? []) as Row[];
  const options = (optionsQ.data ?? []) as Row[];

  const selectedGroupId = activeGroup ?? groups[0]?.id ?? null;
  const groupOptions = useMemo(
    () => options.filter((o) => o.group_id === selectedGroupId),
    [options, selectedGroupId],
  );
  const ungrouped = useMemo(() => options.filter((o) => !o.group_id), [options]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "option-groups", serviceId] });
    void qc.invalidateQueries({ queryKey: ["admin", "service-variants", serviceId] });
    void qc.invalidateQueries({ queryKey: ["admin", "catalog"] });
  };

  const groupMutation = useMutation({
    mutationFn: (v: Row) =>
      upsertOptionGroup({
        ...v,
        service_id: serviceId,
        sort_order: Number(v.sort_order) || 0,
      }),
    onSuccess: () => {
      toast.success("Group saved");
      setGroupDraft(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const groupDelete = useMutation({
    mutationFn: (id: string) => deleteOptionGroup(id),
    onSuccess: () => {
      toast.success("Group removed");
      setActiveGroup(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const optionMutation = useMutation({
    mutationFn: (v: Row) =>
      upsertVariant({
        ...v,
        service_id: serviceId,
        group_id: v.group_id ?? selectedGroupId ?? null,
        price: Number(v.price) || 0,
        original_price: v.original_price === "" ? null : Number(v.original_price),
        duration_minutes: Number(v.duration_minutes) || 60,
        max_quantity: Number(v.max_quantity) || 1,
        sort_order: Number(v.sort_order) || 0,
      }),
    onSuccess: () => {
      toast.success("Option saved");
      setOptionDraft(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const optionDelete = useMutation({
    mutationFn: (id: string) => deleteVariant(id),
    onSuccess: () => {
      toast.success("Option removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loading = groupsQ.isPending || optionsQ.isPending;

  return (
    <Sheet open={Boolean(service)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Options — {service?.name}</SheetTitle>
          <SheetDescription>
            Groups are the picture tiles customers pick in step 1. Each group holds priced options
            with quantity controls.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8 py-6">
            {/* Groups */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Option groups</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGroupDraft({ ...BLANK_GROUP })}
                >
                  <Plus className="mr-1 size-4" /> Add group
                </Button>
              </div>
              {groups.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No groups yet. Add one such as “Kitchen Cleaning” or “Water Tank Cleaning”.
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {groups.map((g) => {
                    const active = g.id === selectedGroupId;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setActiveGroup(g.id)}
                        className={`w-36 shrink-0 rounded-xl border p-2 text-left transition ${
                          active
                            ? "border-primary ring-2 ring-primary/20"
                            : "hover:border-primary/40"
                        }`}
                      >
                        {g.image_url ? (
                          <img
                            src={resolveImageUrl(g.image_url)}
                            alt=""
                            className="mb-2 h-20 w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="mb-2 h-20 w-full rounded-lg bg-muted" />
                        )}
                        <span className="line-clamp-2 text-xs font-medium">{g.name}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {options.filter((o) => o.group_id === g.id).length} options
                          {g.is_active ? "" : " · hidden"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedGroupId ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const g = groups.find((x) => x.id === selectedGroupId);
                      if (g) setGroupDraft({ ...BLANK_GROUP, ...g });
                    }}
                  >
                    Edit group
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this group? Its options stay but become ungrouped."))
                        groupDelete.mutate(selectedGroupId);
                    }}
                  >
                    Delete group
                  </Button>
                </div>
              ) : null}
            </section>

            {/* Options in group */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Options{selectedGroupId ? " in selected group" : ""}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedGroupId}
                  onClick={() => setOptionDraft({ ...BLANK_OPTION, group_id: selectedGroupId })}
                >
                  <Plus className="mr-1 size-4" /> Add option
                </Button>
              </div>
              <OptionList
                rows={groupOptions}
                empty="No options in this group yet."
                onEdit={(o) =>
                  setOptionDraft({ ...BLANK_OPTION, ...o, original_price: o.original_price ?? "" })
                }
                onDelete={(id) => {
                  if (confirm("Delete this option?")) optionDelete.mutate(id);
                }}
              />
            </section>

            {ungrouped.length ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Ungrouped options</h3>
                <p className="text-xs text-muted-foreground">
                  These show directly in step 1 without a picture tile. Edit one to assign it a
                  group.
                </p>
                <OptionList
                  rows={ungrouped}
                  empty=""
                  onEdit={(o) =>
                    setOptionDraft({
                      ...BLANK_OPTION,
                      ...o,
                      original_price: o.original_price ?? "",
                    })
                  }
                  onDelete={(id) => {
                    if (confirm("Delete this option?")) optionDelete.mutate(id);
                  }}
                />
              </section>
            ) : null}
          </div>
        )}

        {/* Group editor */}
        {groupDraft ? (
          <InlineEditor
            title={groupDraft.id ? "Edit group" : "Add group"}
            saving={groupMutation.isPending}
            onCancel={() => setGroupDraft(null)}
            onSave={() => groupMutation.mutate(groupDraft)}
          >
            <Field label="Name">
              <Input
                value={groupDraft.name}
                onChange={(e) => setGroupDraft({ ...groupDraft, name: e.target.value })}
                placeholder="Kitchen Cleaning"
              />
            </Field>
            <Field label="Name (Arabic)">
              <Input
                value={groupDraft.name_ar ?? ""}
                onChange={(e) => setGroupDraft({ ...groupDraft, name_ar: e.target.value })}
                dir="rtl"
              />
            </Field>
            <ImageUploader
              label="Tile image"
              value={groupDraft.image_url ?? ""}
              onChange={(url) => setGroupDraft({ ...groupDraft, image_url: url })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sort order">
                <Input
                  type="number"
                  value={groupDraft.sort_order}
                  onChange={(e) => setGroupDraft({ ...groupDraft, sort_order: e.target.value })}
                />
              </Field>
              <Field label="Active">
                <Switch
                  checked={Boolean(groupDraft.is_active)}
                  onCheckedChange={(v) => setGroupDraft({ ...groupDraft, is_active: v })}
                />
              </Field>
            </div>
          </InlineEditor>
        ) : null}

        {/* Option editor */}
        {optionDraft ? (
          <InlineEditor
            title={optionDraft.id ? "Edit option" : "Add option"}
            saving={optionMutation.isPending}
            onCancel={() => setOptionDraft(null)}
            onSave={() => optionMutation.mutate(optionDraft)}
          >
            <Field label="Name">
              <Input
                value={optionDraft.name}
                onChange={(e) => setOptionDraft({ ...optionDraft, name: e.target.value })}
                placeholder="Up to 1000 Gallons"
              />
            </Field>
            <Field label="Name (Arabic)">
              <Input
                value={optionDraft.name_ar ?? ""}
                onChange={(e) => setOptionDraft({ ...optionDraft, name_ar: e.target.value })}
                dir="rtl"
              />
            </Field>
            <Field label="Group">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={optionDraft.group_id ?? ""}
                onChange={(e) =>
                  setOptionDraft({ ...optionDraft, group_id: e.target.value || null })
                }
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <Textarea
                value={optionDraft.description ?? ""}
                onChange={(e) => setOptionDraft({ ...optionDraft, description: e.target.value })}
              />
            </Field>
            <Field label="Description (Arabic)">
              <Textarea
                dir="rtl"
                value={optionDraft.description_ar ?? ""}
                onChange={(e) => setOptionDraft({ ...optionDraft, description_ar: e.target.value })}
              />
            </Field>
            <ImageUploader
              label="Option image"
              value={optionDraft.image_url ?? ""}
              onChange={(url) => setOptionDraft({ ...optionDraft, image_url: url })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (AED)">
                <Input
                  type="number"
                  value={optionDraft.price}
                  onChange={(e) => setOptionDraft({ ...optionDraft, price: e.target.value })}
                />
              </Field>
              <Field label="Original price">
                <Input
                  type="number"
                  value={optionDraft.original_price}
                  onChange={(e) =>
                    setOptionDraft({ ...optionDraft, original_price: e.target.value })
                  }
                />
              </Field>
              <Field label="Duration (min)">
                <Input
                  type="number"
                  value={optionDraft.duration_minutes}
                  onChange={(e) =>
                    setOptionDraft({ ...optionDraft, duration_minutes: e.target.value })
                  }
                />
              </Field>
              <Field label="Max quantity">
                <Input
                  type="number"
                  value={optionDraft.max_quantity}
                  onChange={(e) => setOptionDraft({ ...optionDraft, max_quantity: e.target.value })}
                />
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  value={optionDraft.sort_order}
                  onChange={(e) => setOptionDraft({ ...optionDraft, sort_order: e.target.value })}
                />
              </Field>
              <Field label="Active">
                <Switch
                  checked={Boolean(optionDraft.is_active)}
                  onCheckedChange={(v) => setOptionDraft({ ...optionDraft, is_active: v })}
                />
              </Field>
            </div>
          </InlineEditor>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function OptionList({
  rows,
  empty,
  onEdit,
  onDelete,
}: {
  rows: Row[];
  empty: string;
  onEdit: (row: Row) => void;
  onDelete: (id: string) => void;
}) {
  if (!rows.length)
    return empty ? (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    ) : null;
  return (
    <ul className="divide-y rounded-lg border">
      {rows.map((o) => (
        <li key={o.id} className="flex items-center gap-3 p-3">
          {o.image_url ? (
            <img src={resolveImageUrl(o.image_url)} alt="" className="size-10 rounded-md object-cover" />
          ) : (
            <div className="size-10 rounded-md bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{o.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(num(o.price))} · {o.duration_minutes} min
              {o.is_active ? "" : " · hidden"}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onEdit(o)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(o.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function InlineEditor({
  title,
  saving,
  children,
  onCancel,
  onSave,
}: {
  title: string;
  saving: boolean;
  children: React.ReactNode;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-6 border-t bg-background p-6 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
      <div className="max-h-[45vh] space-y-4 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
