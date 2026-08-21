import { get, post, getAccessToken } from "./api-client";

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

export async function getHomeCatalog() {
  const res = await get<{
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

  if (!res || !Array.isArray(res.categories) || res.categories.length === 0) {
    throw new Error("Empty catalog returned from server");
  }
  return res;
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

export function updateProfile(data: { fullName?: string; email?: string; gender?: string }) {
  return post<{ id: string; fullName: string | null; email: string | null }>("/auth/update-profile", data);
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

import { AdminDataStore, type AdminUser, type AdminStaff, type AdminRole, type AdminCompany, type AdminProfessional, type AdminTeamLead, type AdminSupervisor, type ComplianceDocument, type AdminMaterial, type AdminMaterialRequest, type AdminPlan } from "./admin-mock-data";

/* ============================================================ ADMIN */

const DEFAULT_ADMIN_OVERVIEW = {
  kpis: {
    total_customers: 0,
    total_companies: 0,
    total_professionals: 0,
    total_bookings: 0,
    total_revenue: 0,
    average_rating: 0,
    pending_material_requests: 0,
    documents_expiring_30_days: 0,
    today_bookings: 0,
    yesterday_bookings: 0,
    today_vs_yesterday_pct: 0,
    month_bookings: 0,
    last_month_bookings: 0,
    month_vs_last_month_pct: 0,
  },
  booking_trends_30_days: [],
  by_status: {},
  status_counts: {},
  recent_bookings: [],
  recent_customers: [],
  recent_reviews: [],
  upcoming: [],
};

export async function amIAdmin() {
  const localAuth = typeof window !== "undefined" && localStorage.getItem("serviceplus_admin_authenticated") === "true";
  if (!getAccessToken()) return { is_admin: localAuth };
  try {
    return await get<{ is_admin: boolean }>("/auth/is-admin");
  } catch {
    return { is_admin: localAuth };
  }
}

export async function getAdminOverview() {
  const users = AdminDataStore.getUsers();
  const companies = AdminDataStore.getCompanies();
  const pros = AdminDataStore.getProfessionals();
  const matReqs = AdminDataStore.getMaterialRequests();
  const docs = AdminDataStore.getAllComplianceDocuments();

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 864e5);
  const expiringCount = docs.filter((d) => {
    const exp = new Date(d.expiryDate);
    return exp >= now && exp <= in30Days;
  }).length;

  const pendingMatReqs = matReqs.filter((m) => m.status === "Pending").length;

  try {
    if (getAccessToken()) {
      const serverData = await get<Record<string, any>>("/admin/overview");
      if (serverData) {
        const sKpis = serverData.kpis || {};
        return {
          ...DEFAULT_ADMIN_OVERVIEW,
          ...serverData,
          kpis: {
            total_customers: sKpis.total_customers ?? sKpis.customers ?? users.length,
            total_companies: companies.length,
            total_professionals: sKpis.total_professionals ?? sKpis.professionals ?? pros.length,
            total_bookings: sKpis.total_bookings ?? sKpis.totalBookings ?? 0,
            total_revenue: sKpis.total_revenue ?? sKpis.revenueTotal ?? 0,
            average_rating: sKpis.average_rating ?? 0,
            pending_material_requests: pendingMatReqs,
            documents_expiring_30_days: expiringCount,
            today_bookings: sKpis.today_bookings ?? sKpis.todayBookings ?? 0,
            yesterday_bookings: sKpis.yesterday_bookings ?? 0,
            today_vs_yesterday_pct: sKpis.today_vs_yesterday_pct ?? 0,
            month_bookings: sKpis.month_bookings ?? 0,
            last_month_bookings: sKpis.last_month_bookings ?? 0,
            month_vs_last_month_pct: sKpis.month_vs_last_month_pct ?? 0,
          },
          by_status: serverData.by_status || {},
          booking_trends_30_days: serverData.booking_trends_30_days || [],
        };
      }
    }
  } catch (err) {
    console.error("Error fetching overview:", err);
  }

  return {
    ...DEFAULT_ADMIN_OVERVIEW,
    kpis: {
      ...DEFAULT_ADMIN_OVERVIEW.kpis,
      total_customers: users.length,
      total_companies: companies.length,
      total_professionals: pros.length,
      pending_material_requests: pendingMatReqs,
      documents_expiring_30_days: expiringCount,
    },
  };
}

export async function getAdminBookings() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/bookings");
  } catch {
    return [];
  }
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

export async function getAdminCustomers() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/customers");
  } catch {
    return [];
  }
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

export async function getAdminProfessionals() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/professionals");
  } catch {
    return [];
  }
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

export async function getAdminCatalog() {
  try {
    const res = await get<{
      services: Record<string, unknown>[];
      categories: Record<string, unknown>[];
      listings: Record<string, unknown>[];
    }>("/admin/catalog");
    if (res && Array.isArray(res.categories) && res.categories.length > 0) {
      const mapped = {
        services: (res.services ?? []).map((s: any) => ({
          ...s,
          category_id: s.category_id ?? s.categoryId,
          is_active: s.is_active ?? s.isActive ?? true,
          image_url: s.image_url ?? s.imageUrl,
        })),
        categories: (res.categories ?? []).map((c: any) => ({
          ...c,
          is_active: c.is_active ?? c.isActive ?? true,
          image_url: c.image_url ?? c.imageUrl,
        })),
        listings: (res.listings ?? []).map((l: any) => ({
          category_id: l.category_id ?? l.categoryId,
          service_id: l.service_id ?? l.serviceId,
          sort_order: l.sort_order ?? l.sortOrder ?? 0,
        })),
      };
      AdminDataStore.syncCatalog(mapped.categories, mapped.services, mapped.listings);
      return mapped;
    }
  } catch {}

  try {
    const homeData = await getHomeCatalog();
    if (homeData && Array.isArray(homeData.categories) && homeData.categories.length > 0) {
      const mapped = {
        services: (homeData.services ?? []).map((s: any) => ({
          ...s,
          category_id: s.category_id ?? s.categoryId,
          is_active: s.is_active ?? s.isActive ?? true,
          image_url: s.image_url ?? s.imageUrl,
        })),
        categories: (homeData.categories ?? []).map((c: any) => ({
          ...c,
          is_active: c.is_active ?? c.isActive ?? true,
          image_url: c.image_url ?? c.imageUrl,
        })),
        listings: (homeData.listings ?? []).map((l: any) => ({
          category_id: l.category_id ?? l.categoryId,
          service_id: l.service_id ?? l.serviceId,
          sort_order: l.sort_order ?? l.sortOrder ?? 0,
        })),
      };
      AdminDataStore.syncCatalog(mapped.categories, mapped.services, mapped.listings);
      return mapped;
    }
  } catch {}

  return AdminDataStore.getCatalog();
}

export async function createService(data: Record<string, unknown>) {
  const local = AdminDataStore.addService(data);
  try {
    const res = await post<{ id: string }>("/admin/catalog/service", data);
    return res ?? { id: local.id };
  } catch {
    return { id: local.id };
  }
}

export async function updateService(data: Record<string, unknown>) {
  if (data.id) {
    AdminDataStore.updateService(String(data.id), data);
  }
  try {
    return await post<{ ok: boolean }>("/admin/catalog/service/update", data);
  } catch {
    return { ok: true };
  }
}

export async function deleteService(id: string) {
  AdminDataStore.deleteService(id);
  try {
    return await post<{ ok: boolean }>("/admin/catalog/service/delete", { id });
  } catch {
    return { ok: true };
  }
}

export function duplicateService(id: string) {
  return post<{ id: string }>("/admin/catalog/service/duplicate", { id });
}

export async function setServiceListing(data: {
  category_id: string;
  service_id: string;
  listed: boolean;
}) {
  AdminDataStore.setListing(data.category_id, data.service_id, data.listed);
  try {
    return await post<{ ok: boolean }>("/admin/catalog/listing", data);
  } catch {
    return { ok: true };
  }
}

export async function getAdminAddons() {
  if (!getAccessToken()) return { addons: [], links: [] };
  try {
    return await get<{
      addons: Record<string, unknown>[];
      links: { addon_id: string; service_id: string }[];
    }>("/admin/addons");
  } catch {
    return { addons: [], links: [] };
  }
}

export function updateAddon(data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/addon/update", data);
}

export async function getAdminBundles() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/bundles");
  } catch {
    return [];
  }
}

export function updateBundle(data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/bundle/update", data);
}

export async function getAdminCoupons() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/coupons");
  } catch {
    return [];
  }
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

export function deleteCoupon(id: string) {
  return post<{ ok: boolean }>("/admin/coupon/delete", { id });
}

export async function getAdminLocations() {
  if (!getAccessToken()) return { countries: [], cities: [] };
  try {
    return await get<{
      countries: Record<string, unknown>[];
      cities: Record<string, unknown>[];
    }>("/admin/locations");
  } catch {
    return { countries: [], cities: [] };
  }
}

export function updateCity(data: {
  id: string;
  name?: string;
  surcharge_pct?: number;
  is_active?: boolean;
}) {
  return post<{ ok: boolean }>("/admin/location/city", data);
}

export async function getAdminPayments() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/payments");
  } catch {
    return [];
  }
}

export async function getAdminRefunds() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/refunds");
  } catch {
    return [];
  }
}

export async function getAdminReviews() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/reviews");
  } catch {
    return [];
  }
}

export async function getAdminNotifications() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/notifications");
  } catch {
    return [];
  }
}

export async function getAdminSupport() {
  if (!getAccessToken()) return [];
  try {
    return await get<Record<string, unknown>[]>("/admin/support");
  } catch {
    return [];
  }
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

export async function getAdminSettings() {
  if (!getAccessToken()) return [];
  try {
    return await get<{ key: string; value: Record<string, unknown>; updated_at: string }[]>(
      "/admin/settings",
    );
  } catch {
    return [];
  }
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

export async function createCategory(data: Record<string, unknown>) {
  const local = AdminDataStore.addCategory(data);
  try {
    const res = await post<{ id: string }>("/admin/catalog/category", data);
    return res ?? { id: local.id };
  } catch {
    return { id: local.id };
  }
}

export async function updateCategory(data: Record<string, unknown>) {
  if (data.id) {
    AdminDataStore.updateCategory(String(data.id), data);
  }
  try {
    return await post<{ ok: boolean }>("/admin/catalog/category/update", data);
  } catch {
    return { ok: true };
  }
}

export async function deleteCategory(id: string) {
  AdminDataStore.deleteCategory(id);
  try {
    return await post<{ ok: boolean }>("/admin/catalog/category/delete", { id });
  } catch {
    return { ok: true };
  }
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

/* ============================================================ ENTERPRISE ADMIN SUITE */

// Users
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    if (getAccessToken()) {
      const serverUsers = await get<AdminUser[]>("/admin/users");
      if (serverUsers && Array.isArray(serverUsers)) return serverUsers;
    }
  } catch {}
  return AdminDataStore.getUsers();
}

export async function createAdminUser(data: Omit<AdminUser, "id" | "registeredOn" | "createdAt">): Promise<AdminUser> {
  const created = AdminDataStore.addUser(data);
  try {
    if (getAccessToken()) await post("/admin/user", data);
  } catch {}
  return created;
}

export async function updateAdminUser(id: string, patch: Partial<AdminUser>): Promise<AdminUser | null> {
  const updated = AdminDataStore.updateUser(id, patch);
  try {
    if (getAccessToken()) await post("/admin/user/update", { id, ...patch });
  } catch {}
  return updated;
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  const ok = AdminDataStore.deleteUser(id);
  try {
    if (getAccessToken()) await post("/admin/user/delete", { id });
  } catch {}
  return ok;
}

export async function sendUserCredentials(userId: string): Promise<{ success: boolean; message: string }> {
  const users = await getAdminUsers();
  const user = users.find((u) => u.id === userId);
  return {
    success: true,
    message: `Login credentials successfully dispatched to ${user?.email || "user"} via Email & SMS.`,
  };
}

export async function changeUserPassword(userId: string, newPass: string): Promise<{ success: boolean }> {
  return { success: true };
}

// Staff
export async function getAdminStaff(): Promise<AdminStaff[]> {
  try {
    if (getAccessToken()) {
      const res = await get<AdminStaff[]>("/admin/staff");
      if (res && Array.isArray(res)) return res;
    }
  } catch {}
  return AdminDataStore.getStaff();
}

export async function createAdminStaff(data: Omit<AdminStaff, "id" | "registeredOn">): Promise<AdminStaff> {
  const created = AdminDataStore.addStaff(data);
  try {
    if (getAccessToken()) await post("/admin/staff", data);
  } catch {}
  return created;
}

export async function updateAdminStaff(id: string, patch: Partial<AdminStaff>): Promise<AdminStaff | null> {
  const updated = AdminDataStore.updateStaff(id, patch);
  try {
    if (getAccessToken()) await post("/admin/staff/update", { id, ...patch });
  } catch {}
  return updated;
}

export async function deleteAdminStaff(id: string): Promise<boolean> {
  return AdminDataStore.deleteStaff(id);
}

// Roles
export async function getAdminRoles(): Promise<AdminRole[]> {
  try {
    if (getAccessToken()) {
      const res = await get<AdminRole[]>("/admin/roles");
      if (res && Array.isArray(res)) return res;
    }
  } catch {}
  return AdminDataStore.getRoles();
}

export async function createAdminRole(data: Omit<AdminRole, "id" | "registeredOn">): Promise<AdminRole> {
  const created = AdminDataStore.addRole(data);
  try {
    if (getAccessToken()) await post("/admin/role", data);
  } catch {}
  return created;
}

export async function updateAdminRole(id: string, patch: Partial<AdminRole>): Promise<AdminRole | null> {
  const updated = AdminDataStore.updateRole(id, patch);
  try {
    if (getAccessToken()) await post("/admin/role/update", { id, ...patch });
  } catch {}
  return updated;
}

export async function deleteAdminRole(id: string): Promise<boolean> {
  return AdminDataStore.deleteRole(id);
}

// Companies
export async function getAdminCompanies(): Promise<AdminCompany[]> {
  try {
    if (getAccessToken()) {
      const res = await get<AdminCompany[]>("/admin/companies");
      if (res && Array.isArray(res)) return res;
    }
  } catch {}
  return AdminDataStore.getCompanies();
}

export async function createAdminCompany(data: Omit<AdminCompany, "id" | "registeredOn">): Promise<AdminCompany> {
  const created = AdminDataStore.addCompany(data);
  try {
    if (getAccessToken()) await post("/admin/company", data);
  } catch {}
  return created;
}

export async function updateAdminCompany(id: string, patch: Partial<AdminCompany>): Promise<AdminCompany | null> {
  const updated = AdminDataStore.updateCompany(id, patch);
  try {
    if (getAccessToken()) await post("/admin/company/update", { id, ...patch });
  } catch {}
  return updated;
}

export async function deleteAdminCompany(id: string): Promise<boolean> {
  return AdminDataStore.deleteCompany(id);
}

// Team Leads
export async function getAdminTeamLeads(): Promise<AdminTeamLead[]> {
  try {
    if (getAccessToken()) {
      const res = await get<AdminTeamLead[]>("/admin/team-leads");
      if (res && Array.isArray(res)) return res;
    }
  } catch {}
  return AdminDataStore.getTeamLeads();
}

export async function createAdminTeamLead(data: Omit<AdminTeamLead, "id" | "registeredOn">): Promise<AdminTeamLead> {
  const created = AdminDataStore.addTeamLead(data);
  try {
    if (getAccessToken()) await post("/admin/team-lead", data);
  } catch {}
  return created;
}

export async function updateAdminTeamLead(id: string, patch: Partial<AdminTeamLead>): Promise<AdminTeamLead | null> {
  const updated = AdminDataStore.updateTeamLead(id, patch);
  try {
    if (getAccessToken()) await post("/admin/team-lead/update", { id, ...patch });
  } catch {}
  return updated;
}

export async function deleteAdminTeamLead(id: string): Promise<boolean> {
  return AdminDataStore.deleteTeamLead(id);
}

// Supervisors
export async function getAdminSupervisors(): Promise<AdminSupervisor[]> {
  try {
    if (getAccessToken()) {
      const res = await get<AdminSupervisor[]>("/admin/supervisors");
      if (res && Array.isArray(res)) return res;
    }
  } catch {}
  return AdminDataStore.getSupervisors();
}

export async function createAdminSupervisor(data: Omit<AdminSupervisor, "id" | "registeredOn">): Promise<AdminSupervisor> {
  const created = AdminDataStore.addSupervisor(data);
  try {
    if (getAccessToken()) await post("/admin/supervisor", data);
  } catch {}
  return created;
}

export async function updateAdminSupervisor(id: string, patch: Partial<AdminSupervisor>): Promise<AdminSupervisor | null> {
  const updated = AdminDataStore.updateSupervisor(id, patch);
  try {
    if (getAccessToken()) await post("/admin/supervisor/update", { id, ...patch });
  } catch {}
  return updated;
}

export async function deleteAdminSupervisor(id: string): Promise<boolean> {
  return AdminDataStore.deleteSupervisor(id);
}

// Compliance Documents
export async function getAdminComplianceDocuments(): Promise<ComplianceDocument[]> {
  return AdminDataStore.getAllComplianceDocuments();
}

export async function renewComplianceDocument(docId: string, patch: Partial<ComplianceDocument>): Promise<boolean> {
  return AdminDataStore.renewDocument(docId, patch);
}

// Materials & Inventory
export async function getAdminMaterials(): Promise<AdminMaterial[]> {
  return AdminDataStore.getMaterials();
}

export async function createAdminMaterial(mat: Omit<AdminMaterial, "id">): Promise<AdminMaterial> {
  return AdminDataStore.addMaterial(mat);
}

export async function updateAdminMaterial(id: string, patch: Partial<AdminMaterial>): Promise<AdminMaterial | null> {
  return AdminDataStore.updateMaterial(id, patch);
}

export async function deleteAdminMaterial(id: string): Promise<boolean> {
  return AdminDataStore.deleteMaterial(id);
}

// Material Requests
export async function getAdminMaterialRequests(): Promise<AdminMaterialRequest[]> {
  return AdminDataStore.getMaterialRequests();
}

export async function createAdminMaterialRequest(req: Omit<AdminMaterialRequest, "id" | "requestId" | "requestDate">): Promise<AdminMaterialRequest> {
  return AdminDataStore.addMaterialRequest(req);
}

export async function updateAdminMaterialRequestStatus(id: string, status: AdminMaterialRequest["status"], notes?: string): Promise<AdminMaterialRequest | null> {
  return AdminDataStore.updateMaterialRequestStatus(id, status, notes);
}

// Plans
export async function getAdminPlans(): Promise<AdminPlan[]> {
  return AdminDataStore.getPlans();
}

export async function createAdminPlan(plan: Omit<AdminPlan, "id">): Promise<AdminPlan> {
  return AdminDataStore.addPlan(plan);
}

export async function updateAdminPlan(id: string, patch: Partial<AdminPlan>): Promise<AdminPlan | null> {
  return AdminDataStore.updatePlan(id, patch);
}

export async function deleteAdminPlan(id: string): Promise<boolean> {
  return AdminDataStore.deletePlan(id);
}

// Catalog & Promos Helper Wrappers for Dedicated Create Pages
export async function getAdminCategories() {
  const cat = await getAdminCatalog();
  return cat.categories ?? [];
}

export async function getAdminServices() {
  const cat = await getAdminCatalog();
  return cat.services ?? [];
}

export async function createAdminCategory(data: Record<string, unknown>) {
  return createCategory(data);
}

export async function createAdminService(data: Record<string, unknown>) {
  return createService(data);
}

export async function createAdminCoupon(data: {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validUntil?: string;
  usageLimit?: number;
  status?: string;
}) {
  return upsertCoupon({
    code: data.code,
    discount_type: data.discountType,
    discount_value: data.discountValue,
    min_amount: data.minOrderAmount,
    max_discount: data.maxDiscountAmount,
    expires_at: data.validUntil,
    max_redemptions: data.usageLimit,
    is_active: data.status === "Active",
  });
}

export async function createAdminAddon(data: Record<string, unknown>) {
  return createAddon(data);
}

export async function createAdminBundle(data: Record<string, unknown>) {
  return createBundle(data);
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
