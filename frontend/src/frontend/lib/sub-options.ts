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
  if (rawDesc.trim().startsWith("{") && rawDesc.includes("sub_options")) {
    try {
      const parsed = JSON.parse(rawDesc);
      if (parsed && Array.isArray(parsed.sub_options)) {
        subOptions = parsed.sub_options;
        cleanDesc = parsed.text || "";
      }
    } catch {
      // fallback to raw text
    }
  }

  // Try parsing Arabic description
  if (rawDescAr.trim().startsWith("{") && rawDescAr.includes("sub_options")) {
    try {
      const parsed = JSON.parse(rawDescAr);
      if (parsed) {
        if (!subOptions.length && Array.isArray(parsed.sub_options)) {
          subOptions = parsed.sub_options;
        }
        cleanDescAr = parsed.text || "";
      }
    } catch {
      // fallback to raw text
    }
  }

  // If sub-options exist as a direct property
  if (!subOptions.length && Array.isArray(option.sub_options || option.subOptions)) {
    subOptions = option.sub_options || option.subOptions;
  }

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
