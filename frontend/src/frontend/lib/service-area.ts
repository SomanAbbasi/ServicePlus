/** ServicePlus currently operates in Dubai only. */

export const SERVICE_AREA_MESSAGE =
  "Sorry, our service is not currently available in this region. We only serve Dubai right now.";

/** Rough bounding box around the Emirate of Dubai. */
const DUBAI_BOUNDS = { minLat: 24.72, maxLat: 25.45, minLng: 54.8, maxLng: 55.75 };

export function isInDubai(address?: string | null, lat?: number | null, lng?: number | null) {
  const text = (address ?? "").toLowerCase();
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    const inBox =
      lat >= DUBAI_BOUNDS.minLat &&
      lat <= DUBAI_BOUNDS.maxLat &&
      lng >= DUBAI_BOUNDS.minLng &&
      lng <= DUBAI_BOUNDS.maxLng;
    if (!inBox) return false;
    // Coordinates inside the box but an address that names another emirate/country.
    if (
      text &&
      !text.includes("dubai") &&
      /sharjah|ajman|abu dhabi|ras al|fujairah|umm al/.test(text)
    )
      return false;
    return true;
  }
  return text.includes("dubai");
}
