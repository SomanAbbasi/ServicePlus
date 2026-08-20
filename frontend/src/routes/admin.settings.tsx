import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminSettings, updateSetting } from "@/frontend/lib/api-services";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SectionCard,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminSettings() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("settings", getAdminSettings);
  const mutation = useMutation({
    mutationFn: (vars: { key: string; value: Record<string, unknown> }) =>
      updateSetting(vars.key, vars.value),
    onSuccess: () => {
      toast.success("Setting saved");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Settings" description="Platform configuration stored as JSON values" />
      {isPending ? (
        <TableSkeleton rows={5} />
      ) : rows.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((s) => (
            <SectionCard
              key={s.key}
              title={s.key}
              action={
                <span className="text-xs text-muted-foreground">
                  {s.updated_at ? new Date(s.updated_at).toLocaleString() : ""}
                </span>
              }
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const raw = String(new FormData(e.currentTarget).get("value"));
                  try {
                    mutation.mutate({ key: s.key, value: JSON.parse(raw) });
                  } catch {
                    toast.error("Value must be valid JSON");
                  }
                }}
                className="space-y-2"
              >
                <Textarea
                  name="value"
                  rows={6}
                  defaultValue={JSON.stringify(s.value, null, 2)}
                  className="font-mono text-xs"
                />
                <Button type="submit" size="sm" disabled={mutation.isPending}>
                  Save
                </Button>
              </form>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No settings configured" description="Platform defaults are in use." />
      )}
    </>
  );
}
