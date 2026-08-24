import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, ChevronRight, ShieldCheck, Star } from "lucide-react";
import { getServiceDetail } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ServiceCard } from "@/frontend/components/ServiceCard";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { Button } from "@/frontend/components/ui/button";
import { formatMoney, num } from "@/frontend/lib/money";
import { useLocale } from "@/frontend/lib/locale";
import {
  localizedFaqs,
  localizedList,
  localizedSections,
  localizedText,
  paragraphs,
} from "@/frontend/lib/i18n-content";

type SvcRow = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  duration_minutes: number | null;
  base_price: number | null;
  original_price: number | null;
  seo_title: string | null;
  seo_description: string | null;
  short_description: string | null;
  description: string | null;
} & Record<string, unknown>;

const serviceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["service", slug],
    queryFn: () => getServiceDetail(slug),
  });

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(serviceQuery(params.slug));
    if (!data) throw notFound();
    const s = data.service as unknown as SvcRow;
    return {
      name: s.name,
      title: s.seo_title ?? null,
      description: s.seo_description ?? s.short_description ?? s.description ?? null,
      image: s.image_url,
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Service not found — ServicePlus" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = loaderData.title ?? `${loaderData.name} in Dubai & UAE — ServicePlus`;
    const description =
      loaderData.description ?? `Book ${loaderData.name} with vetted ServicePlus professionals.`;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: `/services/${params.slug}` },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData.image?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: loaderData.image },
        { name: "twitter:image", content: loaderData.image },
      );
    }
    return { meta, links: [{ rel: "canonical", href: `/services/${params.slug}` }] };
  },
  component: ServiceDetail,
  errorComponent: () => <Fallback title="This service didn't load" />,
  notFoundComponent: () => <Fallback title="Service not found" />,
});

function Fallback({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
        Back to home
      </Link>
    </div>
  );
}

function ServiceDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(serviceQuery(slug));
  const { locale } = useLocale();
  const ar = locale === "ar";
  if (!data) return <Fallback title="Service not found" />;
  const { variants, related } = data;
  const service = data.service as unknown as SvcRow;
  const category = (service as { service_categories?: { slug: string; name: string; name_ar?: string; nameAr?: string } })
    .service_categories;

  const name = (localizedText(service, "name", locale) ?? service.name) as string;
  const categoryName = category
    ? ((localizedText(category as unknown as Record<string, unknown>, "name", locale) ?? category.name) as string)
    : null;
  const tagline =
    (localizedText(service, "short_description", locale) ??
    localizedText(service, "shortDescription", locale) ??
    (ar
      ? "احجز محترفاً موثوقاً خلال أقل من دقيقة."
      : "Book a vetted professional in under a minute.")) as string;
  const intro = paragraphs(
    localizedText(service, "intro", locale) ?? localizedText(service, "description", locale),
  );
  const includes = localizedList(service, "includes", locale);
  const sections = localizedSections(service, "sections", locale);
  const faqs = localizedFaqs(service, "faqs", locale);

  const L = ar
    ? {
        home: "الرئيسية",
        book: "احجز الآن",
        included: "ما الذي يشمله",
        options: "الخيارات المتاحة",
        faq: "الأسئلة الشائعة",
        from: "يبدأ من",
        cancel: "إلغاء مجاني حتى 6 ساعات قبل الموعد.",
        related: "خدمات أخرى قد تهمك",
        insured: "مؤمّن وموثّق",
        minimum: "دقيقة كحد أدنى",
        reviews: "تقييم",
        inCategory: "في",
        relatedHint: "اكتشف المزيد من خدماتنا المميزة",
      }
    : {
        home: "Home",
        book: "Book now",
        included: "What's included",
        options: "Options",
        faq: "Frequently asked questions",
        from: "Starting from",
        cancel: "Free cancellation up to 6 hours before your slot.",
        related: "What other services can we help you with?",
        insured: "Insured & vetted",
        minimum: "min minimum",
        reviews: "reviews",
        inCategory: "in",
        relatedHint: "Discover more of our featured services",
      };

  return (
    <div className="bg-white" dir={ar ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 py-6 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            {L.home}
          </Link>
          {category ? (
            <>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <Link
                to="/categories/$slug"
                params={{ slug: category.slug }}
                className="transition-colors hover:text-foreground"
              >
                {categoryName}
              </Link>
            </>
          ) : null}
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          <span className="font-medium text-foreground">{name}</span>
        </nav>

        {/* ── Hero Section ── */}
        <section className="grid gap-8 pb-12 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Mobile: image first */}
          <div className="order-1 overflow-hidden rounded-2xl lg:order-2">
            <img
              src={resolveImageUrl(service.image_url) || FALLBACK_IMAGE}
              alt={name}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div className="order-2 flex flex-col gap-5 lg:order-1">
            {category ? (
              <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {categoryName}
              </span>
            ) : null}

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {name}
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-gray-500">{tagline}</p>

            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-400">{L.from}</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatMoney(num(service.base_price))}
              </span>
            </div>

            <div>
              <Button asChild size="lg" className="rounded-xl px-8">
                <Link to="/booking/$slug" params={{ slug: service.slug }}>
                  {L.book}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Rating row ── */}
        <div className="flex flex-wrap items-center gap-5 border-y border-gray-100 py-5 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            <span className="font-semibold text-gray-900">{num(service.rating).toFixed(1)}</span>
            <span className="text-gray-400">({service.review_count ?? 0} {L.reviews})</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4 text-gray-400" aria-hidden />
            {service.duration_minutes ?? 60} {L.minimum}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-green-500" aria-hidden />
            {L.insured}
          </span>
        </div>

        {/* ── Main content + Sidebar ── */}
        <div className="grid gap-10 py-12 lg:grid-cols-[1.6fr_1fr] lg:items-start">

          {/* ── Left column ── */}
          <div className="space-y-10">

            {/* Intro / description */}
            {intro.length ? (
              <section className="space-y-4">
                {intro.map((p) => (
                  <p key={p.slice(0, 40)} className="text-sm leading-7 text-gray-500">
                    {p}
                  </p>
                ))}
              </section>
            ) : null}

            {/* What's included */}
            {includes.length ? (
              <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <h2 className="text-lg font-semibold text-gray-900">{L.included}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Options / Variants */}
            {variants.length ? (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">{L.options}</h2>
                <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
                  {variants.map((v: any) => {
                    const vRec = v as Record<string, unknown>;
                    const vName = (localizedText(vRec, "name", locale) ?? v.name) as string;
                    const vDesc = (localizedText(vRec, "description", locale) ?? v.description) as string | null;
                    const vImg = resolveImageUrl(v.image_url || v.imageUrl);
                    const origP = v.original_price || v.originalPrice;
                    return (
                      <li
                        key={String(v.id)}
                        className="flex items-center justify-between gap-4 bg-white px-5 py-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {vImg && (
                            <img
                              src={vImg}
                              alt=""
                              className="size-12 rounded-xl object-cover border border-slate-100 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{vName}</p>
                            {vDesc ? (
                              <p className="mt-0.5 text-xs text-gray-400">{vDesc}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatMoney(num(v.price))}
                          </span>
                          {origP && Number(origP) > Number(v.price) && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatMoney(num(origP))}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {/* Custom sections */}
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {paragraphs(section.body).map((p) => (
                    <p key={p.slice(0, 40)} className="text-sm leading-7 text-gray-500">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* FAQ */}
            {faqs.length ? (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">{L.faq}</h2>
                <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
                  {faqs.map((faq) => (
                    <details key={faq.q} className="group">
                      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-gray-900 marker:hidden select-none [&::-webkit-details-marker]:hidden">
                        {faq.q}
                        <ChevronRight className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="px-5 pb-4 text-sm leading-6 text-gray-500">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* ── Sticky sidebar ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-400">{L.from}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {formatMoney(num(service.base_price))}
              </p>
              {service.original_price ? (
                <p className="text-sm text-gray-400 line-through">
                  {formatMoney(num(service.original_price))}
                </p>
              ) : null}

              <Button asChild size="lg" className="mt-5 w-full rounded-xl">
                <Link to="/booking/$slug" params={{ slug: service.slug }}>
                  {L.book}
                </Link>
              </Button>

              <p className="mt-3 text-center text-xs text-gray-400">{L.cancel}</p>
            </div>
          </aside>
        </div>

        {/* ── Related services ── */}
        {related.length ? (
          <section className="border-t border-gray-100 py-16">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">{L.related}</h2>
              <p className="mt-1 text-sm text-gray-400">{L.relatedHint}</p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {related.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
