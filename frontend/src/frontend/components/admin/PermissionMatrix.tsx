import React, { useState } from "react";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface SubPermission {
  key: string;
  label: string;
}

export interface MajorModule {
  id: string;
  name: string;
  subPermissions: SubPermission[];
}

export const MAJOR_PERMISSION_MODULES: MajorModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    subPermissions: [
      { key: "view", label: "View Analytics & Metrics" },
      { key: "export", label: "Export Dashboard Reports" },
      { key: "view_revenue", label: "View Revenue & Financials" },
      { key: "view_staff_activity", label: "View Active Staff Activity" },
    ],
  },
  {
    id: "users",
    name: "Users",
    subPermissions: [
      { key: "view", label: "View Users List" },
      { key: "create", label: "Add New User" },
      { key: "edit", label: "Edit User Profile" },
      { key: "delete", label: "Delete User Account" },
      { key: "toggle_status", label: "Activate / Deactivate Users" },
      { key: "password_reset", label: "Reset User Password" },
      { key: "send_credentials", label: "Send Credentials via SMS/Email" },
      { key: "export", label: "Export Users CSV" },
    ],
  },
  {
    id: "system_management",
    name: "System Management",
    subPermissions: [
      { key: "view_health", label: "System Health & Status" },
      { key: "view_logs", label: "Audit & Error Logs" },
      { key: "db_backup", label: "Database Backup & Export" },
      { key: "cache_clear", label: "Cache Management" },
    ],
  },
  {
    id: "admin_settings",
    name: "Admin Settings",
    subPermissions: [
      { key: "general_config", label: "General Platform Configuration" },
      { key: "smtp_settings", label: "SMTP & Email Server Settings" },
      { key: "sms_gateway", label: "SMS Gateway Credentials" },
      { key: "payment_gateways", label: "Payment Gateway Integration" },
      { key: "security_rules", label: "Security & Rate Limiting Rules" },
    ],
  },
  {
    id: "staff_management",
    name: "Staff Management",
    subPermissions: [
      { key: "staff_view", label: "Staff Directory" },
      { key: "staff_create", label: "Add Staff Member" },
      { key: "roles_manage", label: "Roles & Permissions Management" },
      { key: "professionals_manage", label: "Professionals & Cleaners Roster" },
      { key: "team_leads_manage", label: "Team Leads Management" },
      { key: "companies_manage", label: "Partner Companies Management" },
      { key: "supervisors_manage", label: "Field Supervisors Management" },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    subPermissions: [
      { key: "company_profile", label: "Company Information" },
      { key: "tax_vat", label: "VAT & Tax Rules (5% UAE)" },
      { key: "business_hours", label: "Operational Hours & Holidays" },
      { key: "currency_locale", label: "Currency & Localization" },
    ],
  },
  {
    id: "app_intro_screen",
    name: "App Intro Screen",
    subPermissions: [
      { key: "view", label: "View Onboarding Slides" },
      { key: "create", label: "Add Intro Slide" },
      { key: "edit", label: "Edit Screen Graphics & Text" },
      { key: "delete", label: "Remove Intro Screen" },
    ],
  },
  {
    id: "contact_query",
    name: "Contact Query",
    subPermissions: [
      { key: "view", label: "View Customer Inquiries" },
      { key: "reply", label: "Reply to Customer Query" },
      { key: "status_update", label: "Mark Inquiries Resolved" },
      { key: "export", label: "Export Leads / Queries" },
    ],
  },
  {
    id: "language_settings",
    name: "Language Settings",
    subPermissions: [
      { key: "view", label: "View Languages (EN / AR)" },
      { key: "edit_translations", label: "Edit Translation Strings" },
      { key: "rtl_config", label: "RTL / LTR Layout Settings" },
    ],
  },
  {
    id: "web_home_page",
    name: "Web Home Page",
    subPermissions: [
      { key: "hero_banners", label: "Manage Hero Sliders & Banners" },
      { key: "featured_services", label: "Configure Featured Services" },
      { key: "testimonials", label: "Customer Reviews & Testimonials" },
      { key: "footer_links", label: "SEO & Footer Content" },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    subPermissions: [
      { key: "sales_report", label: "Revenue & Sales Reports" },
      { key: "booking_report", label: "Bookings Volume Analysis" },
      { key: "cleaner_payouts", label: "Cleaner & Company Payouts" },
      { key: "export_pdf", label: "Export PDF / CSV Reports" },
    ],
  },
  {
    id: "expired_documents",
    name: "Expired Documents",
    subPermissions: [
      { key: "view", label: "View Compliance Audit Hub" },
      { key: "verify", label: "Approve / Reject Trade Licenses & Passports" },
      { key: "notifications", label: "Trigger Expiry Alert Reminders" },
    ],
  },
  {
    id: "service_management",
    name: "Service Management",
    subPermissions: [
      { key: "categories", label: "Categories Management" },
      { key: "services", label: "Services Catalog & Pricing" },
      { key: "addons", label: "Add-on Options & Extras" },
      { key: "plans", label: "Subscription Plans (Weekly/Monthly)" },
      { key: "service_grouping", label: "Service Grouping & Packages" },
      { key: "coupons", label: "Coupons & Promotional Discounts" },
    ],
  },
  {
    id: "booking_management",
    name: "Booking Management",
    subPermissions: [
      { key: "view", label: "View All Bookings" },
      { key: "create", label: "Manual Booking Entry (Dispatch)" },
      { key: "assign", label: "Assign Cleaner / Team Lead" },
      { key: "reschedule", label: "Reschedule Appointments" },
      { key: "cancel", label: "Cancel & Issue Refunds" },
      { key: "export", label: "Export Bookings Schedule" },
    ],
  },
  {
    id: "material_management",
    name: "Material Management",
    subPermissions: [
      { key: "view_stock", label: "View Inventory & Stock Levels" },
      { key: "add_item", label: "Add New Cleaning Supply / SKU" },
      { key: "adjust_stock", label: "Stock In / Restock Supplies" },
      { key: "material_requests", label: "Approve / Reject Replenishment Orders" },
      { key: "dispatch_materials", label: "Dispatch Supplies to Teams" },
    ],
  },
  {
    id: "reports_analytics",
    name: "Reports & Analytics",
    subPermissions: [
      { key: "kpi_dashboard", label: "Executive KPI Dashboard" },
      { key: "retention_rates", label: "Customer Retention & Churn" },
      { key: "geo_analytics", label: "Abu Dhabi / Dubai Zone Heatmaps" },
    ],
  },
];

interface PermissionMatrixProps {
  permissions: Record<string, Record<string, boolean>>;
  onChange: (permissions: Record<string, Record<string, boolean>>) => void;
}

export function PermissionMatrix({ permissions = {}, onChange }: PermissionMatrixProps) {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleExpand = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Helper to check if a major module is fully checked
  const isModuleAllChecked = (module: MajorModule): boolean => {
    const modPerms = permissions[module.id] || {};
    return module.subPermissions.every((sub) => Boolean(modPerms[sub.key]));
  };

  // Helper to check if a major module has at least one sub-permission checked
  const isModuleSomeChecked = (module: MajorModule): boolean => {
    const modPerms = permissions[module.id] || {};
    return module.subPermissions.some((sub) => Boolean(modPerms[sub.key]));
  };

  // Helper to check if global "Check All" is active
  const isGlobalAllChecked = (): boolean => {
    return MAJOR_PERMISSION_MODULES.every((mod) => isModuleAllChecked(mod));
  };

  const handleGlobalCheckAll = (checked: boolean) => {
    const next: Record<string, Record<string, boolean>> = {};
    MAJOR_PERMISSION_MODULES.forEach((mod) => {
      next[mod.id] = {};
      mod.subPermissions.forEach((sub) => {
        next[mod.id][sub.key] = checked;
      });
    });
    onChange(next);
  };

  const handleModuleToggle = (module: MajorModule, checked: boolean) => {
    const nextMod: Record<string, boolean> = {};
    module.subPermissions.forEach((sub) => {
      nextMod[sub.key] = checked;
    });

    onChange({
      ...permissions,
      [module.id]: nextMod,
    });
  };

  const handleSubPermissionToggle = (moduleId: string, subKey: string, checked: boolean) => {
    const currentMod = permissions[moduleId] || {};
    onChange({
      ...permissions,
      [moduleId]: {
        ...currentMod,
        [subKey]: checked,
      },
    });
  };

  return (
    <div className="space-y-4 pt-1">
      <div>
        <h3 className="text-base font-bold text-slate-800">Permissions Information</h3>
      </div>

      {/* Check All Header */}
      <div className="flex items-center gap-2.5 py-2">
        <Checkbox
          id="perm-check-all"
          checked={isGlobalAllChecked()}
          onCheckedChange={(c) => handleGlobalCheckAll(Boolean(c))}
          className="size-4 rounded border-slate-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
        />
        <label
          htmlFor="perm-check-all"
          className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
        >
          Check All
        </label>
      </div>

      {/* Accordion List of Major Modules */}
      <div className="space-y-2.5">
        {MAJOR_PERMISSION_MODULES.map((module) => {
          const isExpanded = Boolean(expandedModules[module.id]);
          const allChecked = isModuleAllChecked(module);
          const someChecked = isModuleSomeChecked(module);
          const currentModPerms = permissions[module.id] || {};

          return (
            <div
              key={module.id}
              className="border border-slate-200/90 rounded-xl bg-white overflow-hidden shadow-2xs transition-all"
            >
              {/* Major Component Header */}
              <div
                onClick={() => toggleExpand(module.id)}
                className="flex items-center justify-between px-4 py-3.5 bg-white hover:bg-slate-50/70 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Checkbox
                      id={`mod-${module.id}`}
                      checked={allChecked}
                      onCheckedChange={(c) => handleModuleToggle(module, Boolean(c))}
                      className="size-4 rounded border-slate-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                    />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{module.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {someChecked && !allChecked && (
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md">
                      Partial
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="size-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Sub-Components Expandable Area */}
              {isExpanded && (
                <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-100 animate-in fade-in-50 duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {module.subPermissions.map((sub) => {
                      const isSubChecked = Boolean(currentModPerms[sub.key]);

                      return (
                        <label
                          key={sub.key}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200/70 hover:border-cyan-300 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={isSubChecked}
                            onCheckedChange={(c) =>
                              handleSubPermissionToggle(module.id, sub.key, Boolean(c))
                            }
                            className="size-4 rounded border-slate-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                          />
                          <span className="text-xs font-medium text-slate-700 select-none">
                            {sub.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
