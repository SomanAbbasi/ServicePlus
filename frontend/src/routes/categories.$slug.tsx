import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategory } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { ServiceCard } from "@/frontend/components/ServiceCard";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { ArrowLeft, ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
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

  const hasContent = intro.length > 0 || sections.length > 0 || faqs.length > 0;

  return (
    <div dir={ar ? "rtl" : "ltr"}>
      {/* Hero / Header */}
      <section className="border-b border-border/60 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground">
              {ar ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className="size-3.5 shrink-0" />
            <span className="font-medium text-foreground">{name}</span>
          </nav>

          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            {/* Category Image */}
            {data.category.image_url ? (
              <div className="shrink-0">
                <img
                  src={resolveImageUrl(data.category.image_url)}
                  alt={name}
                  className="h-28 w-28 rounded-xl object-cover shadow-sm sm:h-36 sm:w-36"
                />
              </div>
            ) : null}

            {/* Category Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {name}
              </h1>
              {description ? (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {/* Back Button -> Home Page */}
          <div className="mt-8">
            <Link
              to="/"
              aria-label={ar ? "العودة للرئيسية" : "Back to Home Page"}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-cyan-500"
            >
              <div className="grid size-6 place-items-center rounded-full bg-slate-100 text-slate-600">
                {ar ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </div>
              {ar ? "العودة للرئيسية" : "Back to Home"}
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {data.services.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-white px-6 py-20 text-center">
            <PackageOpen className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              {ar
                ? "لا توجد خدمات في هذا التصنيف بعد"
                : "No services in this category yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {ar ? "تحقق لاحقاً" : "Check back soon"}
            </p>
          </div>
        )}
      </section>

      {/* Content Section (Intro + Sections) */}
      {hasContent ? (
        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl border border-border/60 bg-white p-8 sm:p-10">
            {/* Intro */}
            {intro.length > 0 ? (
              <div className="space-y-4">
                {intro.map((p) => (
                  <p
                    key={p.slice(0, 40)}
                    className="text-sm leading-7 text-muted-foreground"
                  >
                    {p}
                  </p>
                ))}
              </div>
            ) : null}

            {/* Sections */}
            {sections.length > 0 ? (
              <div className={intro.length > 0 ? "mt-10 space-y-8" : ""}>
                {sections.map((section) => (
                  <div key={section.title}>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      {section.title}
                    </h2>
                    <div className="mt-3 space-y-3">
                      {paragraphs(section.body).map((p) => (
                        <p
                          key={p.slice(0, 40)}
                          className="text-sm leading-7 text-muted-foreground"
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* FAQ Section */}
          {faqs.length > 0 ? (
            <div className="mt-10">
              <h2 className="mb-5 text-lg font-semibold tracking-tight text-foreground">
                {ar ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
              </h2>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <details
                    key={faq.q}
                    className="group overflow-hidden rounded-xl border border-border/60 bg-white"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/50">
                      <span>{faq.q}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="border-t border-border/40 px-5 py-4">
                      <p className="text-sm leading-6 text-muted-foreground">
                        {faq.a}
                      </p>
                    </div>
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
