import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { searchServices, getHomeCatalog } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ServiceCard } from "@/frontend/components/ServiceCard";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";
import { iconByName } from "@/frontend/components/icons";
import { ChevronLeft, ChevronRight, Home as HomeIcon } from "lucide-react";

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
  const sliderRef = useRef<HTMLDivElement>(null);

  const services = "services" in data ? data.services : [];
  const categories = "categories" in data ? data.categories : [];
  const listings = ("listings" in data ? data.listings : []) as {
    category_id: string;
    service_id: string;
    sort_order: number;
  }[];

  const byId = new Map(services.map((s) => [s.id, s]));
  const sortedCategories = [...categories].sort((a, b) => {
    const isGeneralA = a.slug.includes("general") || a.slug.includes("cleaning");
    const isGeneralB = b.slug.includes("general") || b.slug.includes("cleaning");
    if (isGeneralA && !isGeneralB) return -1;
    if (!isGeneralA && isGeneralB) return 1;
    return ((a as any).sort_order ?? (a as any).sortOrder ?? 0) - ((b as any).sort_order ?? (b as any).sortOrder ?? 0);
  });

  const grouped = sortedCategories
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

  const isAr = locale === "ar";

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const amount = direction === "left" ? -280 : 280;
      sliderRef.current.scrollBy({ left: isAr ? -amount : amount, behavior: "smooth" });
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-slate-50/50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top Header & Back to Home Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
              <Link to="/" className="hover:text-cyan-600 transition-colors flex items-center gap-1">
                <HomeIcon className="size-3.5" />
                {t("nav.home")}
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-slate-800 font-bold">{t("search.allServices")}</span>
            </nav>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
              {q ? `${t("search.resultsFor")} "${q}"` : t("search.allServices")}
            </h1>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-cyan-500"
          >
            <div className="grid size-6 place-items-center rounded-full bg-slate-100 text-slate-600">
              {isAr ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </div>
            {t("category.backHome")}
          </Link>
        </div>

        {/* Rounded Category Chips with Circular Avatars */}
        {categories.length ? (
          <div className="relative mt-4 sm:mt-6">
            {/* Scroll Left Button (Hidden on Mobile for touch scroll) */}
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scroll categories left"
              className="hidden sm:grid absolute start-0 top-1/2 z-10 -translate-y-1/2 size-9 place-items-center rounded-full border border-slate-200 bg-white shadow-md text-slate-700 transition-all hover:bg-slate-50 hover:scale-105 active:scale-95"
            >
              {isAr ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
            </button>

            {/* Category Pills Container */}
            <div
              ref={sliderRef}
              className="flex items-center gap-2.5 overflow-x-auto sm:px-10 py-1.5 scrollbar-none scroll-smooth"
            >
              {categories.map((cat) => {
                const Icon = iconByName(cat.icon);
                return (
                  <Link
                    key={cat.id}
                    to="/categories/$slug"
                    params={{ slug: cat.slug }}
                    className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pe-3.5 ps-1.5 text-xs font-bold text-slate-800 shadow-2xs transition-all hover:border-cyan-500 hover:bg-slate-50 hover:shadow-sm"
                  >
                    {cat.image_url ? (
                      <img
                        src={resolveImageUrl(cat.image_url)}
                        alt={cat.name}
                        loading="lazy"
                        className="size-7 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-cyan-500 transition-all"
                      />
                    ) : (
                      <div className="grid size-7 place-items-center rounded-full bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                        <Icon className="size-3.5" />
                      </div>
                    )}
                    <span>{localizedText({ ...cat }, "name", locale) ?? cat.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Scroll Right Button (Hidden on Mobile for touch scroll) */}
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scroll categories right"
              className="hidden sm:grid absolute end-0 top-1/2 z-10 -translate-y-1/2 size-9 place-items-center rounded-full border border-slate-200 bg-white shadow-md text-slate-700 transition-all hover:bg-slate-50 hover:scale-105 active:scale-95"
            >
              {isAr ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
            </button>
          </div>
        ) : null}

        {/* Services Grouped by Category */}
        {services.length ? (
          <div className="mt-8 space-y-8 sm:space-y-12">
            {grouped.map(({ cat, items }) => {
              const catName = localizedText({ ...cat }, "name", locale) ?? cat.name;
              return (
                <section key={cat.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xs">
                  <div className="flex items-center justify-between gap-4 pb-3 sm:pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {cat.image_url && (
                        <img
                          src={resolveImageUrl(cat.image_url)}
                          alt=""
                          className="size-6 sm:size-7 rounded-full object-cover"
                        />
                      )}
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {catName}
                      </h2>
                    </div>

                    <Link
                      to="/categories/$slug"
                      params={{ slug: cat.slug }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
                    >
                      See all
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </div>

                  <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {items.map((service) => (
                      <ServiceCard key={service.id} service={service} categoryName={catName} />
                    ))}
                  </div>
                </section>
              );
            })}

            {ungrouped.length ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xs">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 pb-3 sm:pb-4 border-b border-slate-100">
                  {t("search.moreServices")}
                </h2>
                <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {ungrouped.map((service) => {
                    const catObj = categories.find((c) => c.id === service.category_id);
                    const catName = catObj ? (localizedText({ ...catObj }, "name", locale) ?? catObj.name) : undefined;
                    return <ServiceCard key={service.id} service={service} categoryName={catName} />;
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="mt-12 text-center rounded-2xl border border-slate-200 bg-white p-12">
            <p className="text-sm font-semibold text-slate-600">
              No services matched that search. Try selecting a category above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
