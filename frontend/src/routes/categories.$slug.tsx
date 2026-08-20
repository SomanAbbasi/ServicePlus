import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategory } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ServiceCard } from "@/frontend/components/ServiceCard";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/frontend/lib/locale";
import {
  localizedFaqs,
  localizedSections,
  localizedText,
  paragraphs,
} from "@/frontend/lib/i18n-content";

const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getCategory(slug),
  });

export const Route = createFileRoute("/categories/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(categoryQuery(params.slug));
    if (!data) throw notFound();
    return {
      name: data.category.name,
      title: data.category.seo_title ?? null,
      description: data.category.seo_description ?? data.category.description,
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Category not found — ServicePlus" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = loaderData.title ?? `${loaderData.name} services in Dubai & UAE — ServicePlus`;
    const description =
      loaderData.description ?? `Book trusted ${loaderData.name} professionals with ServicePlus.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `/categories/${params.slug}` },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `/categories/${params.slug}` }],
    };
  },
  component: CategoryPage,
  errorComponent: () => <Fallback title="This category didn't load" />,
  notFoundComponent: () => <Fallback title="Category not found" />,
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

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryQuery(slug));
  const { locale } = useLocale();
  const ar = locale === "ar";
  if (!data) return <Fallback title="Category not found" />;
  const category = data.category as unknown as Record<string, unknown>;
  const name = localizedText(category, "name", locale) ?? data.category.name;
  const description = localizedText(category, "description", locale);
  const intro = paragraphs(localizedText(category, "intro", locale));
  const sections = localizedSections(category, "sections", locale);
  const faqs = localizedFaqs(category, "faqs", locale);

  return (
    <div dir={ar ? "rtl" : "ltr"}>
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6">
          <Link
            to="/"
            aria-label="Back to home"
            className="grid size-9 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          {data.category.image_url ? (
            <img src={resolveImageUrl(data.category.image_url)} alt="" className="size-10 rounded-xl object-cover" />
          ) : null}
          <div>
            <h1 className="text-xl font-bold tracking-tight">{name}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {data.services.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {data.services.map((service) => (
              <Link
                key={service.id}
                to="/services/$slug"
                params={{ slug: service.slug }}
                className="group block focus-visible:outline-none"
              >
                <div className="aspect-square overflow-hidden rounded-2xl bg-muted ring-offset-2 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <img
                    src={resolveImageUrl(service.image_url) || FALLBACK_IMAGE}
                    alt={service.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                  {service.name}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No services in this category yet — check back soon.
          </p>
        )}
      </section>

      {intro.length || sections.length || faqs.length ? (
        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
          {intro.length ? (
            <div className="space-y-4">
              {intro.map((p) => (
                <p key={p.slice(0, 40)} className="text-sm leading-7 text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          ) : null}

          {sections.map((section) => (
            <div key={section.title} className="mt-8">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <div className="mt-2 space-y-3">
                {paragraphs(section.body).map((p) => (
                  <p key={p.slice(0, 40)} className="text-sm leading-7 text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {faqs.length ? (
            <div className="mt-10">
              <h2 className="text-lg font-semibold">
                {ar ? "الأسئلة الشائعة" : "Frequently asked questions"}
              </h2>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {faqs.map((faq) => (
                  <details key={faq.q} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none text-sm font-medium">
                      {faq.q}
                    </summary>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
