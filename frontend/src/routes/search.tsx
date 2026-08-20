import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { searchServices, getHomeCatalog } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ServiceCard } from "@/frontend/components/ServiceCard";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";

interface SearchParams {
  q: string;
}

const searchQuery = (q: string) =>
  queryOptions({
    queryKey: ["search", q],
    queryFn: () => (q.trim().length >= 2 ? searchServices(q) : getHomeCatalog()),
  });

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? (search["q"] as string).slice(0, 80) : "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(searchQuery(deps.q));
  },
  head: () => ({
    meta: [
      { title: "Browse all home services — ServicePlus" },
      {
        name: "description",
        content: "Search cleaning, salon, AC, pest control and handyman services on ServicePlus.",
      },
      { property: "og:title", content: "Browse all home services — ServicePlus" },
      { property: "og:description", content: "Find the right professional for any job at home." },
      { property: "og:url", content: "/search" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { locale, t } = useLocale();
  const { data } = useSuspenseQuery(searchQuery(q));
  const services = "services" in data ? data.services : [];
  const categories = "categories" in data ? data.categories : [];
  const listings = ("listings" in data ? data.listings : []) as {
    category_id: string;
    service_id: string;
    sort_order: number;
  }[];

  const byId = new Map(services.map((s) => [s.id, s]));
  const grouped = categories
    .map((cat) => {
      const listed = listings
        .filter((l) => l.category_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((l) => byId.get(l.service_id))
        .filter((s): s is (typeof services)[number] => Boolean(s));
      const items = listed.length ? listed : services.filter((s) => s.category_id === cat.id);
      return { cat, items };
    })
    .filter((g) => g.items.length > 0);
  const listedIds = new Set(grouped.flatMap((g) => g.items.map((s) => s.id)));
  const ungrouped = services.filter((s) => !listedIds.has(s.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {q ? `Results for "${q}"` : "All services"}
      </h1>

      {categories.length ? (
        <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to="/categories/$slug"
              params={{ slug: cat.slug }}
              className="inline-flex shrink-0 items-center gap-3 rounded-full border border-border bg-card py-2 pe-5 ps-2 text-base font-medium shadow-sm transition-colors hover:border-primary"
            >
              {cat.image_url ? (
                <img
                  src={resolveImageUrl(cat.image_url)}
                  alt=""
                  loading="lazy"
                  className="size-11 rounded-full bg-muted object-cover"
                />
              ) : null}
              {localizedText({ ...cat }, "name", locale) ?? cat.name}
            </Link>
          ))}
        </div>
      ) : null}

      {services.length ? (
        <div className="mt-8 space-y-10">
          {grouped.map(({ cat, items }) => (
            <section key={cat.id}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  {localizedText({ ...cat }, "name", locale) ?? cat.name}
                </h2>
                <Link
                  to="/categories/$slug"
                  params={{ slug: cat.slug }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  See all
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {items.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          ))}
          {ungrouped.length ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">{t("search.moreServices")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {ungrouped.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No services matched that search. Try a category above.
        </p>
      )}
    </div>
  );
}
