import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { cancelBooking, getMyBookings } from "@/frontend/lib/api-services";
import { type BookingStatus, CUSTOMER_CANCELLABLE } from "@/frontend/lib/booking-status";
import { formatMoney, num } from "@/frontend/lib/money";
import { Button } from "@/frontend/components/ui/button";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";
import { useSession } from "@/frontend/lib/use-session";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My bookings — ServicePlus" },
      { name: "description", content: "Track, reschedule and cancel your ServicePlus bookings." },
      { property: "og:title", content: "My bookings — ServicePlus" },
      { property: "og:description", content: "Track your home-service bookings in one place." },
      { property: "og:url", content: "/dashboard" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, locale } = useLocale();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("dashboard.loading")}</p>
      ) : bookings.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("dashboard.empty")}</p>
          <Button asChild className="mt-4">
            <Link to="/">{t("dashboard.browse")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {bookings.map((b: any) => {
            const status = b.status as BookingStatus;
            return (
              <li key={b.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {localizedText(b.services, "name", locale) ?? t("dashboard.service")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {b.scheduled_date} · {b.scheduled_start?.slice(0, 5)} –{" "}
                      {b.scheduled_end?.slice(0, 5)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">#{b.booking_number}</p>
                  </div>
                  <div className="text-end">
                    <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {t(`status.${status}`)}
                    </span>
                    <p className="mt-2 font-semibold">{formatMoney(num(b.total))}</p>
                  </div>
                </div>
                {CUSTOMER_CANCELLABLE.includes(status) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-destructive"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(b.id)}
                  >
                    {t("dashboard.cancel")}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
