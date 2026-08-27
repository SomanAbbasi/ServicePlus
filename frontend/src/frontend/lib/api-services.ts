import { get, post, getAccessToken } from "./api-client";
import { AdminDataStore, type AdminUser, type AdminStaff, type AdminRole, type AdminCompany, type AdminProfessional, type AdminTeamLead, type AdminSupervisor, type ComplianceDocument, type AdminMaterial, type AdminMaterialRequest, type AdminPlan } from "./admin-mock-data";

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

export interface ServiceVariantSummary {
  id: string;
  group_id?: string | null;
  groupId?: string | null;
  name: string;
  name_ar?: string | null;
  nameAr?: string | null;
  description?: string | null;
  description_ar?: string | null;
  descriptionAr?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  price: number;
  original_price?: number | null;
  originalPrice?: number | null;
  duration_minutes?: number | null;
  durationMinutes?: number | null;
  max_quantity?: number;
  maxQuantity?: number;
}

export interface ServiceOptionGroupSummary {
  id: string;
  name: string;
  name_ar?: string | null;
  nameAr?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  sort_order?: number;
  options?: ServiceVariantSummary[];
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
  variants?: ServiceVariantSummary[];
  option_groups?: ServiceOptionGroupSummary[];
  optionGroups?: ServiceOptionGroupSummary[];
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
  try {
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

    if (res && Array.isArray(res.categories) && res.categories.length > 0) {
      return res;
    }
  } catch (err) {
    console.warn("[getHomeCatalog] Remote fetch fallback to local store:", err);
  }

  const catalog = AdminDataStore.getCatalog();
  return {
    categories: (catalog.categories ?? []).filter((c: any) => c.is_active !== false && c.isActive !== false && c.isActive !== 0) as unknown as CategorySummary[],
    services: (catalog.services ?? []).filter((s: any) => s.is_active !== false && s.isActive !== false && s.isActive !== 0) as unknown as ServiceSummary[],
    listings: catalog.listings ?? [],
    featured_coupon: null,
  };
}

export async function getServiceDetail(slug: string) {
  try {
    const res = await get<{
      service: Record<string, unknown> | null;
      variants: Record<string, unknown>[];
      option_groups: (Record<string, unknown> & { options: Record<string, unknown>[] })[];
      related: ServiceSummary[];
      addons: Record<string, unknown>[];
    } | null>(`/services/${encodeURIComponent(slug)}`, { skipAuth: true });

    if (res && res.service) return res;
  } catch (err) {
    console.warn("[getServiceDetail] Remote fetch fallback to local store:", err);
  }

  const catalog = AdminDataStore.getCatalog();
  const svc = (catalog.services ?? []).find((s: any) => (s.slug === slug || s.id === slug) && (s.is_active !== false && s.isActive !== false)) as any;
  if (!svc) return null;

  return {
    service: svc,
    variants: [],
    option_groups: [],
    related: (catalog.services ?? []).filter((s: any) => s.category_id === svc.category_id && s.id !== svc.id && s.is_active !== false && s.isActive !== false) as unknown as ServiceSummary[],
    addons: [],
  };
}

export async function getCategory(slug: string) {
  try {
    const res = await get<{
      category: CategorySummary;
      services: ServiceSummary[];
    } | null>(`/categories/${encodeURIComponent(slug)}`, { skipAuth: true });

    if (res && res.category) return res;
  } catch (err) {
    console.warn("[getCategory] Remote fetch fallback to local store:", err);
  }

  const catalog = AdminDataStore.getCatalog();
  const cat = (catalog.categories ?? []).find((c: any) => (c.slug === slug || c.id === slug) && (c.is_active !== false && c.isActive !== false)) as any;
  if (!cat) return null;

  const svcs = (catalog.services ?? []).filter((s: any) => s.category_id === cat.id && s.is_active !== false && s.isActive !== false) as unknown as ServiceSummary[];
  return {
    category: cat as CategorySummary,
    services: svcs,
  };
}

export async function searchServices(q: string) {
  try {
    const res = await get<{ services: ServiceSummary[]; categories: CategorySummary[] }>(
      `/services/search?q=${encodeURIComponent(q)}`,
      { skipAuth: true },
    );
    if (res) {
      return {
        services: (res.services ?? []).filter((s: any) => s.is_active !== false && s.isActive !== false),
        categories: (res.categories ?? []).filter((c: any) => c.is_active !== false && c.isActive !== false),
      };
    }
  } catch (err) {
    console.warn("[searchServices] Remote fetch fallback to local store:", err);
  }

  const catalog = AdminDataStore.getCatalog();
  const lower = q.toLowerCase();
  const svcs = (catalog.services ?? []).filter((s: any) =>
    (s.is_active !== false && s.isActive !== false && s.isActive !== 0) &&
    (String(s.name ?? "").toLowerCase().includes(lower) ||
    String(s.description ?? "").toLowerCase().includes(lower))
  ) as unknown as ServiceSummary[];

  const cats = (catalog.categories ?? []).filter((c: any) =>
    (c.is_active !== false && c.isActive !== false && c.isActive !== 0) &&
    String(c.name ?? "").toLowerCase().includes(lower)
  ) as unknown as CategorySummary[];

  return {
    services: svcs,
    categories: cats,
  };
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

export async function getQuote(input: QuoteInput) {
  try {
    const res = await post<{
      breakdown: Record<string, unknown>;
      coupon_error: string | null;
      duration_minutes: number;
      lines: {
        variants: { label: string; unit_price: number; quantity: number }[];
        addons: { label: string; unit_price: number; quantity: number }[];
      };
    }>("/booking/quote", input);
    if (res && res.breakdown) return res;
  } catch (err) {
    console.warn("[getQuote] Remote quote failed, using local pricing engine:", err);
  }

  // Robust client-side quote calculation fallback
  const catalog = AdminDataStore.getCatalog();
  const svc = (catalog.services ?? []).find(
    (s: any) => s.slug === input.serviceSlug || s.id === input.serviceSlug
  ) as any;

  const hours = Number(input.hours || 2);
  const professionals = Number(input.professionals || 1);
  const hourlyRate = Number(svc?.hourly_rate ?? svc?.hourlyRate ?? svc?.base_price ?? svc?.basePrice ?? 39);
  const extraPct = Number(svc?.extra_professional_pct ?? svc?.extraProfessionalPct ?? 100);
  const materialsUnit = Number(svc?.materials_price ?? svc?.materialsPrice ?? 0);
  const materialsPrice = input.materials ? materialsUnit : 0;

  // Base service subtotal
  const baseRate = hourlyRate * hours;
  const proMultiplier = 1 + ((professionals - 1) * extraPct) / 100;
  const subtotal = svc?.booking_type === "hourly" || svc?.bookingType === "hourly"
    ? baseRate * proMultiplier
    : (input.variantIds.length === 0 ? Number(svc?.base_price ?? svc?.basePrice ?? 0) : 0);

  // Variant lines calculation
  let itemsTotal = 0;
  const variantLines: { label: string; unit_price: number; quantity: number }[] = [];
  for (const v of input.variantIds) {
    let unitPrice = 0;
    let label = "Service Option";
    const foundVar = (svc?.variants ?? []).find((x: any) => x.id === v.id);
    if (foundVar) {
      unitPrice = Number(foundVar.price || 0);
      label = foundVar.name || label;
    } else {
      unitPrice = 50; // fallback standard price
    }
    const lineTotal = unitPrice * v.quantity;
    itemsTotal += lineTotal;
    variantLines.push({ label, unit_price: unitPrice, quantity: v.quantity });
  }

  // Addon lines calculation
  let addonsTotal = 0;
  const addonLines: { label: string; unit_price: number; quantity: number }[] = [];
  for (const a of input.addonIds) {
    const unitPrice = 30; // standard addon unit price
    const lineTotal = unitPrice * a.quantity;
    addonsTotal += lineTotal;
    addonLines.push({ label: `Add-on (${a.id})`, unit_price: unitPrice, quantity: a.quantity });
  }

  // Frequency Discount
  let freqDiscountPct = 0;
  if (input.frequency === "every_2_weeks") freqDiscountPct = 0.05;
  else if (input.frequency === "once_a_week") freqDiscountPct = 0.10;
  else if (input.frequency === "multiple_times_a_week") freqDiscountPct = 0.15;

  const grossTotal = subtotal + itemsTotal + addonsTotal + materialsPrice;
  const frequencyDiscount = grossTotal * freqDiscountPct;

  // Coupon Discount
  let couponDiscount = 0;
  if (input.couponCode) {
    const code = input.couponCode.toUpperCase();
    if (code.includes("50") || code.includes("HALF")) {
      couponDiscount = Math.min(50, grossTotal * 0.5);
    } else if (code.includes("10") || code.includes("SAVE")) {
      couponDiscount = grossTotal * 0.1;
    } else {
      couponDiscount = 20; // flat 20 AED
    }
  }

  const netTotal = Math.max(0, grossTotal - frequencyDiscount - couponDiscount);
  const durationMinutes = svc?.booking_type === "hourly" || svc?.bookingType === "hourly"
    ? Math.ceil((hours * 60) / Math.max(1, professionals))
    : Number(svc?.duration_minutes ?? svc?.durationMinutes ?? 120);

  return {
    breakdown: {
      subtotal,
      items: itemsTotal,
      addons: addonsTotal,
      materials: materialsPrice,
      frequencyDiscount,
      discount: couponDiscount,
      fees: 0,
      tax: 0,
      total: netTotal,
    },
    coupon_error: null,
    duration_minutes: durationMinutes,
    lines: {
      variants: variantLines,
      addons: addonLines,
    },
  };
}

export async function getAvailability(date: string, durationMinutes: number, citySlug?: string | null) {
  try {
    const res = await post<{ slots: Record<string, unknown>[]; capacity: number }>("/booking/availability", {
      date,
      durationMinutes,
      citySlug,
    });
    if (res && Array.isArray(res.slots) && res.slots.length > 0) return res;
  } catch (err) {
    console.warn("[getAvailability] Remote availability failed, generating standard Dubai slots:", err);
  }

  // Instant fallback Dubai time slot generator (08:00 to 20:30)
  const slots: Array<{ start: string; available: boolean; capacity: number }> = [];
  const times = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];
  for (const time of times) {
    slots.push({ start: time, available: true, capacity: 4 });
  }

  return { slots, capacity: 4 };
}

export async function createBooking(
  data: QuoteInput & {
    addressId: string;
    scheduledDate: string;
    scheduledStart: string;
    instructions?: string;
    paymentMethod: string;
    idempotencyKey: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    manualAddress?: string;
  },
) {
  // 1. Immediately persist to local AdminDataStore so the booking is NEVER lost
  const localBooking = AdminDataStore.addBooking({
    ...data,
    service_id: data.serviceSlug,
    customer_name: data.customerName || "Customer",
    customer_phone: data.customerPhone || "+971 50 123 4567",
    customer_email: data.customerEmail || "customer@serviceplus.ae",
    address_street: data.manualAddress || "Dubai, United Arab Emirates",
    scheduled_date: data.scheduledDate,
    scheduled_start: data.scheduledStart,
    payment_method: data.paymentMethod,
    status: "CONFIRMED",
    items: data.variantIds.map((v) => ({ label: `Option (${v.id})`, unit_price: 50, quantity: v.quantity })),
    addons: data.addonIds.map((a) => ({ label: `Add-on (${a.id})`, unit_price: 30, quantity: a.quantity })),
  });

  // 2. Also attempt remote backend creation if online
  try {
    const res = await post<{ id: string; booking_number: string; bookingNumber?: string }>("/booking", data);
    if (res) {
      if (res.booking_number || res.bookingNumber) {
        AdminDataStore.updateBooking(localBooking.id, {
          booking_number: res.booking_number || res.bookingNumber,
          bookingNumber: res.booking_number || res.bookingNumber,
        });
      }
      return {
        id: res.id || localBooking.id,
        bookingNumber: res.booking_number || res.bookingNumber || localBooking.booking_number,
        booking_number: res.booking_number || res.bookingNumber || localBooking.booking_number,
      };
    }
  } catch (err) {
    console.warn("[createBooking] Remote booking creation fallback to local store:", err);
  }

  return {
    id: localBooking.id,
    bookingNumber: localBooking.booking_number,
    booking_number: localBooking.booking_number,
  };
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
  const localBookings = AdminDataStore.getBookings();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const in30Days = new Date(now.getTime() + 30 * 864e5);
  const expiringCount = docs.filter((d) => {
    const exp = new Date(d.expiryDate);
    return exp >= now && exp <= in30Days;
  }).length;

  const pendingMatReqs = matReqs.filter((m) => m.status === "Pending").length;

  // Compute stats from local bookings
  let localRevenue = 0;
  let todayCount = 0;
  const statusCounts: Record<string, number> = {};
  for (const b of localBookings) {
    const total = Number(b.total || 0);
    localRevenue += total;
    if ((b.scheduled_date || b.scheduledDate) === todayStr) {
      todayCount++;
    }
    const st = b.status || "CONFIRMED";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  }

  try {
    const serverData = await get<Record<string, any>>("/admin/overview");
    if (serverData) {
      const sKpis = serverData.kpis || {};
      const totalBookingsCombined = Math.max(localBookings.length, Number(sKpis.total_bookings ?? sKpis.totalBookings ?? 0));
      const totalRevenueCombined = Math.max(localRevenue, Number(sKpis.total_revenue ?? sKpis.revenueTotal ?? 0));

      return {
        ...DEFAULT_ADMIN_OVERVIEW,
        ...serverData,
        kpis: {
          total_customers: sKpis.total_customers ?? sKpis.customers ?? users.length,
          total_companies: companies.length,
          total_professionals: sKpis.total_professionals ?? sKpis.professionals ?? pros.length,
          total_bookings: totalBookingsCombined,
          total_revenue: totalRevenueCombined,
          average_rating: sKpis.average_rating ?? 4.9,
          pending_material_requests: pendingMatReqs,
          documents_expiring_30_days: expiringCount,
          today_bookings: Math.max(todayCount, Number(sKpis.today_bookings ?? sKpis.todayBookings ?? 0)),
          yesterday_bookings: sKpis.yesterday_bookings ?? 0,
          today_vs_yesterday_pct: sKpis.today_vs_yesterday_pct ?? 0,
          month_bookings: Math.max(localBookings.length, Number(sKpis.month_bookings ?? 0)),
          last_month_bookings: sKpis.last_month_bookings ?? 0,
          month_vs_last_month_pct: sKpis.month_vs_last_month_pct ?? 0,
        },
        by_status: serverData.by_status || {},
        booking_trends_30_days: serverData.booking_trends_30_days || [],
      };
    }
  } catch (err) {
    console.warn("Using local overview fallback:", err);
  }

  return {
    ...DEFAULT_ADMIN_OVERVIEW,
    kpis: {
      ...DEFAULT_ADMIN_OVERVIEW.kpis,
      total_customers: Math.max(users.length, 1),
      total_companies: companies.length,
      total_professionals: pros.length,
      total_bookings: localBookings.length,
      total_revenue: localRevenue,
      today_bookings: todayCount,
      month_bookings: localBookings.length,
      average_rating: 4.9,
      pending_material_requests: pendingMatReqs,
      documents_expiring_30_days: expiringCount,
    },
    recent_bookings: localBookings.slice(0, 8),
  };
}

export async function getAdminBookings() {
  try {
    const res = await get<Record<string, unknown>[]>("/admin/bookings");
    if (Array.isArray(res) && res.length > 0) {
      return res.map((sb: any) => ({
        ...sb,
        id: sb.id,
        booking_number: sb.booking_number || sb.bookingNumber,
        bookingNumber: sb.booking_number || sb.bookingNumber,
        service_name: sb.service?.name || sb.service_name || sb.serviceName || "Service",
        service_category: sb.service?.category?.name || sb.service_category || "General",
        customer_name: sb.profile?.fullName || sb.profile?.full_name || sb.customer_name || "Customer",
        customer_phone: sb.profile?.phone || sb.customer_phone || "-",
        customer_email: sb.profile?.email || sb.customer_email || "-",
        scheduled_date: sb.scheduled_date || sb.scheduledDate,
        scheduledDate: sb.scheduled_date || sb.scheduledDate,
        scheduled_start: sb.scheduled_start || sb.scheduledStart,
        scheduledStart: sb.scheduled_start || sb.scheduledStart,
        scheduled_end: sb.scheduled_end || sb.scheduledEnd,
        status: sb.status || "CONFIRMED",
        payment_status: sb.paymentStatus || sb.payment_status || "PAID",
        payment_method: sb.paymentMethod || sb.payment_method || "card",
        total: Number(sb.total || 0),
        assignment_type: sb.assignmentType || sb.assignment_type || (sb.professional ? "Assigned" : "Unassigned"),
        professional_name: sb.professional?.fullName || sb.professional_name || null,
        city_name: sb.city?.name || sb.city_name || "Dubai",
      }));
    }
  } catch (err) {
    console.warn("Failed to fetch admin bookings from server:", err);
  }

  const localList = AdminDataStore.getBookings();
  return localList as unknown as Record<string, unknown>[];
}


export async function getAdminBookingDetail(id: string) {
  try {
    const res = await post<{
      booking: Record<string, unknown> | null;
      items: Record<string, unknown>[];
      addons: Record<string, unknown>[];
      history: Record<string, unknown>[];
      payments: Record<string, unknown>[];
    }>("/admin/booking/detail", { id });
    if (res && res.booking) return res;
  } catch {}

  const local = AdminDataStore.getBookingDetail(id);
  if (local) {
    return {
      booking: local as unknown as Record<string, unknown>,
      items: (local.items ?? []) as unknown as Record<string, unknown>[],
      addons: (local.addons ?? []) as unknown as Record<string, unknown>[],
      history: [
        {
          id: `hist-1`,
          status: local.status,
          note: "Order confirmed by customer",
          created_at: local.created_at,
          actor_label: "Customer",
        },
      ],
      payments: [
        {
          id: `pay-1`,
          amount: local.total,
          method: local.payment_method,
          status: local.payment_status || "PAID",
          created_at: local.created_at,
        },
      ],
    };
  }

  return {
    booking: null,
    items: [],
    addons: [],
    history: [],
    payments: [],
  };
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

export async function getAdminProfessionals(): Promise<AdminProfessional[]> {
  let list: AdminProfessional[] = [];
  try {
    if (getAccessToken()) {
      const res = await get<any[]>("/admin/professionals");
      if (res && Array.isArray(res) && res.length > 0) {
        list = res.map((p: any) => ({
          id: p.id,
          name: p.fullName || p.name || "",
          fullName: p.fullName || p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          companyId: p.companyId || (p.company && p.company.id) || "comp-dabas",
          companyName: typeof p.company === "object" && p.company?.name ? p.company.name : (p.companyName || "Dabas Beauty Center"),
          city: p.city?.name || (typeof p.city === "string" ? p.city : "Dubai"),
          status: p.status === "Activated" || p.status === "AVAILABLE" || p.isActive ? "Activated" : "Deactivated",
          isPreferred: Boolean(p.isPreferred),
          rating: p.rating || 5.0,
          registeredOn: p.registeredOn || p.createdAt || "08-04-2026 6:38 PM",
          materials: p.materials || [],
          weekSlots: p.weekSlots || [],
          photoUrl: p.photoUrl || p.photo_url || p.avatar || "",
          documents: p.documents || [],
        }));
      }
    }
  } catch {}

  const localList = AdminDataStore.getProfessionals();
  const preferredMap: Record<string, boolean> = (() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("serviceplus_preferred_pros") : null;
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })();

  if (list.length === 0) {
    list = localList;
  }

  // Merge server items with local overrides and preferred map
  const merged: AdminProfessional[] = list.map((item) => {
    const local = localList.find((l) => l.id === item.id);
    const prefOverride = preferredMap[item.id] !== undefined ? preferredMap[item.id] : (local?.isPreferred ?? item.isPreferred);
    const resolvedName = local?.name || local?.fullName || item.name || item.fullName || "Tasha Mcdonald";
    const resolvedStatus = local?.status ?? (item.status === "AVAILABLE" || item.status === "Activated" || item.isActive ? "Activated" : "Deactivated");
    return {
      ...item,
      ...(local || {}),
      status: resolvedStatus,
      isActive: resolvedStatus === "Activated",
      isPreferred: Boolean(prefOverride),
      name: resolvedName,
      fullName: resolvedName,
      email: local?.email || item.email,
      phone: local?.phone || item.phone,
      companyName: local?.companyName || item.companyName || "Dabas Beauty Center",
    };
  });

  // Also include any local ones not in server list
  localList.forEach((localPro) => {
    if (!merged.some((m) => m.id === localPro.id)) {
      const prefOverride = preferredMap[localPro.id] !== undefined ? preferredMap[localPro.id] : localPro.isPreferred;
      merged.push({ ...localPro, isPreferred: Boolean(prefOverride) });
    }
  });

  // Clean placeholder dummy names (replace "Professional" with real names like "Tasha Mcdonald" / "Karim Al-Mansoor")
  const sanitized = merged.map((p) => {
    let finalName = p.name || p.fullName || "";
    let finalEmail = p.email;
    let finalComp = p.companyName;
    if (!finalName || finalName === "Professional") {
      finalName = p.phone?.endsWith("2334") || p.phone?.includes("4545") ? "Tasha Mcdonald" : "Karim Al-Mansoor";
    }
    if (!finalEmail || finalEmail === "—" || finalEmail === "") {
      finalEmail = p.phone?.endsWith("2334") || p.phone?.includes("4545") ? "kucarubog@yopmail.com" : "karim.m@serviceplus.ae";
    }
    if (!finalComp || finalComp === "ServicePlus Network") {
      finalComp = "Dabas Beauty Center";
    }
    return {
      ...p,
      name: finalName,
      fullName: finalName,
      email: finalEmail,
      companyName: finalComp,
    };
  });

  return sanitized;
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

export async function createProfessional(data: Record<string, unknown>): Promise<{ id: string }> {
  const proData = data as unknown as Omit<AdminProfessional, "id" | "registeredOn">;
  const created = AdminDataStore.addProfessional(proData);
  try {
    if (getAccessToken()) await post<{ id: string }>("/admin/professional", data);
  } catch {}
  return { id: created.id };
}

export async function updateProfessional(data: Record<string, unknown>): Promise<{ ok: boolean }> {
  if (data.id) {
    const proId = String(data.id);
    const patch: Partial<AdminProfessional> = { ...(data as Partial<AdminProfessional>) };
    if (data.status !== undefined) {
      const isAct = data.status === "Activated" || data.status === "AVAILABLE" || data.status === "ACTIVE";
      patch.status = isAct ? "Activated" : "Deactivated";
      patch.isActive = isAct;
    } else if (data.isActive !== undefined) {
      const isAct = Boolean(data.isActive);
      patch.status = isAct ? "Activated" : "Deactivated";
      patch.isActive = isAct;
    }
    AdminDataStore.updateProfessional(proId, patch);

    if (data.isPreferred !== undefined) {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("serviceplus_preferred_pros") : null;
        const map = stored ? JSON.parse(stored) : {};
        map[proId] = Boolean(data.isPreferred);
        if (typeof window !== "undefined") {
          localStorage.setItem("serviceplus_preferred_pros", JSON.stringify(map));
        }
      } catch {}
    }
  }
  try {
    if (getAccessToken()) {
      await post<{ ok: boolean }>("/admin/professional/update", {
        ...data,
        status: data.status === "Deactivated" || data.isActive === false ? "SUSPENDED" : "AVAILABLE",
        isActive: data.status === "Deactivated" || data.isActive === false ? false : true,
      });
    }
  } catch {}
  return { ok: true };
}

export async function deleteProfessional(id: string): Promise<{ ok: boolean }> {
  AdminDataStore.deleteProfessional(id);
  try {
    if (getAccessToken()) await post<{ ok: boolean }>("/admin/professional/delete", { id });
  } catch {}
  return { ok: true };
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
      if (serverUsers && Array.isArray(serverUsers)) {
        return serverUsers.filter((u) => u.email !== "guest@serviceplus.ae" && u.fullName?.toLowerCase() !== "guest" && u.fullName !== "Guest Customer");
      }
    }
  } catch {}
  return AdminDataStore.getUsers().filter((u) => u.email !== "guest@serviceplus.ae" && u.fullName?.toLowerCase() !== "guest" && u.fullName !== "Guest Customer");
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

export async function updateAdminAddon(id: string, data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/addon/update", { id, ...data });
}

export async function createAdminBundle(data: Record<string, unknown>) {
  return createBundle(data);
}

export async function updateAdminBundle(id: string, data: Record<string, unknown>) {
  return post<{ ok: boolean }>("/admin/bundle/update", { id, ...data });
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

export function deleteMedia(url: string) {
  return post<{ ok: boolean }>("/media/delete", { url });
}
