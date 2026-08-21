/** ServicePlus currently operates in Dubai only. */

export const SERVICE_AREA_MESSAGE =
  "Sorry, our service is not currently available in this region. We only serve Dubai right now.";

/** Rough bounding box around the Emirate of Dubai. */
const DUBAI_BOUNDS = { minLat: 24.72, maxLat: 25.45, minLng: 54.8, maxLng: 55.75 };

export function isInDubai(address?: string | null, lat?: number | null, lng?: number | null) {
  const text = (address ?? "").toLowerCase();
  if (
    text.includes("united arab emirates") ||
    text.includes("uae") ||
    text.includes("dubai") ||
    text.includes("abu dhabi") ||
    text.includes("sharjah") ||
    text.includes("ajman")
  ) {
    return true;
  }
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
    return lat >= 22.0 && lat <= 26.5 && lng >= 51.0 && lng <= 56.5;
  }
  return true;
}
