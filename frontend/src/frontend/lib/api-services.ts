import { get, post } from "./api-client";

/* ------------------------------------------------------------------ types */

export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  name_ar?: string | null;
  description_ar?: string | null;
  intro?: string | null;
  intro_ar?: string | null;
  sections?: { title: string; body: string }[] | null;
  sections_ar?: { title: string; body: string }[] | null;
  faqs?: { q: string; a: string }[] | null;
  faqs_ar?: { q: string; a: string }[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface ServiceSummary {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  image_url: string | null;
  base_price: number;
  original_price: number | null;
  booking_type: string;
  rating: number;
  review_count: number;
  category_id: string;
  name_ar?: string | null;
  is_featured?: boolean;
}

export interface QuoteInput {
  serviceSlug: string;
  hours: number;
  professionals: number;
  materials: boolean;
  variantIds: { id: string; quantity: number }[];
  addonIds: { id: string; quantity: number }[];
  couponCode?: string | null;
  citySlug?: string | null;
  frequency?: string | null;
}

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/* ============================================================ CATALOG */

export function getHomeCatalog() {
  return get<{
    categories: CategorySummary[];
    services: ServiceSummary[];
    listings: { category_id: string; service_id: string; sort_order: number }[];
    featured_coupon: {
      code: string;
      description: string | null;
      discount_type: string;
      discount_value: number;
    } | null;
  }>("/services/home-catalog", { skipAuth: true });
}

export function getServiceDetail(slug: string) {
  return get<{
    service: Record<string, unknown> | null;
    variants: Record<string, unknown>[];
    option_groups: (Record<string, unknown> & { options: Record<string, unknown>[] })[];
    related: ServiceSummary[];
    addons: Record<string, unknown>[];
  } | null>(`/services/${encodeURIComponent(slug)}`, { skipAuth: true });
}

export function getCategory(slug: string) {
  return get<{
    category: CategorySummary;
    services: ServiceSummary[];
  } | null>(`/categories/${encodeURIComponent(slug)}`, { skipAuth: true });
}

export function searchServices(q: string) {
  return get<{ services: ServiceSummary[]; categories: CategorySummary[] }>(
    `/services/search?q=${encodeURIComponent(q)}`,
    { skipAuth: true },
  );
}

export function getCities() {
  return get<Record<string, unknown>[]>("/cities", { skipAuth: true });
}

export function getBundles() {
  return get<Record<string, unknown>[]>("/bundles", { skipAuth: true });
}

/* ============================================================ AUTH */

export function requestOtp(phone: string) {
  return post<{ phone: string; dev_code: string | null }>(
    "/auth/send-otp",
    { phone },
    { skipAuth: true },
  );
}

export function verifyOtp(phone: string, code: string, name?: string) {
  return post<{
    access_token: string;
    refresh_token: string;
    user_id: string;
    profile: Record<string, unknown>;
  }>("/auth/verify-otp", { phone, code, name }, { skipAuth: true });
}

/* ============================================================ BOOKING */

export function getQuote(input: QuoteInput) {
  return post<{
    breakdown: Record<string, unknown>;
    coupon_error: string | null;
    duration_minutes: number;
    lines: {
      variants: { label: string; unit_price: number; quantity: number }[];
      addons: { label: string; unit_price: number; quantity: number }[];
    };
  }>("/booking/quote", input);
}

export function getAvailability(date: string, durationMinutes: number, citySlug?: string | null) {
  return post<{ slots: Record<string, unknown>[]; capacity: number }>("/booking/availability", {
    date,
    durationMinutes,
    citySlug,
  });
}

export function createBooking(
  data: QuoteInput & {
    addressId: string;
    scheduledDate: string;
    scheduledStart: string;
    instructions?: string;
    paymentMethod: string;
    idempotencyKey: string;
  },
) {
  return post<{ id: string; booking_number: string }>("/booking", data);
}

export function getMyBookings() {
  return get<Record<string, unknown>[]>("/booking/my-bookings");
}

export function getMyAddresses() {
  return get<
    {
      id: string;
      label: string;
      street: string;
      building: string | null;
      unit: string | null;
      is_default: boolean;
    }[]
  >("/booking/addresses");
}

export function createAddress(data: { label: string; street: string; building?: string }) {
  return post<{
    id: string;
    label: string;
    street: string;
    building: string | null;
    unit: string | null;
    is_default: boolean;
  }>("/booking/address", data);
}

export function cancelBooking(bookingId: string) {
  return post<{ ok: boolean }>(`/booking/${encodeURIComponent(bookingId)}/cancel`);
}

/* ============================================================ ADMIN */

export function amIAdmin() {
  return get<{ is_admin: boolean }>("/auth/is-admin");
}

export function getAdminOverview() {
  return get<Record<string, unknown>>("/admin/overview");
}

export function getAdminBookings() {
  return get<Record<string, unknown>[]>("/admin/bookings");
}

export function getAdminBookingDetail(id: string) {
  return post<{
    booking: Record<string, unknown> | null;
    items: Record<string, unknown>[];
    addons: Record<string, unknown>[];
    history: Record<string, unknown>[];
    payments: Record<string, unknown>[];
  }>("/admin/booking/detail", { id });
}

export function setBookingStatus(id: string, status: string, note?: string) {
  return post<{ ok: boolean }>("/admin/booking/status", { id, status, note });
}

export function assignProfessional(id: string, professional_id: string | null) {
  return post<{ ok: boolean }>("/admin/booking/assign", { id, professional_id });
}

export function getAdminCustomers() {
  return get<Record<string, unknown>[]>("/admin/customers");
}

export function getAdminCustomerDetail(id: string) {
  return post<{
    profile: Record<string, unknown> | null;
    addresses: Record<string, unknown>[];
    bookings: Record<string, unknown>[];
    reviews: Record<string, unknown>[];
    tickets: Record<string, unknown>[];
  }>("/admin/customer/detail", { id });
}

export function getAdminProfessionals() {
  return get<Record<string, unknown>[]>("/admin/professionals");
}

export function getAdminProfessionalDetail(id: string) {
  return post<{
    professional: Record<string, unknown> | null;
    skills: Record<string, unknown>[];
    availability: Record<string, unknown>[];
    bookings: Record<string, unknown>[];
  }>("/admin/professional/detail", { id });
}

export function setProfessionalStatus(id: string, status: string, is_active?: boolean) {
  return post<{ ok: boolean }>("/admin/professional/status", { id, status, is_active });
}

export function getAdminCatalog() {
  return get<{
    services: Record<string, unknown>[];
    categories: Record<string, unknown>[];
    listings: Record<string, unknown>[];
  }>("/admin/catalog");
}

export function createService(data: Record<string, unknown>) {
  return post<{ id: string }>("/admin/catalog/service", data);
}

export function updateService(data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/catalog/service/update", data);
}

export function deleteService(id: string) {
  return post<{ ok: boolean }>("/admin/catalog/service/delete", { id });
}

export function duplicateService(id: string) {
  return post<{ id: string }>("/admin/catalog/service/duplicate", { id });
}

export function setServiceListing(data: {
  category_id: string;
  service_id: string;
  listed: boolean;
}) {
  return post<{ ok: boolean }>("/admin/catalog/listing", data);
}

export function getAdminAddons() {
  return get<{
    addons: Record<string, unknown>[];
    links: { addon_id: string; service_id: string }[];
  }>("/admin/addons");
}

export function updateAddon(data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/addon/update", data);
}

export function getAdminBundles() {
  return get<Record<string, unknown>[]>("/admin/bundles");
}

export function updateBundle(data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/bundle/update", data);
}

export function getAdminCoupons() {
  return get<Record<string, unknown>[]>("/admin/coupons");
}

export function upsertCoupon(data: {
  id?: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  max_discount?: number | null;
  min_amount?: number;
  first_booking_only?: boolean;
  max_redemptions?: number | null;
  per_user_limit?: number;
  expires_at?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
}) {
  return post<{ ok: boolean }>("/admin/coupon", data);
}

export function setCouponActive(id: string, is_active: boolean) {
  return post<{ ok: boolean }>("/admin/coupon/active", { id, is_active });
}

export function getAdminLocations() {
  return get<{
    countries: Record<string, unknown>[];
    cities: Record<string, unknown>[];
  }>("/admin/locations");
}

export function updateCity(data: {
  id: string;
  name?: string;
  surcharge_pct?: number;
  is_active?: boolean;
}) {
  return post<{ ok: boolean }>("/admin/location/city", data);
}

export function getAdminPayments() {
  return get<Record<string, unknown>[]>("/admin/payments");
}

export function getAdminRefunds() {
  return get<Record<string, unknown>[]>("/admin/refunds");
}

export function getAdminReviews() {
  return get<Record<string, unknown>[]>("/admin/reviews");
}

export function getAdminNotifications() {
  return get<Record<string, unknown>[]>("/admin/notifications");
}

export function getAdminSupport() {
  return get<Record<string, unknown>[]>("/admin/support");
}

export function getAdminTicket(id: string) {
  return post<{
    ticket: Record<string, unknown> | null;
    messages: Record<string, unknown>[];
  }>("/admin/support/ticket", { id });
}

export function replyToTicket(id: string, body: string) {
  return post<{ ok: boolean }>("/admin/support/reply", { id, body });
}

export function setTicketStatus(id: string, status: string) {
  return post<{ ok: boolean }>("/admin/support/status", { id, status });
}

export function getAdminSettings() {
  return get<{ key: string; value: Record<string, unknown>; updated_at: string }[]>(
    "/admin/settings",
  );
}

export function updateSetting(key: string, value: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/setting", { key, value });
}

export function getAdminAuditLogs() {
  return get<Record<string, unknown>[]>("/admin/audit-logs");
}

export function getAdminReports() {
  return get<{
    bookings: Record<string, unknown>[];
    services: { id: string; name: string }[];
    cities: { id: string; name: string }[];
    professionals: { id: string; full_name: string }[];
  }>("/admin/reports");
}

export function getAdminAvailability() {
  return get<Record<string, unknown>[]>("/admin/availability");
}

export function createCategory(data: Record<string, unknown>) {
  return post<{ id: string }>("/admin/catalog/category", data);
}

export function updateCategory(data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/catalog/category/update", data);
}

export function deleteCategory(id: string) {
  return post<{ ok: boolean }>("/admin/catalog/category/delete", { id });
}

export function getServiceVariants(service_id: string) {
  return post<Record<string, unknown>[]>("/admin/variants", { service_id });
}

export function getServiceOptionGroups(service_id: string) {
  return post<Record<string, unknown>[]>("/admin/option-groups", { service_id });
}

export function upsertOptionGroup(data: Record<string, unknown>) {
  return post<{ id: string }>("/admin/option-group", data);
}

export function deleteOptionGroup(id: string) {
  return post<{ ok: boolean }>("/admin/option-group/delete", { id });
}

export function upsertVariant(data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/variant", data);
}

export function deleteVariant(id: string) {
  return post<{ ok: boolean }>("/admin/variant/delete", { id });
}

export function createAddon(data: Record<string, unknown>) {
  return post<{ id: string }>("/admin/addon", data);
}

export function deleteAddon(id: string) {
  return post<{ ok: boolean }>("/admin/addon/delete", { id });
}

export function setAddonService(data: { addon_id: string; service_id: string; linked: boolean }) {
  return post<{ ok: boolean }>("/admin/addon/service", data);
}

export function createBundle(data: Record<string, unknown>) {
  return post<{ id: string }>("/admin/bundle", data);
}

export function deleteBundle(id: string) {
  return post<{ ok: boolean }>("/admin/bundle/delete", { id });
}

export function addBundleItem(data: {
  bundle_id: string;
  label: string;
  service_id?: string | null;
  quantity: number;
}) {
  return post<{ ok: boolean }>("/admin/bundle/item", data);
}

export function deleteBundleItem(id: string) {
  return post<{ ok: boolean }>("/admin/bundle/item/delete", { id });
}

export function createProfessional(data: Record<string, unknown>) {
  return post<{ id: string }>("/admin/professional", data);
}

export function updateProfessional(data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/professional/update", data);
}

export function deleteProfessional(id: string) {
  return post<{ ok: boolean }>("/admin/professional/delete", { id });
}

export function setProfessionalSkill(data: {
  professional_id: string;
  category_id: string;
  enabled: boolean;
}) {
  return post<{ ok: boolean }>("/admin/professional/skill", data);
}

/* ============================================================ GEO */

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const res = await get<{ address: string | null }>(`/geo/reverse?lat=${lat}&lng=${lng}`, {
    skipAuth: true,
  });
  return res?.address ?? null;
}


export function searchPlaces(query: string) {
  return get<PlaceResult[]>(`/geo/search?q=${encodeURIComponent(query)}`, { skipAuth: true });
}

/* ============================================================ MEDIA */

export function uploadMedia(filename: string, contentType: string, dataBase64: string) {
  return post<{ url: string }>("/media/upload", { filename, contentType, dataBase64 });
}
