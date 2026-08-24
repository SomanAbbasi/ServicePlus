import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteOptionGroup,
  deleteVariant,
  getAdminCatalog,
  getServiceOptionGroups,
  getServiceVariants,
  upsertOptionGroup,
  upsertVariant,
  uploadMedia,
  deleteMedia,
} from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { PageHeader, StatusBadge, ActionIconButton, TableSkeleton } from "@/frontend/components/admin/shell";
import { useAdminQuery } from "@/frontend/components/admin/use-admin-query";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit2,
  Image as ImageIcon,
  Layers,
  Loader2,
  Package,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatMoney, num } from "@/frontend/lib/money";
import { compressImageFile } from "@/frontend/lib/image-compression";
import {
  parseOptionPayload,
  serializeOptionPayload,
  SubOption,
} from "@/frontend/lib/sub-options";

export const Route = createFileRoute("/admin/services/options")({
  validateSearch: (search: Record<string, unknown>) => ({
    serviceId: search.serviceId ? String(search.serviceId) : "",
    groupId: search.groupId ? String(search.groupId) : "",
    optionId: search.optionId ? String(search.optionId) : "",
    action: search.action ? String(search.action) : "",
  }),
  component: AdminServiceOptionsPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60";

function AdminServiceOptionsPage() {
  const searchParams = Route.useSearch();
  const initialServiceId = searchParams.serviceId || "";
  const initialGroupId = searchParams.groupId || "";
  const initialOptionId = searchParams.optionId || "";
  const initialAction = searchParams.action || "";

  const navigate = useNavigate();
  const qc = useQueryClient();

  // Load Catalog to get available services
  const { data: catalogData, isPending: isCatalogPending } = useAdminQuery("catalog", getAdminCatalog);
  const rawServices: Row[] = (catalogData as any)?.services ?? [];
  const services = useMemo(() => {
    return [...rawServices].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [rawServices]);

  // Selected Service State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    return initialServiceId || (services[0]?.id ? String(services[0]?.id) : "");
  });

  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    } else if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(String(services[0].id));
    }
  }, [initialServiceId, services, selectedServiceId]);

  const activeService = useMemo(() => {
    return services.find((s) => String(s.id) === String(selectedServiceId)) || services[0] || null;
  }, [services, selectedServiceId]);

  // Fetch Option Groups & Variants for the active service
  const groupsQuery = useQuery({
    queryKey: ["admin", "option-groups", activeService?.id],
    enabled: Boolean(activeService?.id),
    queryFn: () => getServiceOptionGroups(String(activeService!.id)),
  });

  const variantsQuery = useQuery({
    queryKey: ["admin", "service-variants", activeService?.id],
    enabled: Boolean(activeService?.id),
    queryFn: () => getServiceVariants(String(activeService!.id)),
  });

  const rawGroups = (groupsQuery.data ?? []) as Row[];
  const rawVariants = (variantsQuery.data ?? []) as Row[];

  const groups = useMemo(() => {
    return [...rawGroups].sort((a, b) => (Number(a.sort_order ?? a.sortOrder) || 0) - (Number(b.sort_order ?? b.sortOrder) || 0));
  }, [rawGroups]);

  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => initialGroupId || null);

  useEffect(() => {
    if (initialGroupId && groups.some((g) => g.id === initialGroupId)) {
      setActiveGroupId(initialGroupId);
    } else if (groups.length > 0 && (!activeGroupId || !groups.some((g) => g.id === activeGroupId))) {
      setActiveGroupId(groups[0].id);
    } else if (groups.length === 0) {
      setActiveGroupId(null);
    }
  }, [groups, activeGroupId, initialGroupId]);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0] || null;
  }, [groups, activeGroupId]);

  // Filter options belonging to the active group
  const groupOptions = useMemo(() => {
    if (!selectedGroup) {
      return rawVariants.filter((v) => !v.group_id && !v.groupId);
    }
    return rawVariants.filter((v) => v.group_id === selectedGroup.id || v.groupId === selectedGroup.id);
  }, [rawVariants, selectedGroup]);

  // ==========================================
  // PAGE VIEW STATE (INSTEAD OF POPUP MODALS)
  // viewMode: "list" | "edit-option" | "edit-group"
  // ==========================================
  const [viewMode, setViewMode] = useState<"list" | "edit-option" | "edit-group">(() => {
    if (initialAction === "edit-option" || initialAction === "create-option") return "edit-option";
    if (initialAction === "edit-group" || initialAction === "create-group") return "edit-group";
    return "list";
  });

  // Group Editor State
  const [editingGroup, setEditingGroup] = useState<Row | null>(null);
  const [groupNameEn, setGroupNameEn] = useState("");
  const [groupNameAr, setGroupNameAr] = useState("");
  const [groupImageUrl, setGroupImageUrl] = useState("");
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Option Editor State
  const [editingOption, setEditingOption] = useState<Row | null>(null);
  const [optionTab, setOptionTab] = useState<"en" | "ar">("en");
  const [optionType, setOptionType] = useState<"single" | "package">("single");

  const [optNameEn, setOptNameEn] = useState("");
  const [optNameAr, setOptNameAr] = useState("");
  const [optDescEn, setOptDescEn] = useState("");
  const [optDescAr, setOptDescAr] = useState("");
  const [optPrice, setOptPrice] = useState("0");
  const [optOriginalPrice, setOptOriginalPrice] = useState("");
  const [optDurationMinutes, setOptDurationMinutes] = useState("0");
  const [optMaxQuantity, setOptMaxQuantity] = useState("10");
  const [optImageUrl, setOptImageUrl] = useState("");
  const [optImageFile, setOptImageFile] = useState<File | null>(null);
  const [optIsActive, setOptIsActive] = useState(true);

  // Sub-Options State & Accordion Collapse Set
  const [subOptionsList, setSubOptionsList] = useState<SubOption[]>([]);
  const [collapsedSubIndices, setCollapsedSubIndices] = useState<number[]>([]);
  const [uploadingSubIndex, setUploadingSubIndex] = useState<number | null>(null);
  const [isSavingOption, setIsSavingOption] = useState(false);

  const toggleSubOptionCollapse = (index: number) => {
    setCollapsedSubIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const invalidate = () => {
    if (activeService?.id) {
      void qc.invalidateQueries({ queryKey: ["admin", "option-groups", activeService.id] });
      void qc.invalidateQueries({ queryKey: ["admin", "service-variants", activeService.id] });
      void qc.invalidateQueries({ queryKey: ["admin", "catalog"] });
    }
  };

  // Group Handlers
  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupNameEn("");
    setGroupNameAr("");
    setGroupImageUrl("");
    setGroupImageFile(null);
    setViewMode("edit-group");
  };

  const handleOpenEditGroup = (g: Row) => {
    setEditingGroup(g);
    setGroupNameEn(g.name || "");
    setGroupNameAr(g.name_ar || g.nameAr || "");
    setGroupImageUrl(g.image_url || g.imageUrl || "");
    setGroupImageFile(null);
    setViewMode("edit-group");
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeService?.id) {
      toast.error("Please select a service first");
      return;
    }
    if (!groupNameEn.trim() && !groupNameAr.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      setIsSavingGroup(true);
      let finalImg = groupImageUrl;
      if (groupImageFile) {
        try {
          const comp = await compressImageFile(groupImageFile, { maxDimension: 600, quality: 0.85 });
          const res = await uploadMedia(comp.filename, comp.contentType, comp.base64);
          if (res?.url) finalImg = res.url;
        } catch {}
      }

      await upsertOptionGroup({
        id: editingGroup?.id,
        service_id: activeService.id,
        name: groupNameEn.trim() || groupNameAr.trim(),
        name_ar: groupNameAr.trim() || undefined,
        image_url: finalImg || null,
        is_active: true,
      });

      toast.success(`Option Group "${groupNameEn || groupNameAr}" saved successfully!`);
      setViewMode("list");
      invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save option group");
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (g: Row) => {
    if (confirm(`Are you sure you want to delete group "${g.name}" and un-assign its options?`)) {
      try {
        await deleteOptionGroup(g.id);
        toast.success(`Group "${g.name}" deleted.`);
        invalidate();
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete group");
      }
    }
  };

  // Option Handlers
  const handleOpenAddOption = () => {
    setEditingOption(null);
    setOptionTab("en");
    setOptionType("single");
    setOptNameEn("");
    setOptNameAr("");
    setOptDescEn("");
    setOptDescAr("");
    setOptPrice("");
    setOptOriginalPrice("");
    setOptDurationMinutes("");
    setOptMaxQuantity("10");
    setOptImageUrl("");
    setOptImageFile(null);
    setOptIsActive(true);
    setSubOptionsList([]);
    setCollapsedSubIndices([]);
    setViewMode("edit-option");
  };

  const handleOpenEditOption = (opt: Row) => {
    setEditingOption(opt);
    setOptionTab("en");

    const parsed = parseOptionPayload(opt);
    setOptNameEn(opt.name || "");
    setOptNameAr(opt.name_ar || opt.nameAr || "");
    setOptDescEn(parsed.description || "");
    setOptDescAr(parsed.descriptionAr || "");
    setOptPrice(opt.price !== undefined && opt.price !== null && opt.price !== 0 ? String(opt.price) : "");
    setOptOriginalPrice(opt.original_price ? String(opt.original_price) : (opt.originalPrice ? String(opt.originalPrice) : ""));
    setOptDurationMinutes(opt.duration_minutes ? String(opt.duration_minutes) : (opt.durationMinutes ? String(opt.durationMinutes) : ""));
    setOptMaxQuantity(String(opt.max_quantity ?? opt.maxQuantity ?? 10));
    setOptImageUrl(opt.image_url || opt.imageUrl || "");
    setOptImageFile(null);
    setOptIsActive(opt.is_active ?? opt.isActive ?? true);

    if (parsed.hasSubOptions) {
      setOptionType("package");
      setSubOptionsList(parsed.subOptions);
    } else {
      setOptionType("single");
      setSubOptionsList([]);
    }
    setCollapsedSubIndices([]);
    setViewMode("edit-option");
  };

  const handleAddSubOption = () => {
    const newSub: SubOption = {
      id: "sub_" + Math.random().toString(36).slice(2, 9),
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      price: 0,
      originalPrice: null,
      durationMinutes: 0,
      maxQuantity: 10,
      isActive: true,
    };
    setSubOptionsList((prev) => [...prev, newSub]);
  };

  const handleUpdateSubOption = (index: number, patch: Partial<SubOption>) => {
    setSubOptionsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleRemoveSubOption = (index: number) => {
    setSubOptionsList((prev) => prev.filter((_, i) => i !== index));
    setCollapsedSubIndices((prev) => prev.filter((i) => i !== index));
    toast.success("Sub-option removed");
  };

  const handleSubOptionImageUpload = async (index: number, file: File) => {
    try {
      setUploadingSubIndex(index);
      toast.info("Compressing image...");
      const comp = await compressImageFile(file, { maxDimension: 600, quality: 0.85 });
      let finalUrl = comp.base64;
      try {
        const res = await uploadMedia(comp.filename, comp.contentType, comp.base64);
        if (res?.url) finalUrl = res.url;
      } catch {}
      handleUpdateSubOption(index, { imageUrl: finalUrl });
      toast.success(`Sub-option #${index + 1} image uploaded and compressed!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to compress/upload image");
    } finally {
      setUploadingSubIndex(null);
    }
  };

  const handleOptionImageUpload = async (file: File) => {
    try {
      toast.info("Compressing image...");
      const comp = await compressImageFile(file, { maxDimension: 600, quality: 0.85 });
      setOptImageFile(file);
      let finalUrl = comp.base64;
      try {
        const res = await uploadMedia(comp.filename, comp.contentType, comp.base64);
        if (res?.url) finalUrl = res.url;
      } catch {}
      setOptImageUrl(finalUrl);
      toast.success("Option image compressed successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to compress option image");
    }
  };

  const handleGroupImageUpload = async (file: File) => {
    try {
      toast.info("Compressing group image...");
      const comp = await compressImageFile(file, { maxDimension: 600, quality: 0.85 });
      setGroupImageFile(file);
      let finalUrl = comp.base64;
      try {
        const res = await uploadMedia(comp.filename, comp.contentType, comp.base64);
        if (res?.url) finalUrl = res.url;
      } catch {}
      setGroupImageUrl(finalUrl);
      toast.success("Group image compressed successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to compress group image");
    }
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeService?.id) {
      toast.error("Please select a service first");
      return;
    }
    if (!optNameEn.trim() && !optNameAr.trim()) {
      toast.error("Option name is required");
      return;
    }

    try {
      setIsSavingOption(true);
      let finalImg = optImageUrl;
      if (optImageFile) {
        try {
          const comp = await compressImageFile(optImageFile, { maxDimension: 600, quality: 0.85 });
          const res = await uploadMedia(comp.filename, comp.contentType, comp.base64);
          if (res?.url) finalImg = res.url;
        } catch {}
      }

      const activeSubOptions = optionType === "package" ? subOptionsList.filter((s) => s.name.trim() || s.nameAr?.trim()) : [];
      const serialized = serializeOptionPayload(optDescEn, optDescAr, activeSubOptions);

      const finalPrice = activeSubOptions.length > 0
        ? Math.min(...activeSubOptions.map((s) => Number(s.price) || 0))
        : parseFloat(optPrice) || 0;

      await upsertVariant({
        id: editingOption?.id,
        service_id: activeService.id,
        group_id: selectedGroup?.id || null,
        name: optNameEn.trim() || optNameAr.trim(),
        name_ar: optNameAr.trim() || undefined,
        description: serialized.description,
        description_ar: serialized.description_ar,
        image_url: finalImg || null,
        price: finalPrice,
        original_price: optOriginalPrice ? parseFloat(optOriginalPrice) : null,
        duration_minutes: parseInt(optDurationMinutes) || 0,
        max_quantity: parseInt(optMaxQuantity) || 10,
        is_active: optIsActive,
      });

      toast.success(`Option "${optNameEn || optNameAr}" saved successfully!`);
      setViewMode("list");
      invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save option");
    } finally {
      setIsSavingOption(false);
    }
  };

  const handleDeleteOption = async (opt: Row) => {
    if (confirm(`Delete option "${opt.name}"?`)) {
      try {
        await deleteVariant(opt.id);
        toast.success(`Option "${opt.name}" removed.`);
        invalidate();
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete option");
      }
    }
  };

  // =========================================================================
  // VIEW 1: OPTION GROUP EDITOR (DEDICATED FULL VIEW)
  // =========================================================================
  if (viewMode === "edit-group") {
    return (
      <div className="space-y-6 max-w-3xl mx-auto text-slate-800 pb-12">
        <PageHeader
          title={editingGroup ? `Edit Option Group: ${editingGroup.name}` : "Create New Option Group"}
          description={`Configuring subgroup for ${activeService?.name || "Service"}`}
          breadcrumbs={[
            { label: "Dashboard", to: "/admin" },
            { label: "Services", to: "/admin/services" },
            { label: "Service Options", onClick: () => setViewMode("list") },
            { label: editingGroup ? "Edit Group" : "New Group" },
          ]}
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("list")}
              className="h-10 px-4 rounded-xl border-slate-300 font-bold text-xs"
            >
              <ArrowLeft className="size-4 me-1.5" /> Back to Options
            </Button>
          }
        />

        <Card className="p-6 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-6">
          <form onSubmit={handleSaveGroup} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Group Name (English) *</Label>
                <Input
                  placeholder="e.g. Cockroaches, Deep Cleaning, Sofa Cleaning"
                  value={groupNameEn}
                  onChange={(e) => setGroupNameEn(e.target.value)}
                  className="h-11 text-sm rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Group Name (Arabic)</Label>
                <Input
                  placeholder="e.g. مكافحة الصراصير"
                  value={groupNameAr}
                  onChange={(e) => setGroupNameAr(e.target.value)}
                  dir="rtl"
                  className="h-11 text-sm rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-xs font-bold text-slate-700">Group Image / Icon (Auto-Compressed)</Label>
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                  {groupImageUrl ? (
                    <img
                      src={resolveImageUrl(groupImageUrl)}
                      alt="Group"
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                  ) : (
                    <ImageIcon className="size-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer shadow-xs transition-colors">
                    <Upload className="size-4 text-cyan-600" />
                    <span>{groupImageUrl ? "Change Group Image" : "Upload Group Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleGroupImageUpload(f);
                      }}
                    />
                  </label>
                  {groupImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        if (groupImageUrl) deleteMedia(groupImageUrl).catch(() => {});
                        setGroupImageUrl("");
                        setGroupImageFile(null);
                      }}
                      className="text-xs text-rose-600 hover:underline block font-semibold"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode("list")}
                className="h-11 px-5 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingGroup}
                className="h-11 px-6 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm"
              >
                {isSavingGroup ? <Loader2 className="size-4 animate-spin me-1.5" /> : null}
                Save Option Group
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: OPTION & SUB-OPTIONS DEDICATED EDITOR
  // =========================================================================
  if (viewMode === "edit-option") {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-slate-800 pb-16">
        <PageHeader
          title={editingOption ? `Edit Option: ${editingOption.name}` : "Create Service Option"}
          description={`Group: ${selectedGroup ? selectedGroup.name : "Direct Service Option"} • Service: ${activeService?.name || "Service"}`}
          breadcrumbs={[
            { label: "Dashboard", to: "/admin" },
            { label: "Services", to: "/admin/services" },
            { label: "Service Options", onClick: () => setViewMode("list") },
            { label: editingOption ? "Edit Option" : "New Option" },
          ]}
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("list")}
              className="h-10 px-4 rounded-xl border-slate-300 font-bold text-xs"
            >
              <ArrowLeft className="size-4 me-1.5" /> Back to Options
            </Button>
          }
        />

        <form onSubmit={handleSaveOption} className="space-y-6">
          {/* Main Card with Language Selector Matching Reference Image */}
          <Card className="p-6 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Basic Information</h3>
                <p className="text-xs text-slate-500">Enter bilingual names and descriptions</p>
              </div>

              {/* Language Switcher Pill Matching Reference Image 2 */}
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setOptionTab("en")}
                  className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    optionTab === "en"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setOptionTab("ar")}
                  className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    optionTab === "ar"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Bilingual Content Tab Active */}
            {optionTab === "en" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Option Name (English) *</Label>
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">EN</span>
                  </div>
                  <Input
                    placeholder="e.g. Build Your Own Package, 1 Bedroom Apartment"
                    value={optNameEn}
                    onChange={(e) => setOptNameEn(e.target.value)}
                    className="h-11 text-sm rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Description (English)</Label>
                  <Textarea
                    placeholder="e.g. Pick your pieces, bundle your clean & save more with every item."
                    value={optDescEn}
                    onChange={(e) => setOptDescEn(e.target.value)}
                    rows={2}
                    className="text-xs rounded-xl resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Option Name (Arabic)</Label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">العربية</span>
                  </div>
                  <Input
                    placeholder="e.g. اصنع باقتك بنفسك"
                    value={optNameAr}
                    onChange={(e) => setOptNameAr(e.target.value)}
                    dir="rtl"
                    className="h-11 text-sm rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Description (Arabic)</Label>
                  <Textarea
                    placeholder="e.g. اختر قطعك واحصل على خصم أكبر مع كل قطعة."
                    value={optDescAr}
                    onChange={(e) => setOptDescAr(e.target.value)}
                    rows={2}
                    dir="rtl"
                    className="text-xs rounded-xl resize-none"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Option Structure Selector Card */}
          <Card className="p-6 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Option Structure & Type</h3>
              <p className="text-xs text-slate-500">Choose whether this option has a fixed flat price or contains selectable package items</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setOptionType("single")}
                className={`p-4 rounded-2xl border text-start transition-all ${
                  optionType === "single"
                    ? "border-cyan-500 bg-cyan-50/20 shadow-xs ring-2 ring-cyan-500/10 font-bold text-cyan-950"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600 font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full border-2 border-cyan-500 flex items-center justify-center">
                    {optionType === "single" && <div className="size-1.5 bg-cyan-500 rounded-full" />}
                  </div>
                  <p className="text-sm font-extrabold">Standard Single Option</p>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-5">Fixed price & duration directly selectable in the booking flow.</p>
              </button>

              <button
                type="button"
                onClick={() => setOptionType("package")}
                className={`p-4 rounded-2xl border text-start transition-all ${
                  optionType === "package"
                    ? "border-purple-500 bg-purple-50/20 shadow-xs ring-2 ring-purple-500/10 font-bold text-purple-950"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600 font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full border-2 border-purple-500 flex items-center justify-center">
                    {optionType === "package" && <div className="size-1.5 bg-purple-500 rounded-full" />}
                  </div>
                  <p className="text-sm font-extrabold">Multi-Option Package</p>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-5">Contains custom sub-options (e.g. 3-Piece, 5-Piece, 7-Piece packages).</p>
              </button>
            </div>

            {/* If Single: Flat Pricing */}
            {optionType === "single" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Price (AED) *</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={optPrice}
                    onChange={(e) => setOptPrice(e.target.value)}
                    className="h-11 text-sm rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Original Price (AED)</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Optional strikethrough"
                    value={optOriginalPrice}
                    onChange={(e) => setOptOriginalPrice(e.target.value)}
                    className="h-11 text-sm rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={optDurationMinutes}
                    onChange={(e) => setOptDurationMinutes(e.target.value)}
                    className="h-11 text-sm rounded-xl"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* If Package / Multi-Option: Sub-options Builder Matching Reference Image 1 */}
          {optionType === "package" && (
            <Card className="p-6 bg-white border-purple-200/90 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3.5">
                <div>
                  <h3 className="text-sm font-extrabold text-purple-950">Sub-Options / Package Items</h3>
                  <p className="text-xs text-purple-700">
                    When added, these popup inside a modal when customers click "Add +"
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddSubOption}
                  className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <Plus className="size-4 me-1.5" /> Add Sub-Option
                </Button>
              </div>

              {subOptionsList.length === 0 ? (
                <div className="p-8 text-center bg-purple-50/20 rounded-2xl border border-dashed border-purple-200">
                  <p className="text-xs font-bold text-slate-600">No sub-options added yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Click "+ Add Sub-Option" to define choices.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {subOptionsList.map((sub, idx) => {
                    const isCollapsed = collapsedSubIndices.includes(idx);
                    return (
                      <div
                        key={sub.id || idx}
                        className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 transition-all"
                      >
                        {/* Header with Title + Expand/Collapse + Delete */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-purple-700">Sub-Option #{idx + 1}</span>
                            {sub.name && (
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[280px]">
                                ({sub.name})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleSubOptionCollapse(idx)}
                              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title={isCollapsed ? "Expand" : "Collapse"}
                            >
                              {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubOption(idx)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                              title="Delete Sub-Option"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Body Matching Reference Image 1 */}
                        {!isCollapsed && (
                          <div className="space-y-3.5 pt-1">
                            {/* Row 1: Bilingual Titles */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase text-slate-500">English Title *</span>
                                  <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">EN</span>
                                </div>
                                <Input
                                  placeholder="e.g. Build Your Own Package (3-Piece)"
                                  value={sub.name}
                                  onChange={(e) => handleUpdateSubOption(idx, { name: e.target.value })}
                                  className="h-10 text-xs rounded-xl"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase text-slate-500">Arabic Title</span>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">العربية</span>
                                </div>
                                <Input
                                  placeholder="e.g. باقة اصنع بنفسك (٣ قطع)"
                                  value={sub.nameAr || ""}
                                  onChange={(e) => handleUpdateSubOption(idx, { nameAr: e.target.value })}
                                  dir="rtl"
                                  className="h-10 text-xs rounded-xl"
                                />
                              </div>
                            </div>

                            {/* Row 2: Bilingual Descriptions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase text-slate-500">English Description</span>
                                <Textarea
                                  placeholder="e.g. Pick any 3 furniture items for deep cleaning in one bundle."
                                  value={sub.description || ""}
                                  onChange={(e) => handleUpdateSubOption(idx, { description: e.target.value })}
                                  rows={2}
                                  className="text-xs rounded-xl resize-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Arabic Description</span>
                                <Textarea
                                  placeholder="e.g. اختر أي ٣ قطع أثاث للتنظيف العميق في باقة موفرة واحدة."
                                  value={sub.descriptionAr || ""}
                                  onChange={(e) => handleUpdateSubOption(idx, { descriptionAr: e.target.value })}
                                  rows={2}
                                  dir="rtl"
                                  className="text-xs rounded-xl resize-none"
                                />
                              </div>
                            </div>

                            {/* Row 3: Compressed Image Upload + Pricing & Duration Matching Image 1 */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-100">
                              {/* Image Upload Box */}
                              <div className="sm:col-span-5 space-y-1">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Sub-Option Image (Auto-Compressed)</span>
                                <div className="flex items-center gap-2.5">
                                  <div className="size-12 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center relative">
                                    {uploadingSubIndex === idx ? (
                                      <Loader2 className="size-5 animate-spin text-purple-600" />
                                    ) : sub.imageUrl ? (
                                      <img
                                        src={resolveImageUrl(sub.imageUrl)}
                                        alt={sub.name || "Sub-option"}
                                        className="size-full object-cover"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                                        }}
                                      />
                                    ) : (
                                      <ImageIcon className="size-5 text-slate-400" />
                                    )}
                                  </div>

                                  <div className="flex-1 space-y-1">
                                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer shadow-2xs transition-colors">
                                      <Upload className="size-3.5 text-purple-600" />
                                      <span>{sub.imageUrl ? "Change Image" : "Upload Image"}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) void handleSubOptionImageUpload(idx, f);
                                        }}
                                      />
                                    </label>
                                    {sub.imageUrl && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (sub.imageUrl) deleteMedia(sub.imageUrl).catch(() => {});
                                          handleUpdateSubOption(idx, { imageUrl: "" });
                                        }}
                                        className="text-[10px] text-rose-600 hover:underline block font-semibold"
                                      >
                                        Remove image
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Pricing & Duration */}
                              <div className="sm:col-span-7 grid grid-cols-3 gap-2">
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-500">Price (AED) *</span>
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    value={sub.price === 0 || sub.price === null || sub.price === undefined ? "" : sub.price}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleUpdateSubOption(idx, { price: val === "" ? 0 : parseFloat(val) || 0 });
                                    }}
                                    className="h-10 text-xs font-bold rounded-xl"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-500">Original (AED)</span>
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="Original"
                                    value={sub.originalPrice === null || sub.originalPrice === undefined || sub.originalPrice === 0 ? "" : sub.originalPrice}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleUpdateSubOption(idx, {
                                        originalPrice: val === "" ? null : parseFloat(val) || null,
                                      });
                                    }}
                                    className="h-10 text-xs rounded-xl"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-500">Duration (min)</span>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={sub.durationMinutes === 0 || sub.durationMinutes === null || sub.durationMinutes === undefined ? "" : sub.durationMinutes}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleUpdateSubOption(idx, {
                                        durationMinutes: val === "" ? 0 : parseInt(val, 10) || 0,
                                      });
                                    }}
                                    className="h-10 text-xs rounded-xl"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Option Image & Status Card */}
          <Card className="p-6 bg-white border-slate-200/90 rounded-2xl shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Option Thumbnail Image (Auto-Compressed)</Label>
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {optImageUrl ? (
                      <img
                        src={resolveImageUrl(optImageUrl)}
                        alt="Option"
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                      />
                    ) : (
                      <ImageIcon className="size-7 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer shadow-xs transition-colors">
                      <Upload className="size-4 text-cyan-600" />
                      <span>{optImageUrl ? "Change Option Image" : "Upload Option Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleOptionImageUpload(f);
                        }}
                      />
                    </label>
                    {optImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          if (optImageUrl) deleteMedia(optImageUrl).catch(() => {});
                          setOptImageUrl("");
                          setOptImageFile(null);
                        }}
                        className="text-xs text-rose-600 hover:underline block font-semibold"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <Label className="text-xs font-bold text-slate-800">Status</Label>
                  <p className="text-[11px] text-slate-500">Enable in customer booking flow</p>
                </div>
                <Switch checked={optIsActive} onCheckedChange={setOptIsActive} />
              </div>
            </div>
          </Card>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("list")}
              className="h-11 px-6 text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSavingOption}
              className="h-11 px-8 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm"
            >
              {isSavingOption ? <Loader2 className="size-4 animate-spin me-1.5" /> : null}
              Save Service Option
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: OVERVIEW & OPTIONS LIST (DEFAULT VIEW)
  // =========================================================================
  return (
    <div className="space-y-6 text-slate-800 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Service Options Management"
        description="Configure option groups, package choices, and nested sub-options for service offerings"
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Services Management", to: "/admin/services" },
          { label: "Service Options" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/services"
              className="h-10 px-4 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors"
            >
              Back to Services
            </Link>
            <Button
              type="button"
              onClick={handleOpenAddGroup}
              className="h-10 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
            >
              <Plus className="size-4 me-1.5" /> Add Group
            </Button>
          </div>
        }
      />

      {/* Service Selector Topbar */}
      <Card className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
            <Package className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Managing Options For
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {activeService?.name || "Select Service"}
            </h3>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={selectedServiceId}
            onValueChange={(val) => {
              setSelectedServiceId(val);
              navigate({
                to: "/admin/services/options",
                search: { serviceId: val },
              });
            }}
          >
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white">
              <SelectValue placeholder="Choose a service..." />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {services.map((s) => (
                <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Section 1: Option Groups Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Option Groups</h2>
            <p className="text-xs text-slate-500">
              Pick an option group to view and manage its member options and packages
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenAddGroup}
            className="h-9 px-3.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl"
          >
            <Plus className="size-3.5 me-1.5 text-cyan-600" /> Add Group
          </Button>
        </div>

        {groupsQuery.isPending ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="size-12 rounded-full bg-cyan-50 text-cyan-600 grid place-items-center mx-auto mb-3">
              <Layers className="size-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No option groups created yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Option groups organize your service choices into tiles (e.g. Cockroaches, Mosquitoes, Bed Bugs).
            </p>
            <Button
              type="button"
              onClick={handleOpenAddGroup}
              className="mt-4 h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs"
            >
              <Plus className="size-3.5 me-1.5" /> Create First Group
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {groups.map((g) => {
                const isSelected = selectedGroup?.id === g.id;
                const count = rawVariants.filter((v) => v.group_id === g.id || v.groupId === g.id).length;
                const img = resolveImageUrl(g.image_url || g.imageUrl) || FALLBACK_IMAGE;

                return (
                  <div
                    key={g.id}
                    onClick={() => setActiveGroupId(g.id)}
                    className={`group relative rounded-2xl p-2.5 bg-white border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      isSelected
                        ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm"
                        : "border-slate-200/90 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="h-24 rounded-xl overflow-hidden bg-slate-100 relative border border-slate-100">
                        <img
                          src={img}
                          alt={g.name}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">{g.name}</h4>
                        {(g.name_ar || g.nameAr) && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5" dir="rtl">
                            {g.name_ar || g.nameAr}
                          </p>
                        )}
                        <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                          {count} {count === 1 ? "option" : "options"}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditGroup(g);
                          }}
                          className="text-xs font-bold text-cyan-600 hover:text-cyan-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(g);
                          }}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Options in Selected Group */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Options in {selectedGroup ? `"${selectedGroup.name}"` : "Service"}
            </h2>
            <p className="text-xs text-slate-500">
              Manage items, prices, durations, and multi-piece package sub-options
            </p>
          </div>
          <Button
            type="button"
            onClick={handleOpenAddOption}
            className="h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
          >
            <Plus className="size-3.5 me-1.5" /> Add Option
          </Button>
        </div>

        {/* Options List Card */}
        <Card className="bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
          {variantsQuery.isPending ? (
            <div className="p-6">
              <TableSkeleton rows={4} />
            </div>
          ) : groupOptions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">No options in this group yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "+ Add Option" above to add your first priced item or multi-option package.
              </p>
            </div>
          ) : (
            groupOptions.map((opt: Row) => {
              const parsed = parseOptionPayload(opt);
              const img = resolveImageUrl(opt.image_url || opt.imageUrl) || FALLBACK_IMAGE;
              const hasSubs = parsed.hasSubOptions;

              return (
                <div
                  key={opt.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center">
                      <img
                        src={img}
                        alt={opt.name}
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                          {opt.name}
                        </h4>
                        {hasSubs && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {parsed.subOptions.length} Options
                          </span>
                        )}
                      </div>

                      {(opt.name_ar || opt.nameAr) && (
                        <p className="text-xs text-slate-400 font-normal truncate" dir="rtl">
                          {opt.name_ar || opt.nameAr}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        {hasSubs ? (
                          <span className="text-cyan-700 font-bold">
                            Starts at AED {Number(parsed.lowestPrice).toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-slate-800 font-bold">
                            AED {Number(opt.price || 0).toFixed(0)}
                          </span>
                        )}
                        <span>•</span>
                        <span>{Number(opt.duration_minutes || opt.durationMinutes || 0)} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditOption(opt)}
                      className="h-8 text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                    >
                      <Edit2 className="size-3.5 me-1.5" /> Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOption(opt)}
                      className="h-8 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="size-3.5 me-1.5" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
