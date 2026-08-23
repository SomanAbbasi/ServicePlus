/**
 * ServicePlus Enterprise Admin Persistence Layer
 * Provides data structures and local client storage synchronization for admin management.
 * All dummy and placeholder records have been removed so all data is strictly real.
 */

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  walletBalance: number;
  status: "Activated" | "Deactivated";
  role: string;
  avatarUrl?: string;
  registeredOn: string;
  createdAt: string;
  address?: string;
}

export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  status: "Activated" | "Deactivated";
  registeredOn: string;
  avatarUrl?: string;
}

export interface PermissionItem {
  id: string;
  name: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export?: boolean;
  approve?: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  status: "Activated" | "Deactivated";
  registeredOn: string;
  permissions: Record<string, Record<string, boolean>>;
}

export interface ComplianceDocument {
  id: string;
  entityId: string;
  entityType: "Company" | "Professional" | "TeamLead" | "Supervisor";
  entityName: string;
  companyName?: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  fileUrl?: string;
  fileName?: string;
  remarks?: string;
  status: "Active" | "Inactive";
}

export interface AdminCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Activated" | "Deactivated";
  registeredOn: string;
  address?: string;
  documents: ComplianceDocument[];
}

export interface AdminProfessional {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
  city: string;
  isPreferred: boolean;
  status: "Activated" | "Deactivated";
  registeredOn: string;
  rating: number;
  materials?: string[];
  weekSlots?: { day: string; enabled: boolean; start: string; end: string }[];
  documents?: ComplianceDocument[];
  photoUrl?: string;
}

export interface AdminTeamLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
  city: string;
  status: "Activated" | "Deactivated";
  registeredOn: string;
  documents: ComplianceDocument[];
  avatarUrl?: string;
}

export interface AdminSupervisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
  status: "Activated" | "Deactivated";
  registeredOn: string;
  documents: ComplianceDocument[];
  avatarUrl?: string;
}

export interface AdminMaterial {
  id: string;
  name: string;
  nameAr?: string;
  nameUr?: string;
  category?: "Chemicals" | "Equipment" | "Disposables" | "PPE" | "Tools";
  sku?: string;
  stock?: number;
  unit?: string;
  minStockAlert?: number;
  unitPrice?: number;
  status?: "Activated" | "Deactivated" | "In Stock" | "Low Stock" | "Out of Stock";
  isActive?: boolean;
  imageUrl?: string;
  createdOn?: string;
}

export interface AdminMaterialRequest {
  id: string;
  requestId: string;
  serviceProviderName?: string;
  serviceProviderId?: string;
  teamLeaderName?: string;
  teamLeaderId?: string;
  materialName?: string;
  materialId?: string;
  quantity?: number;
  requestedBy?: string;
  requesterRole?: "Professional" | "TeamLead" | "Supervisor";
  companyName?: string;
  items?: { materialId: string; materialName: string; quantity: number }[];
  urgency?: "Normal" | "Urgent";
  requestOn?: string;
  requestDate?: string;
  status: "Pending" | "Approved" | "Dispatched" | "Rejected";
  notes?: string;
}

export interface AdminPlan {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  price: number;
  interval: "Weekly" | "Bi-Weekly" | "Monthly" | "Annual";
  hoursIncluded: number;
  discountPercentage: number;
  features: string[];
  isActive: boolean;
  popular?: boolean;
}

export interface AdminCategory {
  id: string;
  name: string;
  name_ar?: string;
  nameAr?: string;
  slug: string;
  description?: string;
  description_ar?: string;
  descriptionAr?: string;
  image_url?: string;
  imageUrl?: string;
  icon?: string;
  is_active: boolean;
  isActive?: boolean;
  sort_order: number;
  sortOrder?: number;
}

export interface AdminService {
  id: string;
  name: string;
  name_ar?: string;
  nameAr?: string;
  slug: string;
  category_id: string;
  categoryId?: string;
  short_description?: string;
  shortDescription?: string;
  description?: string;
  description_ar?: string;
  descriptionAr?: string;
  image_url?: string;
  imageUrl?: string;
  base_price: number;
  basePrice?: number;
  original_price?: number | null;
  originalPrice?: number | null;
  hourly_rate?: number | null;
  hourlyRate?: number | null;
  materials_price?: number;
  materialsPrice?: number;
  booking_type?: string;
  bookingType?: string;
  duration_minutes?: number;
  durationMinutes?: number;
  is_active: boolean;
  isActive?: boolean;
  is_featured?: boolean;
  isFeatured?: boolean;
  sort_order: number;
  sortOrder?: number;
}

export interface AdminListing {
  id?: string;
  category_id: string;
  categoryId?: string;
  service_id: string;
  serviceId?: string;
  sort_order: number;
  sortOrder?: number;
}

/* ==========================================================================
   DEFAULT CLEAN SYSTEM TEMPLATES
   ========================================================================== */

export const INITIAL_CATEGORIES: AdminCategory[] = [
  {
    id: "e6eaf8c8-af7e-493e-96cc-fe163eb33603",
    name: "Home Cleaning",
    name_ar: "تنظيف المنازل بالساعة",
    nameAr: "تنظيف المنازل بالساعة",
    slug: "home-cleaning",
    imageUrl: "/api/media/file/catalog/736cbbf1-df0e-4dd5-97b6-4a84330f5591-homeclean.png.jpg",
    image_url: "/api/media/file/catalog/736cbbf1-df0e-4dd5-97b6-4a84330f5591-homeclean.png.jpg",
    icon: "Sparkles",
    description: "Professional home cleaning services for every need.",
    description_ar: "أفضل تنظيف المنازل بالساعة في دبي والإمارات.",
    descriptionAr: "أفضل تنظيف المنازل بالساعة في دبي والإمارات.",
    is_active: true,
    isActive: true,
    sort_order: 0,
    sortOrder: 0,
  },
  {
    id: "b1573133-0f86-478f-a015-d63bea4e5907",
    name: "General Cleaning",
    name_ar: "التنظيف العام",
    nameAr: "التنظيف العام",
    slug: "general-cleaning",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    icon: "Sparkles",
    description: "Top-rated home cleaning, AC maintenance, furniture deep cleaning, villa deep cleaning, laundry & shoe care.",
    description_ar: "تنظيف منازل بالساعة، صيانة مكيفات، غسيل كنب وسجاد، تنظيف عميق للفلل والمباني، غسيل ملابس وتنظيف أحذية.",
    descriptionAr: "تنظيف منازل بالساعة، صيانة مكيفات، غسيل كنب وسجاد، تنظيف عميق للفلل والمباني، غسيل ملابس وتنظيف أحذية.",
    is_active: true,
    isActive: true,
    sort_order: 1,
    sortOrder: 1,
  },
  {
    id: "b6c6665c-456d-4328-b7f3-5a80998851d1",
    name: "Salon & Spa at Home",
    name_ar: "صالون وسبا في المنزل",
    nameAr: "صالون وسبا في المنزل",
    slug: "salon-spa-at-home",
    imageUrl: "/api/media/file/catalog/72aa77b5-60c7-4cf9-8b9a-20d71f03daa0-menhaircut.webp",
    image_url: "/api/media/file/catalog/72aa77b5-60c7-4cf9-8b9a-20d71f03daa0-menhaircut.webp",
    icon: "Sparkles",
    description: "Top-rated women's and men's beauty, salon and luxury spa wellness treatments delivered to your home.",
    description_ar: "خدمات التجميل والسبا النسائية والرجالية الفاخرة تصلك حتى باب منزلك.",
    descriptionAr: "خدمات التجميل والسبا النسائية والرجالية الفاخرة تصلك حتى باب منزلك.",
    is_active: true,
    isActive: true,
    sort_order: 2,
    sortOrder: 2,
  },
  {
    id: "5dd165f2-1f59-4e66-95fb-8d8a35c252cd",
    name: "Handyman",
    name_ar: "خدمات Handyman",
    nameAr: "خدمات Handyman",
    slug: "handyman",
    imageUrl: "/api/media/file/catalog/cae87c5f-ef98-420a-bd08-c55d0d1b4072-handyman.jpeg.jpg",
    image_url: "/api/media/file/catalog/cae87c5f-ef98-420a-bd08-c55d0d1b4072-handyman.jpeg.jpg",
    icon: "Wrench",
    description: "Expert handyman services for repairs and maintenance.",
    description_ar: "أفضل خدمات Handyman في دبي والإمارات.",
    descriptionAr: "أفضل خدمات Handyman في دبي والإمارات.",
    is_active: false,
    isActive: false,
    sort_order: 3,
    sortOrder: 3,
  },
  {
    id: "6591ba21-6409-4062-a244-fdc386de9373",
    name: "Healthcare at Home",
    name_ar: "الرعاية الصحية في المنزل",
    nameAr: "الرعاية الصحية في المنزل",
    slug: "healthcare-at-home",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    icon: "Activity",
    description: "DHA-licensed medical consultations, home lab tests, IV therapy, nurse care, vaccines and physical therapy.",
    description_ar: "فحوصات مخبرية منزلية، علاج بالوريد، استشارات طبية، رعاية تمريضية، لقاحات وعلاج طبيعي.",
    descriptionAr: "فحوصات مخبرية منزلية، علاج بالوريد، استشارات طبية، رعاية تمريضية، لقاحات وعلاج طبيعي.",
    is_active: false,
    isActive: false,
    sort_order: 4,
    sortOrder: 4,
  },
  {
    id: "14f21a0e-c63a-49da-a004-8f151844777c",
    name: "Handyman & Maintenance",
    name_ar: "الصيانة والخدمات المنزلية",
    nameAr: "الصيانة والخدمات المنزلية",
    slug: "handyman-maintenance",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    icon: "Wrench",
    description: "Skilled handymen, electricians, plumbers, home painting & roof waterproofing services at home.",
    description_ar: "حرفيون مهرة، كهربائيون، سباكون، دهان منازل وعزل أسطح معتمد في منزلك.",
    descriptionAr: "حرفيون مهرة، كهربائيون، سباكون، دهان منازل وعزل أسطح معتمد في منزلك.",
    is_active: false,
    isActive: false,
    sort_order: 5,
    sortOrder: 5,
  },
  {
    id: "198d67a7-88e4-4eef-8990-3004f717af4a",
    name: "Car Services",
    name_ar: "خدمات السيارات",
    nameAr: "خدمات السيارات",
    slug: "car-services",
    imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80",
    image_url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80",
    icon: "Car",
    description: "Doorstep car service, periodic 10K maintenance, oil changes, detailing & eco-friendly car wash at home.",
    description_ar: "خدمات صيانة وتغيير زيت السيارات عند البيت، غسيل وتلميع متنقل وتنظيف عميق.",
    descriptionAr: "خدمات صيانة وتغيير زيت السيارات عند البيت، غسيل وتلميع متنقل وتنظيف عميق.",
    is_active: false,
    isActive: false,
    sort_order: 6,
    sortOrder: 6,
  },
  {
    id: "bb8d60bf-0ccc-4535-a019-9dc2561a4b52",
    name: "Water Purifiers",
    name_ar: "أجهزة تنقية المياه",
    nameAr: "أجهزة تنقية المياه",
    slug: "water-purifiers",
    imageUrl: "/api/media/file/catalog/238ed6a2-5ab5-4f76-87e3-1f1306ef238e-water.webp",
    image_url: "/api/media/file/catalog/238ed6a2-5ab5-4f76-87e3-1f1306ef238e-water.webp",
    icon: "Droplet",
    description: "Premium countertop & floor-standing UV & RO water purification systems and hassle-free subscriptions.",
    description_ar: "أنظمة تنقية المياه المنزلية المتطورة بالفلترة النانوية والأشعة فوق البنفسجية واشتراكات ميسرة.",
    descriptionAr: "أنظمة تنقية المياه المنزلية المتطورة بالفلترة النانوية والأشعة فوق البنفسجية واشتراكات ميسرة.",
    is_active: false,
    isActive: false,
    sort_order: 7,
    sortOrder: 7,
  },
  {
    id: "3b06f46b-4732-40e8-af48-0b13fb78cb4e",
    name: "Pet Care at Home",
    name_ar: "العناية بالحيوانات الأليفة في المنزل",
    nameAr: "العناية بالحيوانات الأليفة في المنزل",
    slug: "pet-care-at-home",
    imageUrl: "/api/media/file/catalog/c98d34bd-2dfb-4fc4-a291-7129ec80c663-petcare.webp",
    image_url: "/api/media/file/catalog/c98d34bd-2dfb-4fc4-a291-7129ec80c663-petcare.webp",
    icon: "PawPrint",
    description: "Doorstep mobile pet grooming vans, home bathing, VIP pet spa, MOCCAE-certified vet visits, vaccines & walking.",
    description_ar: "سيارات متنقلة لقص وتزيين الحيوانات الأليفة، سبا منزلي، وفحوصات بيطرية وتطعيمات معتمدة.",
    descriptionAr: "سيارات متنقلة لقص وتزيين الحيوانات الأليفة، سبا منزلي، وفحوصات بيطرية وتطعيمات معتمدة.",
    is_active: false,
    isActive: false,
    sort_order: 8,
    sortOrder: 8,
  },
  {
    id: "f1cebfff-43c3-40d9-be23-152bc1ba6800",
    name: "Pest Control & Disinfection",
    name_ar: "مكافحة الآفات والتطهير",
    nameAr: "مكافحة الآفات والتطهير",
    slug: "pest-control",
    imageUrl: "/api/media/file/catalog/3e545700-ee94-4ce7-a589-afa3d90ae3ca-pest.webp",
    image_url: "/api/media/file/catalog/3e545700-ee94-4ce7-a589-afa3d90ae3ca-pest.webp",
    icon: "Shield",
    description: "Cockroach, bed bug, pest management & sanitization",
    description_ar: "خدمات مكافحة الحشرات الفعالة.",
    descriptionAr: "خدمات مكافحة الحشرات الفعالة.",
    is_active: false,
    isActive: false,
    sort_order: 9,
    sortOrder: 9,
  },
  {
    id: "5b0b82c5-9056-4468-9f18-838889ff5e10",
    name: "Disinfection",
    name_ar: "تعقيم",
    nameAr: "تعقيم",
    slug: "disinfection",
    imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80",
    icon: "ShieldCheck",
    description: "Complete home and office disinfection and sanitisation.",
    description_ar: "تعقيم وتطهير شامل للمنازل والمكاتب.",
    descriptionAr: "تعقيم وتطهير شامل للمنازل والمكاتب.",
    is_active: false,
    isActive: false,
    sort_order: 10,
    sortOrder: 10,
  },
];

export const INITIAL_SERVICES: AdminService[] = [
  {
    id: "svc-std-home-cleaning",
    name: "Standard Home Cleaning",
    name_ar: "تنظيف منازل بالساعة",
    nameAr: "تنظيف منازل بالساعة",
    slug: "standard-home-cleaning",
    category_id: "e6eaf8c8-af7e-493e-96cc-fe163eb33603",
    categoryId: "e6eaf8c8-af7e-493e-96cc-fe163eb33603",
    short_description: "Professional hourly home cleaning with certified cleaners.",
    description: "Full dusting, vacuuming, mopping, and kitchen/bathroom sanitization.",
    image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
    base_price: 120,
    basePrice: 120,
    booking_type: "hourly",
    bookingType: "hourly",
    duration_minutes: 120,
    durationMinutes: 120,
    is_active: true,
    isActive: true,
    is_featured: true,
    sort_order: 1,
    sortOrder: 1,
  },
  {
    id: "svc-general-cleaning",
    name: "General Cleaning Service",
    name_ar: "خدمة التنظيف العام",
    nameAr: "خدمة التنظيف العام",
    slug: "general-cleaning-service",
    category_id: "b1573133-0f86-478f-a015-d63bea4e5907",
    categoryId: "b1573133-0f86-478f-a015-d63bea4e5907",
    short_description: "General home and office cleaning package.",
    description: "Top-rated cleaning with all materials provided.",
    image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    base_price: 150,
    basePrice: 150,
    booking_type: "fixed",
    bookingType: "fixed",
    duration_minutes: 180,
    durationMinutes: 180,
    is_active: true,
    isActive: true,
    is_featured: true,
    sort_order: 2,
    sortOrder: 2,
  },
  {
    id: "svc-swedish-massage",
    name: "Salon & Spa at Home Care",
    name_ar: "صالون وسبا في المنزل",
    nameAr: "صالون وسبا في المنزل",
    slug: "salon-spa-at-home-care",
    category_id: "b6c6665c-456d-4328-b7f3-5a80998851d1",
    categoryId: "b6c6665c-456d-4328-b7f3-5a80998851d1",
    short_description: "Luxury wellness and relaxing spa treatments.",
    description: "Certified therapists deliver salon treatments directly to your home.",
    image_url: "/api/media/file/catalog/72aa77b5-60c7-4cf9-8b9a-20d71f03daa0-menhaircut.webp",
    imageUrl: "/api/media/file/catalog/72aa77b5-60c7-4cf9-8b9a-20d71f03daa0-menhaircut.webp",
    base_price: 220,
    basePrice: 220,
    booking_type: "hourly",
    bookingType: "hourly",
    duration_minutes: 60,
    durationMinutes: 60,
    is_active: true,
    isActive: true,
    is_featured: true,
    sort_order: 3,
    sortOrder: 3,
  },
];

export const INITIAL_LISTINGS: AdminListing[] = [
  { category_id: "e6eaf8c8-af7e-493e-96cc-fe163eb33603", service_id: "svc-std-home-cleaning", sort_order: 1 },
  { category_id: "b1573133-0f86-478f-a015-d63bea4e5907", service_id: "svc-general-cleaning", sort_order: 2 },
  { category_id: "b6c6665c-456d-4328-b7f3-5a80998851d1", service_id: "svc-swedish-massage", sort_order: 3 },
];

const INITIAL_COMPANIES: AdminCompany[] = [];
const INITIAL_PROFESSIONALS: AdminProfessional[] = [];
const INITIAL_TEAM_LEADS: AdminTeamLead[] = [];
const INITIAL_SUPERVISORS: AdminSupervisor[] = [];
const INITIAL_USERS: AdminUser[] = [];
const INITIAL_STAFF: AdminStaff[] = [];
const INITIAL_MATERIALS: AdminMaterial[] = [];
const INITIAL_MATERIAL_REQUESTS: AdminMaterialRequest[] = [];
const INITIAL_PLANS: AdminPlan[] = [];

const INITIAL_ROLES: AdminRole[] = [
  {
    id: "role-super-admin",
    name: "Super Administrator",
    status: "Activated",
    registeredOn: "2026-01-01",
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      users: { view: true, create: true, edit: true, delete: true, export: true },
      staff: { view: true, create: true, edit: true, delete: true },
      roles: { view: true, create: true, edit: true, delete: true },
      professionals: { view: true, create: true, edit: true, delete: true },
      team_leads: { view: true, create: true, edit: true, delete: true },
      companies: { view: true, create: true, edit: true, delete: true },
      supervisors: { view: true, create: true, edit: true, delete: true },
      categories: { view: true, create: true, edit: true, delete: true },
      services: { view: true, create: true, edit: true, delete: true },
      service_grouping: { view: true, create: true, edit: true, delete: true },
      plans: { view: true, create: true, edit: true, delete: true },
      coupons: { view: true, create: true, edit: true, delete: true },
      bookings: { view: true, create: true, edit: true, delete: true, approve: true },
      calendar: { view: true, create: true, edit: true, delete: true },
      reviews: { view: true, create: true, edit: true, delete: true },
      payments: { view: true, create: true, edit: true, delete: true, export: true },
      expired_documents: { view: true, create: true, edit: true, delete: true, approve: true },
      materials: { view: true, create: true, edit: true, delete: true },
      material_requests: { view: true, create: true, edit: true, delete: true, approve: true },
      settings: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: "role-operations",
    name: "Operations Manager",
    status: "Activated",
    registeredOn: "2026-01-01",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: true },
      users: { view: true, create: true, edit: true, delete: false },
      professionals: { view: true, create: true, edit: true, delete: false },
      team_leads: { view: true, create: true, edit: true, delete: false },
      companies: { view: true, create: true, edit: true, delete: false },
      supervisors: { view: true, create: true, edit: true, delete: false },
      bookings: { view: true, create: true, edit: true, delete: false, approve: true },
      calendar: { view: true, create: true, edit: true, delete: false },
      expired_documents: { view: true, create: true, edit: true, delete: false, approve: true },
      materials: { view: true, create: true, edit: true, delete: false },
      material_requests: { view: true, create: true, edit: true, delete: false, approve: true },
    },
  },
  {
    id: "role-customer-support",
    name: "Customer Support",
    status: "Activated",
    registeredOn: "2026-01-01",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      users: { view: true, create: false, edit: true, delete: false },
      bookings: { view: true, create: true, edit: true, delete: false },
      calendar: { view: true, create: false, edit: false, delete: false },
      reviews: { view: true, create: false, edit: true, delete: false },
    },
  },
];

/* ==========================================================================
   STORAGE ENGINE & CACHE CLEANSING
   ========================================================================== */

const STORAGE_VERSION = "v4_clean_dashboard";

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    // One-time cleanup of old dummy data if previous storage version
    const version = localStorage.getItem("serviceplus_admin_data_version");
    if (version !== STORAGE_VERSION) {
      const keysToClear = [
        "serviceplus_admin_users",
        "serviceplus_admin_professionals",
        "serviceplus_admin_companies",
        "serviceplus_admin_team_leads",
        "serviceplus_admin_supervisors",
        "serviceplus_admin_materials",
        "serviceplus_admin_material_requests",
        "serviceplus_admin_plans",
        "serviceplus_admin_staff",
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem("serviceplus_admin_data_version", STORAGE_VERSION);
    }

    const stored = localStorage.getItem(`serviceplus_admin_${key}`);
    if (!stored) return fallback;
    return JSON.parse(stored) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`serviceplus_admin_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const AdminDataStore = {
  // Users
  getUsers: (): AdminUser[] => {
    const raw = getFromStorage("users", INITIAL_USERS);
    return raw.filter((u) => u.email !== "guest@serviceplus.ae" && u.fullName?.toLowerCase() !== "guest" && u.fullName !== "Guest Customer");
  },
  saveUsers: (users: AdminUser[]) => saveToStorage("users", users),
  addUser: (user: Omit<AdminUser, "id" | "registeredOn" | "createdAt">): AdminUser => {
    const users = AdminDataStore.getUsers();
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const newUser: AdminUser = {
      ...user,
      id: `usr-${Date.now()}`,
      registeredOn: dateStr,
      createdAt: now.toISOString(),
    };
    const updated = [newUser, ...users];
    AdminDataStore.saveUsers(updated);
    return newUser;
  },
  updateUser: (id: string, patch: Partial<AdminUser>): AdminUser | null => {
    const users = AdminDataStore.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1 || !users[idx]) return null;
    const existing = users[idx]!;
    const updated: AdminUser = { ...existing, ...patch, id: existing.id };
    users[idx] = updated;
    AdminDataStore.saveUsers(users);
    return updated;
  },
  deleteUser: (id: string): boolean => {
    const users = AdminDataStore.getUsers();
    const filtered = users.filter((u) => u.id !== id);
    AdminDataStore.saveUsers(filtered);
    return true;
  },

  // Staff
  getStaff: (): AdminStaff[] => getFromStorage("staff", INITIAL_STAFF),
  saveStaff: (staff: AdminStaff[]) => saveToStorage("staff", staff),
  addStaff: (staff: Omit<AdminStaff, "id" | "registeredOn">): AdminStaff => {
    const list = AdminDataStore.getStaff();
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const newStaff: AdminStaff = {
      ...staff,
      id: `staff-${Date.now()}`,
      registeredOn: dateStr,
    };
    const updated = [newStaff, ...list];
    AdminDataStore.saveStaff(updated);
    return newStaff;
  },
  updateStaff: (id: string, patch: Partial<AdminStaff>): AdminStaff | null => {
    const list = AdminDataStore.getStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminStaff = { ...existing, ...patch, id: existing.id };
    list[idx] = updated;
    AdminDataStore.saveStaff(list);
    return updated;
  },
  deleteStaff: (id: string): boolean => {
    const list = AdminDataStore.getStaff();
    AdminDataStore.saveStaff(list.filter((s) => s.id !== id));
    return true;
  },

  // Roles
  getRoles: (): AdminRole[] => getFromStorage("roles", INITIAL_ROLES),
  saveRoles: (roles: AdminRole[]) => saveToStorage("roles", roles),
  addRole: (role: Omit<AdminRole, "id" | "registeredOn">): AdminRole => {
    const roles = AdminDataStore.getRoles();
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`;
    const newRole: AdminRole = {
      ...role,
      id: `role-${Date.now()}`,
      registeredOn: dateStr,
    };
    const updated = [...roles, newRole];
    AdminDataStore.saveRoles(updated);
    return newRole;
  },
  updateRole: (id: string, patch: Partial<AdminRole>): AdminRole | null => {
    const roles = AdminDataStore.getRoles();
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1 || !roles[idx]) return null;
    const existing = roles[idx]!;
    const updated: AdminRole = { ...existing, ...patch, id: existing.id };
    roles[idx] = updated;
    AdminDataStore.saveRoles(roles);
    return updated;
  },
  deleteRole: (id: string): boolean => {
    const roles = AdminDataStore.getRoles();
    AdminDataStore.saveRoles(roles.filter((r) => r.id !== id));
    return true;
  },

  // Companies
  getCompanies: (): AdminCompany[] => getFromStorage("companies", INITIAL_COMPANIES),
  saveCompanies: (companies: AdminCompany[]) => saveToStorage("companies", companies),
  addCompany: (comp: Omit<AdminCompany, "id" | "registeredOn">): AdminCompany => {
    const list = AdminDataStore.getCompanies();
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const newComp: AdminCompany = {
      ...comp,
      id: `comp-${Date.now()}`,
      registeredOn: dateStr,
      documents: comp.documents || [],
    };
    const updated = [newComp, ...list];
    AdminDataStore.saveCompanies(updated);
    return newComp;
  },
  updateCompany: (id: string, patch: Partial<AdminCompany>): AdminCompany | null => {
    const list = AdminDataStore.getCompanies();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminCompany = { ...existing, ...patch, id: existing.id };
    list[idx] = updated;
    AdminDataStore.saveCompanies(list);
    return updated;
  },
  deleteCompany: (id: string): boolean => {
    const list = AdminDataStore.getCompanies();
    AdminDataStore.saveCompanies(list.filter((c) => c.id !== id));
    return true;
  },

  // Professionals
  getProfessionals: (): AdminProfessional[] => getFromStorage("professionals", INITIAL_PROFESSIONALS),
  saveProfessionals: (pros: AdminProfessional[]) => saveToStorage("professionals", pros),
  addProfessional: (pro: Omit<AdminProfessional, "id" | "registeredOn" | "rating">): AdminProfessional => {
    const list = AdminDataStore.getProfessionals();
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const newPro: AdminProfessional = {
      ...pro,
      id: `pro-${Date.now()}`,
      rating: 5.0,
      registeredOn: dateStr,
      documents: pro.documents || [],
    };
    const updated = [newPro, ...list];
    AdminDataStore.saveProfessionals(updated);
    return newPro;
  },
  updateProfessional: (id: string, patch: Partial<AdminProfessional>): AdminProfessional | null => {
    const list = AdminDataStore.getProfessionals();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminProfessional = { ...existing, ...patch, id: existing.id };
    list[idx] = updated;
    AdminDataStore.saveProfessionals(list);
    return updated;
  },
  deleteProfessional: (id: string): boolean => {
    const list = AdminDataStore.getProfessionals();
    AdminDataStore.saveProfessionals(list.filter((p) => p.id !== id));
    return true;
  },

  // Team Leads
  getTeamLeads: (): AdminTeamLead[] => getFromStorage("team_leads", INITIAL_TEAM_LEADS),
  saveTeamLeads: (leads: AdminTeamLead[]) => saveToStorage("team_leads", leads),
  addTeamLead: (lead: Omit<AdminTeamLead, "id" | "registeredOn">): AdminTeamLead => {
    const list = AdminDataStore.getTeamLeads();
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const newLead: AdminTeamLead = {
      ...lead,
      id: `tl-${Date.now()}`,
      registeredOn: dateStr,
      documents: lead.documents || [],
    };
    const updated = [newLead, ...list];
    AdminDataStore.saveTeamLeads(updated);
    return newLead;
  },
  updateTeamLead: (id: string, patch: Partial<AdminTeamLead>): AdminTeamLead | null => {
    const list = AdminDataStore.getTeamLeads();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminTeamLead = { ...existing, ...patch, id: existing.id };
    list[idx] = updated;
    AdminDataStore.saveTeamLeads(list);
    return updated;
  },
  deleteTeamLead: (id: string): boolean => {
    const list = AdminDataStore.getTeamLeads();
    AdminDataStore.saveTeamLeads(list.filter((t) => t.id !== id));
    return true;
  },

  // Supervisors
  getSupervisors: (): AdminSupervisor[] => getFromStorage("supervisors", INITIAL_SUPERVISORS),
  saveSupervisors: (sups: AdminSupervisor[]) => saveToStorage("supervisors", sups),
  addSupervisor: (sup: Omit<AdminSupervisor, "id" | "registeredOn">): AdminSupervisor => {
    const list = AdminDataStore.getSupervisors();
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const newSup: AdminSupervisor = {
      ...sup,
      id: `sup-${Date.now()}`,
      registeredOn: dateStr,
      documents: sup.documents || [],
    };
    const updated = [newSup, ...list];
    AdminDataStore.saveSupervisors(updated);
    return newSup;
  },
  updateSupervisor: (id: string, patch: Partial<AdminSupervisor>): AdminSupervisor | null => {
    const list = AdminDataStore.getSupervisors();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminSupervisor = { ...existing, ...patch, id: existing.id };
    list[idx] = updated;
    AdminDataStore.saveSupervisors(list);
    return updated;
  },
  deleteSupervisor: (id: string): boolean => {
    const list = AdminDataStore.getSupervisors();
    AdminDataStore.saveSupervisors(list.filter((s) => s.id !== id));
    return true;
  },

  // Compliance Documents across all entities
  getAllComplianceDocuments: (): ComplianceDocument[] => {
    const docs: ComplianceDocument[] = [];
    const companies = AdminDataStore.getCompanies();
    for (const c of companies) {
      if (c.documents) docs.push(...c.documents);
    }
    const pros = AdminDataStore.getProfessionals();
    for (const p of pros) {
      if (p.documents) docs.push(...p.documents);
    }
    const leads = AdminDataStore.getTeamLeads();
    for (const l of leads) {
      if (l.documents) docs.push(...l.documents);
    }
    const sups = AdminDataStore.getSupervisors();
    for (const s of sups) {
      if (s.documents) docs.push(...s.documents);
    }
    return docs;
  },

  renewDocument: (docId: string, patch: Partial<ComplianceDocument>): boolean => {
    const companies = AdminDataStore.getCompanies();
    let found = false;
    for (const c of companies) {
      const dIdx = c.documents?.findIndex((d) => d.id === docId);
      if (dIdx !== undefined && dIdx !== -1 && c.documents?.[dIdx]) {
        const existing = c.documents[dIdx]!;
        c.documents[dIdx] = { ...existing, ...patch, id: existing.id };
        AdminDataStore.saveCompanies(companies);
        found = true;
        break;
      }
    }
    if (found) return true;

    const pros = AdminDataStore.getProfessionals();
    for (const p of pros) {
      const dIdx = p.documents?.findIndex((d) => d.id === docId);
      if (dIdx !== undefined && dIdx !== -1 && p.documents?.[dIdx]) {
        const existing = p.documents[dIdx]!;
        p.documents[dIdx] = { ...existing, ...patch, id: existing.id };
        AdminDataStore.saveProfessionals(pros);
        found = true;
        break;
      }
    }
    if (found) return true;

    const leads = AdminDataStore.getTeamLeads();
    for (const l of leads) {
      const dIdx = l.documents?.findIndex((d) => d.id === docId);
      if (dIdx !== undefined && dIdx !== -1 && l.documents?.[dIdx]) {
        const existing = l.documents[dIdx]!;
        l.documents[dIdx] = { ...existing, ...patch, id: existing.id };
        AdminDataStore.saveTeamLeads(leads);
        found = true;
        break;
      }
    }
    if (found) return true;

    const sups = AdminDataStore.getSupervisors();
    for (const s of sups) {
      const dIdx = s.documents?.findIndex((d) => d.id === docId);
      if (dIdx !== undefined && dIdx !== -1 && s.documents?.[dIdx]) {
        const existing = s.documents[dIdx]!;
        s.documents[dIdx] = { ...existing, ...patch, id: existing.id };
        AdminDataStore.saveSupervisors(sups);
        found = true;
        break;
      }
    }
    return found;
  },

  // Materials & Inventory
  getMaterials: (): AdminMaterial[] => getFromStorage("materials", INITIAL_MATERIALS),
  saveMaterials: (mats: AdminMaterial[]) => saveToStorage("materials", mats),
  addMaterial: (mat: Omit<AdminMaterial, "id">): AdminMaterial => {
    const list = AdminDataStore.getMaterials();
    const newMat: AdminMaterial = { ...mat, id: `mat-${Date.now()}` };
    const updated = [newMat, ...list];
    AdminDataStore.saveMaterials(updated);
    return newMat;
  },
  updateMaterial: (id: string, patch: Partial<AdminMaterial>): AdminMaterial | null => {
    const list = AdminDataStore.getMaterials();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminMaterial = { ...existing, ...patch, id: existing.id };
    if (updated.stock !== undefined && updated.minStockAlert !== undefined) {
      if (updated.stock <= 0) updated.status = "Out of Stock";
      else if (updated.stock <= updated.minStockAlert) updated.status = "Low Stock";
      else updated.status = "Activated";
    }
    list[idx] = updated;
    AdminDataStore.saveMaterials(list);
    return updated;
  },
  deleteMaterial: (id: string): boolean => {
    const list = AdminDataStore.getMaterials();
    AdminDataStore.saveMaterials(list.filter((m) => m.id !== id));
    return true;
  },

  // Material Requests
  getMaterialRequests: (): AdminMaterialRequest[] => getFromStorage("material_requests", INITIAL_MATERIAL_REQUESTS),
  saveMaterialRequests: (reqs: AdminMaterialRequest[]) => saveToStorage("material_requests", reqs),
  addMaterialRequest: (req: Omit<AdminMaterialRequest, "id" | "requestId" | "requestDate">): AdminMaterialRequest => {
    const list = AdminDataStore.getMaterialRequests();
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const newReq: AdminMaterialRequest = {
      ...req,
      id: `req-${Date.now()}`,
      requestId: `MR-2026-${Math.floor(100 + Math.random() * 900)}`,
      requestDate: dateStr,
    };
    const updated = [newReq, ...list];
    AdminDataStore.saveMaterialRequests(updated);
    return newReq;
  },
  updateMaterialRequestStatus: (id: string, status: AdminMaterialRequest["status"], notes?: string): AdminMaterialRequest | null => {
    const list = AdminDataStore.getMaterialRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminMaterialRequest = { ...existing, status, notes: notes ?? existing.notes };
    list[idx] = updated;
    AdminDataStore.saveMaterialRequests(list);
    return updated;
  },

  // Plans
  getPlans: (): AdminPlan[] => getFromStorage("plans", INITIAL_PLANS),
  savePlans: (plans: AdminPlan[]) => saveToStorage("plans", plans),
  addPlan: (plan: Omit<AdminPlan, "id">): AdminPlan => {
    const list = AdminDataStore.getPlans();
    const newPlan: AdminPlan = { ...plan, id: `plan-${Date.now()}` };
    const updated = [newPlan, ...list];
    AdminDataStore.savePlans(updated);
    return newPlan;
  },
  updatePlan: (id: string, patch: Partial<AdminPlan>): AdminPlan | null => {
    const list = AdminDataStore.getPlans();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminPlan = { ...existing, ...patch, id: existing.id };
    list[idx] = updated;
    AdminDataStore.savePlans(list);
    return updated;
  },
  deletePlan: (id: string): boolean => {
    const list = AdminDataStore.getPlans();
    AdminDataStore.savePlans(list.filter((p) => p.id !== id));
    return true;
  },

  // Categories
  getCategories: (): AdminCategory[] => {
    const list = getFromStorage("categories", INITIAL_CATEGORIES);
    return list.map((c) => {
      const copy = { ...c };
      delete copy.description;
      delete copy.description_ar;
      delete copy.descriptionAr;
      return copy;
    });
  },
  saveCategories: (categories: AdminCategory[]) => saveToStorage("categories", categories),
  addCategory: (cat: Record<string, any>): AdminCategory => {
    const list = AdminDataStore.getCategories();
    const newCat: AdminCategory = {
      id: cat.id || `cat-${Date.now()}`,
      name: cat.name || "",
      name_ar: cat.name_ar || cat.nameAr,
      nameAr: cat.name_ar || cat.nameAr,
      slug: cat.slug || (cat.name || "").toLowerCase().replace(/\s+/g, "-"),
      image_url: cat.image_url || cat.imageUrl,
      imageUrl: cat.image_url || cat.imageUrl,
      icon: cat.icon || "Sparkles",
      is_active: cat.is_active ?? cat.isActive ?? true,
      isActive: cat.is_active ?? cat.isActive ?? true,
      sort_order: cat.sort_order ?? cat.sortOrder ?? list.length + 1,
      sortOrder: cat.sort_order ?? cat.sortOrder ?? list.length + 1,
    };
    const updated = [...list, newCat];
    AdminDataStore.saveCategories(updated);
    return newCat;
  },
  updateCategory: (id: string, patch: Record<string, any>): AdminCategory | null => {
    const list = AdminDataStore.getCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminCategory = {
      ...existing,
      ...patch,
      id: existing.id,
      name: patch.name !== undefined ? patch.name : existing.name,
      name_ar: patch.name_ar !== undefined ? patch.name_ar : (patch.nameAr !== undefined ? patch.nameAr : existing.name_ar),
      nameAr: patch.nameAr !== undefined ? patch.nameAr : (patch.name_ar !== undefined ? patch.name_ar : existing.nameAr),
      image_url: patch.image_url !== undefined ? patch.image_url : (patch.imageUrl !== undefined ? patch.imageUrl : (patch.iconUrl !== undefined ? patch.iconUrl : existing.image_url)),
      imageUrl: patch.image_url !== undefined ? patch.image_url : (patch.imageUrl !== undefined ? patch.imageUrl : (patch.iconUrl !== undefined ? patch.iconUrl : existing.imageUrl)),
      is_active: patch.is_active !== undefined ? patch.is_active : (patch.isActive !== undefined ? patch.isActive : existing.is_active),
      isActive: patch.is_active !== undefined ? patch.is_active : (patch.isActive !== undefined ? patch.isActive : existing.isActive),
      sort_order: patch.sort_order !== undefined ? patch.sort_order : (patch.sortOrder !== undefined ? patch.sortOrder : existing.sort_order),
      sortOrder: patch.sort_order !== undefined ? patch.sort_order : (patch.sortOrder !== undefined ? patch.sortOrder : existing.sortOrder),
    };
    delete updated.description;
    delete updated.description_ar;
    delete updated.descriptionAr;
    list[idx] = updated;
    AdminDataStore.saveCategories(list);
    return updated;
  },
  deleteCategory: (id: string): boolean => {
    const list = AdminDataStore.getCategories();
    AdminDataStore.saveCategories(list.filter((c) => c.id !== id));
    return true;
  },

  // Services
  getServices: (): AdminService[] => getFromStorage("services", INITIAL_SERVICES),
  saveServices: (services: AdminService[]) => saveToStorage("services", services),
  addService: (svc: Record<string, any>): AdminService => {
    const list = AdminDataStore.getServices();
    const newSvc: AdminService = {
      id: svc.id || `svc-${Date.now()}`,
      name: svc.name || "",
      name_ar: svc.name_ar || svc.nameAr,
      nameAr: svc.name_ar || svc.nameAr,
      slug: svc.slug || (svc.name || "").toLowerCase().replace(/\s+/g, "-"),
      category_id: svc.category_id || svc.categoryId || "",
      categoryId: svc.category_id || svc.categoryId || "",
      short_description: svc.short_description || svc.shortDescription,
      shortDescription: svc.short_description || svc.shortDescription,
      description: svc.description,
      description_ar: svc.description_ar || svc.descriptionAr,
      descriptionAr: svc.description_ar || svc.descriptionAr,
      image_url: svc.image_url || svc.imageUrl,
      imageUrl: svc.image_url || svc.imageUrl,
      base_price: Number(svc.base_price ?? svc.basePrice ?? 0),
      basePrice: Number(svc.base_price ?? svc.basePrice ?? 0),
      original_price: svc.original_price ?? svc.originalPrice ?? null,
      originalPrice: svc.original_price ?? svc.originalPrice ?? null,
      hourly_rate: svc.hourly_rate ?? svc.hourlyRate ?? null,
      hourlyRate: svc.hourly_rate ?? svc.hourlyRate ?? null,
      materials_price: Number(svc.materials_price ?? svc.materialsPrice ?? 0),
      materialsPrice: Number(svc.materials_price ?? svc.materialsPrice ?? 0),
      booking_type: svc.booking_type || svc.bookingType || "fixed",
      bookingType: svc.booking_type || svc.bookingType || "fixed",
      duration_minutes: Number(svc.duration_minutes ?? svc.durationMinutes ?? 60),
      durationMinutes: Number(svc.duration_minutes ?? svc.durationMinutes ?? 60),
      is_active: svc.is_active ?? svc.isActive ?? true,
      isActive: svc.is_active ?? svc.isActive ?? true,
      is_featured: svc.is_featured ?? svc.isFeatured ?? false,
      isFeatured: svc.is_featured ?? svc.isFeatured ?? false,
      sort_order: svc.sort_order ?? svc.sortOrder ?? list.length + 1,
      sortOrder: svc.sort_order ?? svc.sortOrder ?? list.length + 1,
    };
    const updated = [...list, newSvc];
    AdminDataStore.saveServices(updated);
    return newSvc;
  },
  updateService: (id: string, patch: Record<string, any>): AdminService | null => {
    const list = AdminDataStore.getServices();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1 || !list[idx]) return null;
    const existing = list[idx]!;
    const updated: AdminService = {
      ...existing,
      ...patch,
      id: existing.id,
      name: patch.name !== undefined ? patch.name : existing.name,
      category_id: patch.category_id || patch.categoryId || existing.category_id,
      categoryId: patch.category_id || patch.categoryId || existing.categoryId,
      is_active: patch.is_active !== undefined ? patch.is_active : (patch.isActive !== undefined ? patch.isActive : existing.is_active),
      isActive: patch.is_active !== undefined ? patch.is_active : (patch.isActive !== undefined ? patch.isActive : existing.isActive),
    };
    list[idx] = updated;
    AdminDataStore.saveServices(list);
    return updated;
  },
  deleteService: (id: string): boolean => {
    const list = AdminDataStore.getServices();
    AdminDataStore.saveServices(list.filter((s) => s.id !== id));
    return true;
  },

  // Listings
  getListings: (): AdminListing[] => getFromStorage("listings", INITIAL_LISTINGS),
  saveListings: (listings: AdminListing[]) => saveToStorage("listings", listings),
  setListing: (categoryId: string, serviceId: string, listed: boolean) => {
    const list = AdminDataStore.getListings();
    if (listed) {
      if (!list.some((l) => (l.category_id === categoryId || l.categoryId === categoryId) && (l.service_id === serviceId || l.serviceId === serviceId))) {
        AdminDataStore.saveListings([...list, { category_id: categoryId, service_id: serviceId, sort_order: list.length + 1 }]);
      }
    } else {
      AdminDataStore.saveListings(list.filter((l) => !((l.category_id === categoryId || l.categoryId === categoryId) && (l.service_id === serviceId || l.serviceId === serviceId))));
    }
  },

  // Combined Catalog
  getCatalog: () => {
    return {
      categories: AdminDataStore.getCategories(),
      services: AdminDataStore.getServices(),
      listings: AdminDataStore.getListings(),
    };
  },
  syncCatalog: (categories?: any[], services?: any[], listings?: any[]) => {
    if (Array.isArray(categories) && categories.length > 0) {
      AdminDataStore.saveCategories(categories.map((c) => ({
        ...c,
        category_id: c.category_id ?? c.categoryId,
        is_active: c.is_active ?? c.isActive ?? true,
        image_url: c.image_url ?? c.imageUrl,
        sort_order: c.sort_order ?? c.sortOrder ?? 0,
      })));
    }
    if (Array.isArray(services) && services.length > 0) {
      AdminDataStore.saveServices(services.map((s) => ({
        ...s,
        category_id: s.category_id ?? s.categoryId,
        is_active: s.is_active ?? s.isActive ?? true,
        image_url: s.image_url ?? s.imageUrl,
        sort_order: s.sort_order ?? s.sortOrder ?? 0,
      })));
    }
    if (Array.isArray(listings) && listings.length > 0) {
      AdminDataStore.saveListings(listings.map((l) => ({
        ...l,
        category_id: l.category_id ?? l.categoryId,
        service_id: l.service_id ?? l.serviceId,
        sort_order: l.sort_order ?? l.sortOrder ?? 0,
      })));
    }
  },
};
