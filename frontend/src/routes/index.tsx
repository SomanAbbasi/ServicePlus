import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BellRing,
  CalendarCheck2,
  MapPin,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";

import { getHomeCatalog } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { HeroSlider } from "@/frontend/components/HeroSlider";
import { LocationPicker } from "@/frontend/components/LocationPicker";
import { Button } from "@/frontend/components/ui/button";
import { localizedText } from "@/frontend/lib/i18n-content";
import { useLocale } from "@/frontend/lib/locale";
import { useSavedLocation } from "@/frontend/lib/location";

const homeQuery = queryOptions({
  queryKey: ["home-catalog"],
  queryFn: () => getHomeCatalog(),
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(homeQuery);
  },
  head: () => ({
    meta: [
      { title: "ServicePlus — Super app for all home services in the UAE" },
      {
        name: "description",
        content:
          "Book vetted cleaning, salon, AC, pest control and handyman professionals across Dubai and the UAE with transparent pricing and same-day slots.",
      },
      { property: "og:title", content: "ServicePlus — Super app for all home services" },
      {
        name: "description",
        content: "Vetted professionals, transparent pricing, same-day availability in the UAE.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const REASONS = [
  { icon: Star, tone: "text-warning", key: "reason1" },
  { icon: CalendarCheck2, tone: "text-destructive", key: "reason2" },
  { icon: BarChart3, tone: "text-success", key: "reason3" },
  { icon: Sparkles, tone: "text-primary", key: "reason4" },
];

const PROMISES = ["home.promise1", "home.promise2", "home.promise3", "home.promise4"];

const APP_HIGHLIGHTS = [
  { icon: Smartphone, key: "app1" },
  { icon: BellRing, key: "app2" },
  { icon: Wallet, key: "app3" },
  { icon: CalendarCheck2, key: "app4" },
];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { services } = data;
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const { location, save } = useSavedLocation();
  const [pickerOpen, setPickerOpen] = useState(false);

  const topServices = services.filter((s) => s.image_url).slice(0, 10);

  return (
    <div>
      <HeroSlider>
        <h1 className="max-w-3xl text-center text-2xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl">
          {t("home.heroTitle")}
        </h1>
        <div className="mt-6 w-full max-w-md rounded-2xl bg-card p-4 shadow-2xl">
          <p className="text-sm font-medium">{t("home.whereQuestion")}</p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-start text-sm transition-colors hover:border-primary"
          >
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            <span className={location ? "truncate" : "truncate text-muted-foreground"}>
              {location?.address ?? t("home.searchArea")}
            </span>
          </button>
        </div>
      </HeroSlider>

      <LocationPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(loc) => {
          save(loc);
          setPickerOpen(false);
        }}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("home.todoTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("home.todoSubtitle")}</p>
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {topServices.map((service) => (
            <Link
              key={service.id}
              to="/services/$slug"
              params={{ slug: service.slug }}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_30px_-18px_hsl(var(--primary)/0.9)]"
            >
              <img
                src={resolveImageUrl(service.image_url)}
                alt={localizedText({ ...service }, "name", locale) ?? service.name}
                loading="lazy"
                className="size-20 rounded-2xl object-cover"
              />
              <span className="text-sm leading-tight font-semibold">
                {localizedText({ ...service }, "name", locale) ?? service.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-section py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("home.reasonsTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("home.reasonsSubtitle")}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((r) => (
              <div
                key={r.key}
                className="rounded-2xl border border-border/60 bg-card p-6 text-start"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10">
                  <r.icon className={`size-6 ${r.tone}`} aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{t(`home.${r.key}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`home.${r.key}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
          <div className="grid items-center gap-10 p-8 sm:p-12 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" aria-hidden /> {t("home.promiseChip")}
              </span>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{t("home.promiseHeading")}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{t("home.promiseIntro")}</p>
              <ul className="mt-6 space-y-3">
                {PROMISES.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-sm font-medium">
                    <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
                    {t(p)}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="mt-8"
                onClick={() => void navigate({ to: "/search", search: { q: "" } })}
              >
                {t("home.browseAll")}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {APP_HIGHLIGHTS.map((h) => (
                <div key={h.key} className="rounded-2xl bg-section p-5">
                  <h.icon className="size-6 text-primary" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">{t(`home.${h.key}.title`)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(`home.${h.key}.body`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
