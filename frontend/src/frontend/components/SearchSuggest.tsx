import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp } from "lucide-react";

import { getHomeCatalog } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { Input } from "@/frontend/components/ui/input";
import { useLocale } from "@/frontend/lib/locale";
import { formatMoney, num } from "@/frontend/lib/money";

const POPULAR = [
  "Home Cleaning",
  "Women's Salon",
  "Handyman & Maintenance",
  "AC Cleaning",
  "Disinfection Service",
];

type Hit =
  | { kind: "service"; id: string; slug: string; name: string; image: string | null; price: number }
  | { kind: "category"; id: string; slug: string; name: string; image: string | null };

/** Header search with live suggestions for services and categories. */
export function SearchSuggest({
  className = "",
  autoFocus = false,
  onNavigate,
}: {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement | null>(null);

  const { data } = useQuery({
    queryKey: ["home-catalog"],
    queryFn: () => getHomeCatalog(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = (row: { name: string; name_ar?: string | null }) =>
    locale === "ar" && row.name_ar ? row.name_ar : row.name;

  const hits = useMemo<Hit[]>(() => {
    if (!data) return [];
    const q = term.trim().toLowerCase();
    if (!q) return [];
    const match = (row: { name: string; name_ar?: string | null }) =>
      row.name.toLowerCase().includes(q) || (row.name_ar ?? "").toLowerCase().includes(q);
    const cats: Hit[] = (data.categories ?? [])
      .filter((c: any) => c.is_active !== false && c.isActive !== false && match(c))
      .slice(0, 3)
      .map((c) => ({
        kind: "category",
        id: c.id,
        slug: c.slug,
        name: name(c),
        image: c.image_url,
      }));
    const svcs: Hit[] = (data.services ?? [])
      .filter((s: any) => s.is_active !== false && s.isActive !== false && match(s))
      .slice(0, 7)
      .map((s) => ({
        kind: "service",
        id: s.id,
        slug: s.slug,
        name: name(s),
        image: s.image_url,
        price: num(s.base_price),
      }));
    return [...svcs, ...cats];
  }, [data, term, locale]);

  const topServices = (data?.services ?? []).filter((s: any) => s.is_active !== false && s.isActive !== false && s.image_url).slice(0, 8);

  const go = (hit: Hit) => {
    setOpen(false);
    setTerm("");
    onNavigate?.();
    if (hit.kind === "service") {
      void navigate({ to: "/services/$slug", params: { slug: hit.slug } });
    } else {
      void navigate({ to: "/categories/$slug", params: { slug: hit.slug } });
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const hit = hits[active];
    if (hit) return go(hit);
    setOpen(false);
    onNavigate?.();
    void navigate({ to: "/search", search: { q: term.trim() } });
  };

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <form onSubmit={submit}>
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={term}
          autoFocus={autoFocus}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setTerm(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, hits.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            }
          }}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-11 rounded-full ps-9"
        />
      </form>

      {open ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-popover p-3 shadow-xl">
          {hits.length ? (
            <ul className="space-y-1">
              {hits.map((hit, i) => (
                <li key={`${hit.kind}-${hit.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(hit)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start ${
                      i === active ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <img
                      src={resolveImageUrl(hit.image) || FALLBACK_IMAGE}
                      alt=""
                      loading="lazy"
                      className="size-10 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{hit.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {hit.kind === "service"
                          ? `${t("common.from")} ${formatMoney(hit.price)}`
                          : t("search.allServices")}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold">
                <TrendingUp className="size-4 text-primary" aria-hidden />
                {t("search.popular")}
              </p>
              <div className="flex flex-wrap gap-2 pb-3">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setTerm(p);
                      setActive(0);
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary"
                  >
                    {p}
                  </button>
                ))}
              </div>
              {topServices.length ? (
                <>
                  <p className="border-t border-border px-1 pt-3 pb-2 text-sm font-semibold">
                    {t("search.topForYou")}
                  </p>
                  <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                    {topServices.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          go({
                            kind: "service",
                            id: s.id,
                            slug: s.slug,
                            name: s.name,
                            image: s.image_url,
                            price: num(s.base_price),
                          })
                        }
                        className="w-20 shrink-0 text-center"
                      >
                        <img
                          src={resolveImageUrl(s.image_url) || FALLBACK_IMAGE}
                          alt=""
                          loading="lazy"
                          className="size-16 w-full rounded-xl object-cover"
                        />
                        <span className="mt-1 block text-[11px] leading-tight">{name(s)}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
