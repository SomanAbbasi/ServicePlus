import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, ShieldCheck, Sparkles, Star } from "lucide-react";
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
  const category = (service as { service_categories?: { slug: string; name: string } })
    .service_categories;

  const name = localizedText(service, "name", locale) ?? service.name;
  const tagline =
    localizedText(service, "short_description", locale) ??
    (ar
      ? "احجز محترفاً موثوقاً خلال أقل من دقيقة."
      : "Book a vetted professional in under a minute.");
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
        options: "الخيارات",
        faq: "الأسئلة الشائعة",
        from: "يبدأ من",
        cancel: "إلغاء مجاني حتى 6 ساعات قبل الموعد.",
        related: "خدمات أخرى قد تهمك",
        insured: "مؤمّن وموثّق",
        minimum: "دقيقة كحد أدنى",
        reviews: "تقييم",
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
      };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6" dir={ar ? "rtl" : "ltr"}>
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          {L.home}
        </Link>
        {category ? (
          <>
            <span className="mx-2">/</span>
            <Link
              to="/categories/$slug"
              params={{ slug: category.slug }}
              className="hover:text-foreground"
            >
              {category.name}
            </Link>
          </>
        ) : null}
        <span className="mx-2">/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <section className="relative mt-4 overflow-hidden rounded-3xl">
        <img
          src={resolveImageUrl(service.image_url) || FALLBACK_IMAGE}
          alt={name}
          className="h-64 w-full object-cover sm:h-[22rem]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/55 to-foreground/20"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-12">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-xs font-medium text-background backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden />
            {category?.name ?? "ServicePlus"}
          </span>
          <h1 className="max-w-2xl text-2xl font-bold text-background sm:text-4xl">
            {name} {ar ? "في الإمارات العربية المتحدة" : "in the United Arab Emirates"}
          </h1>
          <p className="max-w-xl text-sm text-background/90 sm:text-base">{tagline}</p>
          <Button asChild size="lg" className="w-fit">
            <Link to="/booking/$slug" params={{ slug: service.slug }}>
              {L.book}
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="size-4 fill-warning text-warning" aria-hidden />
              {num(service.rating).toFixed(1)} ({service.review_count ?? 0} {L.reviews})
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              {service.duration_minutes ?? 60} {L.minimum}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-4" aria-hidden />
              {L.insured}
            </span>
          </div>

          {intro.length ? (
            <div className="mt-5 space-y-4">
              {intro.map((p) => (
                <p key={p.slice(0, 40)} className="text-sm leading-7 text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          ) : null}

          {includes.length ? (
            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">{L.included}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {variants.length ? (
            <div className="mt-10">
              <h2 className="text-lg font-semibold">{L.options}</h2>
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                {variants.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{v.name}</p>
                      {v.description ? (
                        <p className="text-xs text-muted-foreground">{v.description}</p>
                      ) : null}
                    </div>
                    <span className="text-sm font-semibold">{formatMoney(num(v.price))}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {sections.map((section) => (
            <section key={section.title} className="mt-10">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {paragraphs(section.body).map((p) => (
                  <p key={p.slice(0, 40)} className="text-sm leading-7 text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {faqs.length ? (
            <div className="mt-12">
              <h2 className="text-lg font-semibold">{L.faq}</h2>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {faqs.map((faq) => (
                  <details key={faq.q} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                      {faq.q}
                    </summary>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{L.from}</p>
            <p className="mt-1 text-3xl font-bold">{formatMoney(num(service.base_price))}</p>
            {service.original_price ? (
              <p className="text-sm text-muted-foreground line-through">
                {formatMoney(num(service.original_price))}
              </p>
            ) : null}
            <Button asChild size="lg" className="mt-4 w-full">
              <Link to="/booking/$slug" params={{ slug: service.slug }}>
                {L.book}
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">{L.cancel}</p>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-14">
          <h2 className="text-lg font-semibold">{L.related}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
