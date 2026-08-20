import type { Locale } from "@/frontend/lib/locale";

export interface ContentSection {
  title: string;
  body: string;
}

export interface ContentFaq {
  q: string;
  a: string;
}

type Row = Record<string, unknown>;

/** Pick the Arabic variant of a text field when the Arabic locale is active. */
export function localizedText(
  row: Row | null | undefined,
  field: string,
  locale: Locale,
): string | null {
  if (!row) return null;
  if (locale === "ar") {
    const arSnake = row[`${field}_ar`];
    if (typeof arSnake === "string" && arSnake.trim()) return arSnake;
    const fieldCamel = field.charAt(0).toUpperCase() + field.slice(1);
    const arCamel = row[`${field}${fieldCamel}`] ?? row[`${field}Ar`];
    if (typeof arCamel === "string" && arCamel.trim()) return arCamel;
  }
  const en = row[field];
  return typeof en === "string" && en.trim() ? en : null;
}

function jsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Localized list of plain strings (e.g. `includes`). */
export function localizedList(
  row: Row | null | undefined,
  field: string,
  locale: Locale,
): string[] {
  if (!row) return [];
  const source =
    locale === "ar" && jsonArray(row[`${field}_ar`]).length ? row[`${field}_ar`] : row[field];
  return jsonArray(source).filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

/** Localized `[{ title, body }]` sections. */
export function localizedSections(
  row: Row | null | undefined,
  field: string,
  locale: Locale,
): ContentSection[] {
  if (!row) return [];
  const source =
    locale === "ar" && jsonArray(row[`${field}_ar`]).length ? row[`${field}_ar`] : row[field];
  return jsonArray(source)
    .map((item) => item as Partial<ContentSection>)
    .filter((item) => typeof item?.title === "string" && typeof item?.body === "string")
    .map((item) => ({ title: item.title as string, body: item.body as string }));
}

/** Localized `[{ q, a }]` FAQ entries. */
export function localizedFaqs(
  row: Row | null | undefined,
  field: string,
  locale: Locale,
): ContentFaq[] {
  if (!row) return [];
  const source =
    locale === "ar" && jsonArray(row[`${field}_ar`]).length ? row[`${field}_ar`] : row[field];
  return jsonArray(source)
    .map((item) => item as Partial<ContentFaq>)
    .filter((item) => typeof item?.q === "string" && typeof item?.a === "string")
    .map((item) => ({ q: item.q as string, a: item.a as string }));
}

/** Split a long intro into paragraphs. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
