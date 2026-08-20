import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAdminSupport,
  getAdminTicket,
  replyToTicket,
  setTicketStatus,
} from "@/frontend/lib/api-services";
import { DataTable } from "@/frontend/components/admin/data-table";
import {
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/frontend/components/ui/sheet";
import { cn } from "@/frontend/lib/utils";

export const Route = createFileRoute("/admin/support")({ component: AdminSupport });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const TICKET_STATUS = ["open", "pending", "resolved", "closed"];

function AdminSupport() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useAdminQuery("support", getAdminSupport);
  const [openId, setOpenId] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: string }) => setTicketStatus(vars.id, vars.status),
    onSuccess: () => {
      toast.success("Ticket updated");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) return <ErrorState />;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Support" description={`${rows.length} tickets`} />
      <DataTable<Row>
        rows={rows}
        loading={isPending}
        csvName="support.csv"
        searchPlaceholder="Search subject or customer"
        searchKeys={(r) => [r.subject, r.profile?.full_name, r.profile?.phone]}
        empty="No support tickets"
        columns={[
          {
            key: "subject",
            header: "Subject",
            cell: (r) => <span className="font-medium">{r.subject}</span>,
            csv: (r) => r.subject,
          },
          {
            key: "customer",
            header: "Customer",
            cell: (r) => r.profile?.full_name ?? r.profile?.phone ?? "—",
            csv: (r) => r.profile?.full_name ?? "",
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <StatusBadge status={r.status} />,
            csv: (r) => r.status,
          },
          {
            key: "created",
            header: "Opened",
            cell: (r) => new Date(r.created_at).toLocaleString(),
            csv: (r) => r.created_at,
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
              <div className="flex justify-end gap-2">
                <select
                  value={r.status}
                  onChange={(e) => statusMutation.mutate({ id: r.id, status: e.target.value })}
                  className="h-8 rounded-md border border-input bg-transparent px-1 text-xs"
                >
                  {TICKET_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => setOpenId(r.id)}>
                  Open
                </Button>
              </div>
            ),
          },
        ]}
      />
      <TicketDrawer id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function TicketDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["admin", "ticket", id],
    queryFn: () => getAdminTicket(id!),
    enabled: Boolean(id),
  });

  const replyMutation = useMutation({
    mutationFn: () => replyToTicket(id!, body),
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["admin", "ticket", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ticket = data?.ticket as Row;

  return (
    <Sheet open={Boolean(id)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{ticket?.subject ?? "Ticket"}</SheetTitle>
        </SheetHeader>
        {isPending || !data ? (
          <div className="mt-4">
            <TableSkeleton rows={5} />
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge status={ticket?.status} />
              <span>{ticket?.profile?.full_name ?? ticket?.profile?.phone ?? "Customer"}</span>
            </div>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
              {data.messages.length ? (
                data.messages.map((m: Row) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[85%] rounded-lg p-3 text-sm",
                      m.sender === "agent"
                        ? "ms-auto bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <p>{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              )}
            </div>
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (body.trim()) replyMutation.mutate();
              }}
            >
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a reply…"
                rows={3}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={replyMutation.isPending || !body.trim()}
              >
                Send reply
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
