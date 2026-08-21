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
  permissions: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; export?: boolean; approve?: boolean }>;
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
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
  city: string;
  isPreferred: boolean;
  status: "Activated" | "Deactivated";
  registeredOn: string;
  rating: number;
  materials: string[];
  weekSlots: { day: string; enabled: boolean; start: string; end: string }[];
  documents: ComplianceDocument[];
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
  category: "Chemicals" | "Equipment" | "Disposables" | "PPE" | "Tools";
  sku: string;
  stock: number;
  unit: string;
  minStockAlert: number;
  unitPrice: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  imageUrl?: string;
}

export interface AdminMaterialRequest {
  id: string;
  requestId: string;
  requestedBy: string;
  requesterRole: "Professional" | "TeamLead" | "Supervisor";
  companyName: string;
  items: { materialId: string; materialName: string; quantity: number }[];
  urgency: "Normal" | "Urgent";
  requestDate: string;
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

/* ==========================================================================
   DEFAULT CLEAN SYSTEM TEMPLATES (No Dummy People / Records)
   ========================================================================== */

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

const STORAGE_VERSION = "v2_clean_real_data";

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
  getUsers: (): AdminUser[] => getFromStorage("users", INITIAL_USERS),
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
    if (updated.stock <= 0) updated.status = "Out of Stock";
    else if (updated.stock <= updated.minStockAlert) updated.status = "Low Stock";
    else updated.status = "In Stock";
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
};
