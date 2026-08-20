import { useEffect, useState } from "react";
import { ImageUploader } from "@/frontend/components/admin/ImageUploader";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";

export type FieldType =
  "text" | "textarea" | "number" | "select" | "switch" | "image" | "list" | "time";

export type FieldDef = {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  half?: boolean;
  hint?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Values = any;

/** Reusable create/edit form rendered in a side sheet. */
export function EntityForm({
  open,
  title,
  fields,
  initial,
  saving,
  onClose,
  onSubmit,
  extra,
}: {
  open: boolean;
  title: string;
  fields: FieldDef[];
  initial: Values;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: Values) => void;
  extra?: React.ReactNode;
}) {
  const [values, setValues] = useState<Values>(initial);

  useEffect(() => {
    if (open) setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(initial)]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (name: string, value: unknown) => setValues((v: any) => ({ ...v, [name]: value }));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <form
          className="mt-4 grid grid-cols-2 gap-4 pb-10"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          {fields.map((f) => {
            const type = f.type ?? "text";
            const value = values[f.name];
            return (
              <div key={f.name} className={f.half ? "col-span-1" : "col-span-2"}>
                {type === "image" ? (
                  <ImageUploader
                    label={f.label}
                    value={value ?? ""}
                    onChange={(url) => set(f.name, url)}
                  />
                ) : type === "switch" ? (
                  <div className="flex h-10 items-center justify-between rounded-md border border-border px-3">
                    <Label htmlFor={f.name}>{f.label}</Label>
                    <Switch
                      id={f.name}
                      checked={Boolean(value)}
                      onCheckedChange={(v) => set(f.name, v)}
                    />
                  </div>
                ) : (
                  <>
                    <Label htmlFor={f.name}>{f.label}</Label>
                    {type === "textarea" || type === "list" ? (
                      <Textarea
                        id={f.name}
                        rows={type === "list" ? 4 : 3}
                        value={value ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    ) : type === "select" ? (
                      <select
                        id={f.name}
                        value={value ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">—</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={f.name}
                        type={type === "number" ? "number" : type === "time" ? "time" : "text"}
                        step="any"
                        value={value ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) =>
                          set(
                            f.name,
                            type === "number"
                              ? e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                              : e.target.value,
                          )
                        }
                      />
                    )}
                    {f.hint ? <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p> : null}
                  </>
                )}
              </div>
            );
          })}
          {extra ? <div className="col-span-2">{extra}</div> : null}
          <div className="col-span-2 flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
