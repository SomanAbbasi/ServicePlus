export interface SubOption {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number | null;
  durationMinutes?: number;
  maxQuantity?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ParsedOptionResult {
  description: string;
  descriptionAr: string;
  subOptions: SubOption[];
  hasSubOptions: boolean;
  lowestPrice: number;
}

/**
 * Parses an option's description and description_ar fields.
 * If JSON payload containing sub_options is detected, extracts the clean text
 * and the array of sub-options.
 */
export function parseOptionPayload(option: any): ParsedOptionResult {
  if (!option) {
    return {
      description: "",
      descriptionAr: "",
      subOptions: [],
      hasSubOptions: false,
      lowestPrice: 0,
    };
  }

  let rawDesc = String(option.description || "");
  let rawDescAr = String(option.description_ar || option.descriptionAr || "");
  let cleanDesc = rawDesc;
  let cleanDescAr = rawDescAr;
  let subOptions: SubOption[] = [];

  // Try parsing English description
  if (rawDesc.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawDesc);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.sub_options) && parsed.sub_options.length > 0) {
          subOptions = parsed.sub_options;
        } else if (Array.isArray(parsed.subOptions) && parsed.subOptions.length > 0) {
          subOptions = parsed.subOptions;
        }
        cleanDesc = parsed.text ?? parsed.description ?? parsed.desc ?? "";
        if (!cleanDescAr && (parsed.descriptionAr || parsed.description_ar || parsed.text_ar)) {
          cleanDescAr = parsed.descriptionAr ?? parsed.description_ar ?? parsed.text_ar ?? "";
        }
      }
    } catch {
      // fallback to raw text
    }
  }

  // Try parsing Arabic description
  if (rawDescAr.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawDescAr);
      if (parsed && typeof parsed === "object") {
        if (!subOptions.length && Array.isArray(parsed.sub_options) && parsed.sub_options.length > 0) {
          subOptions = parsed.sub_options;
        } else if (!subOptions.length && Array.isArray(parsed.subOptions) && parsed.subOptions.length > 0) {
          subOptions = parsed.subOptions;
        }
        cleanDescAr = parsed.text ?? parsed.descriptionAr ?? parsed.description_ar ?? parsed.description ?? parsed.text_ar ?? "";
        if (!cleanDesc && (parsed.description || parsed.text)) {
          cleanDesc = parsed.description ?? parsed.text ?? "";
        }
      }
    } catch {
      // fallback to raw text
    }
  }

  // If sub-options exist as a direct property
  if (!subOptions.length && Array.isArray(option.sub_options || option.subOptions)) {
    subOptions = option.sub_options || option.subOptions;
  }

  // Normalize subOptions fields
  subOptions = subOptions.map((s: any) => ({
    id: String(s.id),
    name: s.name,
    nameAr: s.nameAr || s.name_ar,
    description: s.description || s.text || "",
    descriptionAr: s.descriptionAr || s.description_ar || "",
    price: Number(s.price || 0),
    originalPrice: s.originalPrice != null ? Number(s.originalPrice) : (s.original_price != null ? Number(s.original_price) : null),
    durationMinutes: Number(s.durationMinutes || s.duration_minutes || 0),
    imageUrl: s.imageUrl || s.image_url,
    isActive: s.isActive ?? s.is_active ?? true,
    maxQuantity: s.maxQuantity ?? s.max_quantity ?? 10,
    sortOrder: s.sortOrder ?? s.sort_order ?? 0,
  }));

  const basePrice = Number(option.price || option.base_price || option.basePrice || 0);
  const lowestPrice =
    subOptions.length > 0
      ? Math.min(...subOptions.map((s) => Number(s.price) || 0))
      : basePrice;

  return {
    description: cleanDesc,
    descriptionAr: cleanDescAr,
    subOptions,
    hasSubOptions: subOptions.length > 0,
    lowestPrice,
  };
}

/**
 * Serializes option text and sub-options array for backend storage.
 */
export function serializeOptionPayload(
  textEn: string,
  textAr: string,
  subOptions: SubOption[],
): { description: string; description_ar: string; computedPrice?: number } {
  if (!subOptions || subOptions.length === 0) {
    return {
      description: textEn.trim(),
      description_ar: textAr.trim(),
    };
  }

  const lowestPrice = Math.min(...subOptions.map((s) => Number(s.price) || 0));

  const jsonEn = JSON.stringify({
    text: textEn.trim(),
    sub_options: subOptions,
  });

  const jsonAr = JSON.stringify({
    text: textAr.trim(),
    sub_options: subOptions,
  });

  return {
    description: jsonEn,
    description_ar: jsonAr,
    computedPrice: lowestPrice,
  };
}
