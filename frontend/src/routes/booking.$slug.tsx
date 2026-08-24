import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard as CardIcon,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FALLBACK_IMAGE } from "@/frontend/components/icons";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { isInDubai, SERVICE_AREA_MESSAGE } from "@/frontend/lib/service-area";
import { LocationPicker } from "@/frontend/components/LocationPicker";
import { useSavedLocation } from "@/frontend/lib/location";
import { AccountAuthModal } from "@/frontend/components/AccountAuthModal";
import { useAuth } from "@/frontend/lib/auth-context";
import {
  getServiceDetail,
  getQuote,
  getAvailability,
  getMyAddresses,
  createAddress,
  createBooking,
  searchPlaces,
} from "@/frontend/lib/api-services";
import { upcomingDates } from "@/frontend/lib/availability";
import { formatMoney } from "@/frontend/lib/money";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useSession } from "@/frontend/lib/use-session";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { useLocale } from "@/frontend/lib/locale";
import { localizedText } from "@/frontend/lib/i18n-content";
import { parseOptionPayload, SubOption } from "@/frontend/lib/sub-options";

export const Route = createFileRoute("/booking/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    variants: search.variants ? String(search.variants) : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: "Book your service — ServicePlus" },
      {
        name: "description",
        content: "Choose your options, slot and address to confirm your ServicePlus booking.",
      },
      { property: "og:title", content: "Book your service — ServicePlus" },
      { property: "og:description", content: "Transparent pricing and instant confirmation." },
      { property: "og:url", content: `/booking/${params.slug}` },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `/booking/${params.slug}` }],
  }),
  component: BookingWizard,
});

/** Helper to get current live Dubai time & date */
function getDubaiNow() {
  const now = new Date();
  const dubaiStr = now.toLocaleString("en-US", { timeZone: "Asia/Dubai" });
  const d = new Date(dubaiStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  const currentHour = d.getHours();
  return { todayStr, currentHour };
}

const FREQUENCY_LIST = [
  { id: "one_time", title: "One Time", titleAr: "مرة واحدة", badge: null, badgeAr: null, popular: false },
  { id: "every_2_weeks", title: "Every 2 Weeks", titleAr: "كل أسبوعين", badge: "5% Off", badgeAr: "خصم 5%", popular: false },
  { id: "once_a_week", title: "Once a Week", titleAr: "مرة كل أسبوع", badge: "10% Off", badgeAr: "خصم 10%", popular: true },
  { id: "multiple_times_a_week", title: "Multiple Times a Week", titleAr: "عدة مرات في الأسبوع", badge: "Up to 25% off", badgeAr: "خصم حتى 25%", popular: false },
];

function BookingWizard() {
  const { slug } = Route.useParams();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const isAr = locale === "ar";
  const { session } = useSession();
  const { user, token } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addrResults, setAddrResults] = useState<
    Array<{ id: string; name: string; address: string; lat: number; lng: number }>
  >([]);

  const [step, setStep] = useState(0);
  const [hours, setHours] = useState(2);
  const [professionals, setProfessionals] = useState(1);
  const [materials, setMaterials] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [selectedAddonDetail, setSelectedAddonDetail] = useState<any | null>(null);
  const [optionQty, setOptionQty] = useState<Record<string, number>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Initialize optionQty from search params if passed (from ServiceOptionsModal)
  useEffect(() => {
    if (searchParams?.variants) {
      const parsed: Record<string, number> = {};
      const pairs = searchParams.variants.split(",");
      for (const pair of pairs) {
        const [id, qtyStr] = pair.split(":");
        if (id) {
          parsed[id] = Number(qtyStr) || 1;
        }
      }
      if (Object.keys(parsed).length > 0) {
        setOptionQty((prev) => ({ ...prev, ...parsed }));
      }
    }
  }, [searchParams?.variants]);

  // Scroll references for date & time sliders
  const dateSliderRef = useRef<HTMLDivElement>(null);
  const timeSliderRef = useRef<HTMLDivElement>(null);

  // Dubai Timezone Date & Slot setup
  const { todayStr, currentHour } = useMemo(() => getDubaiNow(), []);
  const availableDates = useMemo(() => upcomingDates(14), []);
  const [date, setDate] = useState(availableDates[0]!);
  const [slotStart, setSlotStart] = useState<string | null>(null);

  const [addressId, setAddressId] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const { save: saveLocation, location: savedLoc } = useSavedLocation();

  // Frequency Modal & Draft State
  const [frequency, setFrequency] = useState("one_time");
  const [freqOpen, setFreqOpen] = useState(false);
  const [freqDraft, setFreqDraft] = useState("one_time");
  const [freqAutoShown, setFreqAutoShown] = useState(false);

  // Policy Modal
  const [policyOpen, setPolicyOpen] = useState(false);

  // Order Success Modal State
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    open: boolean;
    bookingNumber: string;
    total: number;
  } | null>(null);

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Phone & OTP Checkout Verification
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState("card"); // card
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [idempotencyKey] = useState(() => `bk_${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState<string | null>(null);

  const { data: detail, isPending: isDetailPending } = useQuery({
    queryKey: ["service", slug],
    queryFn: () => getServiceDetail(slug),
  });

  const addons = (detail?.addons ?? []) as any[];
  const hasAddons = addons.length > 0;
  const totalSteps = hasAddons ? 5 : 4;

  // Auto-pop frequency modal when entering date/time step for the first time
  useEffect(() => {
    if (step === 2 && !freqAutoShown) {
      setFreqDraft(frequency);
      setFreqOpen(true);
      setFreqAutoShown(true);
    }
  }, [step, freqAutoShown, frequency]);

  // Always scroll to top on step or slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step, slug]);

  const addonPayload = useMemo(() => addonIds.map((id) => ({ id, quantity: 1 })), [addonIds]);

  const [selectedPackageOption, setSelectedPackageOption] = useState<any | null>(null);

  const optionGroups: any[] = useMemo(() => {
    return (detail as any)?.optionGroups ?? (detail as any)?.option_groups ?? [];
  }, [detail]);

  const allVariants: any[] = useMemo(() => {
    return (detail as any)?.variants ?? [];
  }, [detail]);

  const ungroupedOptions = useMemo(() => {
    return allVariants.filter((v) => !v.group_id && !v.groupId);
  }, [allVariants]);

  const hasOptions = optionGroups.length > 0 || allVariants.length > 0;

  const activeSelectedGroup = useMemo(() => {
    if (activeGroup) {
      return optionGroups.find((g) => String(g.id) === String(activeGroup)) || null;
    }
    return optionGroups[0] || null;
  }, [activeGroup, optionGroups]);

  const selectedGroupId = activeSelectedGroup?.id ?? null;

  const visibleOptions = useMemo(() => {
    if (selectedGroupId) {
      const foundGroup = optionGroups.find((g) => String(g.id) === String(selectedGroupId));
      if (foundGroup?.options && foundGroup.options.length > 0) {
        return foundGroup.options;
      }
      const matched = allVariants.filter(
        (v) => String(v.group_id) === String(selectedGroupId) || String(v.groupId) === String(selectedGroupId)
      );
      if (matched.length > 0) return matched;
    }
    if (optionGroups.length > 0) {
      const first = optionGroups[0];
      if (first?.options && first.options.length > 0) {
        return first.options;
      }
      const matched = allVariants.filter(
        (v) => String(v.group_id) === String(first.id) || String(v.groupId) === String(first.id)
      );
      if (matched.length > 0) return matched;
    }
    return ungroupedOptions.length > 0 ? ungroupedOptions : allVariants;
  }, [selectedGroupId, optionGroups, allVariants, ungroupedOptions]);

  const allOptionsAndSubOptions = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        nameAr?: string;
        price: number;
        durationMinutes?: number;
        description?: string;
        imageUrl?: string;
        groupName?: string;
        groupNameAr?: string;
      }
    >();
    allVariants.forEach((v: any) => {
      const vGroup = optionGroups.find((g) => String(g.id) === String(v.group_id || v.groupId));
      map.set(String(v.id), {
        id: String(v.id),
        name: v.name,
        nameAr: v.name_ar || v.nameAr,
        price: Number(v.price || 0),
        durationMinutes: Number(v.duration_minutes || v.durationMinutes || 0),
        description: v.description,
        imageUrl: v.image_url || v.imageUrl,
        groupName: vGroup?.name,
        groupNameAr: vGroup?.name_ar || vGroup?.nameAr,
      });
      const parsed = parseOptionPayload(v);
      parsed.subOptions.forEach((sub) => {
        map.set(String(sub.id), {
          id: String(sub.id),
          name: `${v.name} - ${sub.name}`,
          nameAr: `${v.name_ar || v.nameAr || v.name} - ${sub.nameAr || sub.name}`,
          price: Number(sub.price || 0),
          durationMinutes: Number(sub.durationMinutes || 0),
          description: sub.description,
          imageUrl: sub.imageUrl,
          groupName: vGroup?.name,
          groupNameAr: vGroup?.name_ar || vGroup?.nameAr,
        });
      });
    });
    return map;
  }, [allVariants, optionGroups]);

  const variantPayload = useMemo(
    () =>
      Object.entries(optionQty)
        .filter(([, q]) => q > 0)
        .map(([id, quantity]) => ({ id, quantity })),
    [optionQty],
  );

  const totalOptionsDurationMinutes = useMemo(() => {
    let totalMin = 0;
    Object.entries(optionQty).forEach(([vId, q]) => {
      if (q > 0) {
        const v = allOptionsAndSubOptions.get(vId) || allVariants.find((item: any) => item.id === vId);
        if (v && v.durationMinutes) {
          totalMin += Number(v.durationMinutes) * q;
        } else if (v && (v.duration_minutes || v.durationMinutes)) {
          totalMin += Number(v.duration_minutes || v.durationMinutes) * q;
        }
      }
    });
    return totalMin;
  }, [optionQty, allOptionsAndSubOptions, allVariants]);

  const setQty = (id: string, next: number) =>
    setOptionQty((prev) => {
      const copy = { ...prev };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const { data: quote } = useQuery({
    queryKey: [
      "quote",
      slug,
      hours,
      professionals,
      materials,
      appliedCoupon,
      frequency,
      addonIds.join(","),
      JSON.stringify(variantPayload),
    ],
    queryFn: () =>
      getQuote({
        serviceSlug: slug,
        hours,
        professionals,
        materials,
        variantIds: variantPayload,
        addonIds: addonPayload,
        couponCode: appliedCoupon || null,
        frequency,
      }),
  });

  const duration = quote?.duration_minutes ?? 120;

  const { data: availability } = useQuery({
    queryKey: ["availability", date, duration],
    queryFn: () => getAvailability(date, duration),
    enabled: step >= (hasAddons ? 2 : 1),
  });

  // Filter slots for Dubai time validation
  const validSlots = useMemo(() => {
    const rawSlots = (availability?.slots ?? []) as any[];
    if (date === todayStr) {
      return rawSlots.filter((slot) => {
        const slotHour = parseInt(slot.start.split(":")[0], 10);
        return slotHour > currentHour;
      });
    }
    return rawSlots;
  }, [availability, date, todayStr, currentHour]);

  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => getMyAddresses(),
    enabled: Boolean(session),
  });

  const confirm = useMutation({
    mutationFn: async () => {
      let finalAddressId = addressId;
      if (!finalAddressId && (manualAddress.trim() || savedLoc?.address)) {
        try {
          const row = await createAddress({
            label: "Home",
            street: manualAddress.trim() || savedLoc?.address || "Dubai, UAE",
          });
          finalAddressId = row.id;
        } catch {
          finalAddressId = "addr_guest_dubai";
        }
      }

      return createBooking({
        serviceSlug: slug,
        hours,
        professionals,
        materials,
        variantIds: variantPayload,
        addonIds: addonPayload,
        couponCode: appliedCoupon || null,
        frequency,
        addressId: finalAddressId || "addr_guest_dubai",
        scheduledDate: date,
        scheduledStart: slotStart || "17:30",
        instructions: instructions || undefined,
        paymentMethod,
        idempotencyKey,
      });
    },
    onSuccess: (res: any) => {
      const bookingNum = res?.bookingNumber || "SP-BOOKING";
      const totalAmount = Number((quote?.breakdown as any)?.total || 0);
      toast.success(
        isAr ? `تم إرسال الطلب بنجاح! (رقم المرجع: ${bookingNum})` : `Order placed successfully! (Ref: ${bookingNum})`,
        { duration: 5000 }
      );
      setOrderSuccessModal({
        open: true,
        bookingNumber: bookingNum,
        total: totalAmount,
      });
    },
    onError: (err) => setError(err instanceof Error ? err.message : t("booking.failed")),
  });

  // Handle Apply Coupon
  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    setAppliedCoupon(couponInput.trim().toUpperCase());
    toast.success(isAr ? "تم تطبيق كود الخصم!" : `Coupon "${couponInput.trim().toUpperCase()}" applied!`);
  };

  // Handle OTP Send
  const handleSendOtp = () => {
    if (phone.trim().length < 8) {
      toast.error(isAr ? "أدخل رقم هاتف صحيح" : "Please enter a valid phone number");
      return;
    }
    setOtpSending(true);
    setTimeout(() => {
      setOtpSending(false);
      setOtpSent(true);
      toast.info(isAr ? "رمز التحقق التجريبي هو 123456" : "Demo verification OTP sent: 123456");
    }, 600);
  };

  // Handle OTP Verify
  const handleVerifyOtp = () => {
    if (otpCode.trim() === "123456" || otpCode.trim().length === 6) {
      setPhoneVerified(true);
      toast.success(isAr ? "تم التحقق من رقم الهاتف بنجاح" : "Phone number verified successfully!");
    } else {
      toast.error(isAr ? "رمز التحقق غير صحيح (رمز العرض التجريبي: 123456)" : "Invalid OTP code (Demo OTP: 123456)");
    }
  };

  // Slider Scroll Handler
  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    if (ref.current) {
      const amount = dir === "left" ? -220 : 220;
      ref.current.scrollBy({ left: isAr ? -amount : amount, behavior: "smooth" });
    }
  };

  // Step Advancement logic
  const goNext = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (step === 0) {
      setStep(hasAddons ? 1 : 2);
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (step === 2 && !hasAddons) {
      setStep(0);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  };

  const currentStepNumber = useMemo(() => {
    if (!hasAddons) {
      if (step === 0) return 1;
      if (step === 2) return 2;
      if (step === 3) return 3;
      if (step === 4) return 4;
      return 1;
    }
    return step + 1;
  }, [step, hasAddons]);

  const svcObj = (detail?.service ?? {}) as any;
  const isHourlyBooking = svcObj.booking_type === "hourly" || svcObj.bookingType === "hourly" || !hasOptions;
  const minH = Math.max(1, Number(svcObj.min_hours ?? svcObj.minHours ?? 1));
  const maxH = Math.max(minH, Number(svcObj.max_hours ?? svcObj.maxHours ?? 8));
  const hoursList = useMemo(() => {
    const list: number[] = [];
    for (let i = minH; i <= maxH; i++) list.push(i);
    return list.length ? list : [1, 2, 3, 4, 5, 6, 7, 8];
  }, [minH, maxH]);

  const maxPros = Math.max(1, Number(svcObj.max_professionals ?? svcObj.maxProfessionals ?? 4));
  const prosList = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= maxPros; i++) list.push(i);
    return list.length ? list : [1, 2, 3, 4];
  }, [maxPros]);

  const svcMaterialsPrice = Number(svcObj.materials_price ?? svcObj.materialsPrice ?? 0);
  const materialsLabel = isAr
    ? (svcObj.materials_label_ar || svcObj.materialsLabelAr || "هل تحتاج مواد تنظيف؟")
    : (svcObj.materials_label_en || svcObj.materialsLabelEn || "Need cleaning materials?");

  const canContinue = useMemo(() => {
    if (step === 0 && !isHourlyBooking) return variantPayload.length > 0;
    if (step === 2) return Boolean(slotStart);
    if (step === 3) return Boolean(addressId || manualAddress.trim() || savedLoc?.address);
    return true;
  }, [step, isHourlyBooking, slotStart, addressId, manualAddress, savedLoc, variantPayload.length]);

  const serviceTitle = (localizedText(svcObj, "name", locale) ?? (svcObj.name as string) ?? (isAr ? "تنظيف المنازل" : "Home Cleaning")) as string;
  const displayAddress =
    manualAddress.trim() || (savedLoc?.address ? savedLoc.address : (isAr ? "دبي، الإمارات العربية المتحدة" : "Dubai, UAE"));

  const formattedTimeRange = useMemo(() => {
    if (!slotStart) return "17:30-18:00";
    const parts = slotStart.split(":").map(Number);
    const h = parts[0] ?? 17;
    const m = parts[1] ?? 30;
    const endM = (m + 30) % 60;
    const endH = h + (m + 30 >= 60 ? 1 : 0);
    const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    return `${slotStart}-${endStr}`;
  }, [slotStart]);

  const formattedDateString = useMemo(() => {
    const dObj = new Date(date);
    const day = dObj.getDate();
    const month = dObj.toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short" });
    const year = dObj.getFullYear();
    return `${day} ${month} ${year}`;
  }, [date, isAr]);

  const frequencyTitle = useMemo(() => {
    const found = FREQUENCY_LIST.find((f) => f.id === frequency);
    if (isAr) {
      return found ? (found.id === "one_time" ? "خدمة مرة واحدة" : found.titleAr) : "خدمة مرة واحدة";
    }
    return found ? `${found.title} Service` : "One Time Service";
  }, [frequency, isAr]);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-slate-50/60 pb-16 pt-6 overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header / Back Link */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-cyan-600 transition-colors"
          >
            {isAr ? <ChevronRight className="size-4" /> : <ArrowLeft className="size-4" />}
            <span>
              {isAr ? `الخطوة ${currentStepNumber} من ${totalSteps}` : `Step ${currentStepNumber} of ${totalSteps}`}
            </span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {serviceTitle}
            </h1>
            {(detail?.service as any)?.rating ? (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{String((detail!.service as any).rating)}</span>
                </div>
                <span>
                  ({(detail!.service as any).reviewCount ? String((detail!.service as any).reviewCount) : "28,557"}{" "}
                  {isAr ? "حجزًا" : "bookings"})
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] items-start min-w-0">
          {/* Main Booking Controls Left Column */}
          <div className="space-y-6 min-w-0">
            {/* STEP 1: Details or Deep Cleaning Multi-Group Option Selector */}
            {step === 0 && (
              <section className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                {isDetailPending || !detail ? (
                  <div className="space-y-6 animate-pulse">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="size-12 rounded-xl bg-slate-200 shrink-0" />
                      <div className="size-12 rounded-xl bg-slate-200 shrink-0" />
                      <div className="size-12 rounded-xl bg-slate-200 shrink-0" />
                      <div className="size-12 rounded-xl bg-slate-200 shrink-0" />
                    </div>
                    <div className="space-y-4">
                      <div className="h-24 rounded-2xl bg-slate-100" />
                      <div className="h-24 rounded-2xl bg-slate-100" />
                    </div>
                  </div>
                ) : hasOptions && !isHourlyBooking ? (
                  <div className="space-y-6">
                    {/* Horizontal Group Selector Carousel (Matching Reference Image 2) */}
                    {optionGroups.length > 0 && (
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                        {optionGroups.map((g) => {
                          const isGroupSelected = String(selectedGroupId) === String(g.id);
                          const groupImg = resolveImageUrl(g.imageUrl || g.image_url) || FALLBACK_IMAGE;
                          const groupName = localizedText(g, "name", locale) ?? g.name;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setActiveGroup(g.id)}
                              className={`flex flex-col items-center p-2 rounded-2xl border transition-all shrink-0 text-center snap-start w-24 sm:w-28 cursor-pointer select-none ${
                                isGroupSelected
                                  ? "border-cyan-500 bg-cyan-50/70 ring-2 ring-cyan-500/30 shadow-xs font-extrabold text-cyan-950"
                                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-bold shadow-2xs"
                              }`}
                            >
                              <div className="size-16 sm:size-20 rounded-xl overflow-hidden bg-slate-100 mb-1.5 border border-slate-100 flex items-center justify-center">
                                <img src={groupImg} alt={groupName} className="size-full object-cover" />
                              </div>
                              <span className="text-xs font-bold leading-tight truncate w-full px-1">{groupName}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Active Group Title Header (Matching Reference Image 2) */}
                    {activeSelectedGroup && (
                      <div className="pt-1 pb-1">
                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          {localizedText(activeSelectedGroup, "name", locale) ?? activeSelectedGroup.name}
                        </h2>
                      </div>
                    )}

                    {/* Visible Package Options under Active Group */}
                    <div className="space-y-3 pt-1">
                      {visibleOptions.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          {isAr ? "لا توجد خيارات متاحة في هذه المجموعة حالياً." : "No options available in this group."}
                        </div>
                      ) : (
                        visibleOptions.map((opt: any) => {
                          const parsed = parseOptionPayload(opt);
                          const hasSubs = parsed.hasSubOptions;
                          const optImg = resolveImageUrl(opt.imageUrl || opt.image_url) || FALLBACK_IMAGE;
                          const optOriginal = opt.originalPrice || opt.original_price;
                          const optDuration = opt.durationMinutes || opt.duration_minutes;
                          const optName = localizedText(opt, "name", locale) ?? opt.name;
                          const optDesc = localizedText(parsed, "description", locale) ?? parsed.description;

                          if (hasSubs) {
                            const subIds = parsed.subOptions.map((s) => s.id);
                            const totalPackageQty = subIds.reduce((sum, sId) => sum + (optionQty[sId] || 0), 0);

                            return (
                              <div
                                key={opt.id}
                                className="flex flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl border border-slate-100/90 bg-white hover:border-slate-200 hover:shadow-xs transition-all shadow-2xs"
                              >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                  <div className="flex flex-col items-center shrink-0">
                                    <div className="size-20 sm:size-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center">
                                      <img src={optImg} alt={optName} className="size-full object-cover" />
                                    </div>
                                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-[#9b51e0] text-white mt-1.5 text-center shadow-2xs">
                                      {parsed.subOptions.length} {isAr ? "خيارات" : "Options"}
                                    </span>
                                  </div>

                                  <div className="min-w-0 space-y-1">
                                    <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{optName}</h4>
                                    {optDesc && (
                                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                                        {optDesc}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 pt-1 text-xs">
                                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                                        {isAr ? "يبدأ من" : "Starts at"} AED {Number(parsed.lowestPrice).toFixed(0)}
                                      </span>
                                      {Boolean(optDuration && Number(optDuration) > 0) && (
                                        <>
                                          <span className="text-slate-400">•</span>
                                          <span className="text-slate-500 font-semibold">{Number(optDuration)} min</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  <Button
                                    type="button"
                                    onClick={() => setSelectedPackageOption(opt)}
                                    className="bg-[#00B4D8] hover:bg-[#0096c7] text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                                  >
                                    {totalPackageQty > 0 ? (
                                      <span>{totalPackageQty} {isAr ? "محدد" : "Selected"}</span>
                                    ) : (
                                      <span>{isAr ? "إضافة +" : "Add +"}</span>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            );
                          }

                          const qty = optionQty[opt.id] || 0;

                          return (
                            <div
                              key={opt.id}
                              className="flex flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl border border-slate-100/90 bg-white hover:border-slate-200 hover:shadow-xs transition-all shadow-2xs"
                            >
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="size-20 sm:size-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 flex items-center justify-center">
                                  <img src={optImg} alt={optName} className="size-full object-cover" />
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{optName}</h4>
                                  {optDesc && (
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                                      {optDesc}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 pt-1 text-xs">
                                    <span className="text-sm sm:text-base font-extrabold text-slate-900">
                                      AED {Number(opt.price).toFixed(0)}
                                    </span>
                                    {Boolean(optOriginal && Number(optOriginal) > 0) && (
                                      <span className="text-xs sm:text-sm text-slate-400 line-through font-semibold">
                                        AED {Number(optOriginal).toFixed(0)}
                                      </span>
                                    )}
                                    {Boolean(optDuration && Number(optDuration) > 0) && (
                                      <>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-500 font-semibold">{Number(optDuration)} min</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {qty === 0 ? (
                                  <Button
                                    type="button"
                                    onClick={() => setQty(opt.id, 1)}
                                    className="bg-[#00B4D8] hover:bg-[#0096c7] text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-xs active:scale-95 cursor-pointer"
                                  >
                                    {isAr ? "إضافة +" : "Add +"}
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-2 rounded-full border border-[#00B4D8] bg-cyan-50/60 px-2 py-1.5 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => setQty(opt.id, qty - 1)}
                                      className="grid size-6 place-items-center rounded-full bg-white text-cyan-800 font-bold text-xs shadow-2xs hover:bg-slate-50 cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-extrabold text-cyan-950 px-1">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => setQty(opt.id, qty + 1)}
                                      className="grid size-6 place-items-center rounded-full bg-[#00B4D8] text-white font-bold text-xs shadow-2xs hover:bg-[#0096c7] cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        onClick={goNext}
                        disabled={!canContinue}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-sm py-3.5 rounded-full shadow-md"
                      >
                        {isAr ? "التالي" : "Next"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Standard Service Details (Hours, Pros, Materials) */
                  <>
                    {/* 1. Hours Selector */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <Label className="text-xs sm:text-sm font-bold text-slate-900">
                          {isAr ? "كم عدد الساعات التي تحتاجها؟" : "How many hours do you need your professional to stay?"}
                        </Label>
                        <Info className="size-4 text-slate-400 shrink-0" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hoursList.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHours(h)}
                            className={`grid size-10 sm:size-11 place-items-center rounded-full text-xs font-extrabold transition-all ${
                              hours === h
                                ? "bg-cyan-100 text-cyan-800 border-2 border-cyan-500 shadow-xs"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Professionals Selector */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <Label className="text-xs sm:text-sm font-bold text-slate-900">
                          {isAr ? "كم عدد المحترفين الذين تحتاجهم؟" : "How many professionals do you need?"}
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prosList.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setProfessionals(p)}
                            className={`grid size-10 sm:size-11 place-items-center rounded-full text-xs font-extrabold transition-all ${
                              professionals === p
                                ? "bg-cyan-100 text-cyan-800 border-2 border-cyan-500 shadow-xs"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Cleaning Materials Selector */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Label className="text-xs sm:text-sm font-bold text-slate-900">
                          {materialsLabel}
                        </Label>
                        <Info className="size-4 text-slate-400 shrink-0" />
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => setMaterials(false)}
                          className={`rounded-full px-4 sm:px-5 py-2 text-xs font-bold transition-all ${
                            !materials
                              ? "bg-cyan-100 text-cyan-800 border-2 border-cyan-500 shadow-xs"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isAr ? "لا، لدي موادي الخاصة" : "No, I have them"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaterials(true)}
                          className={`rounded-full px-4 sm:px-5 py-2 text-xs font-bold transition-all ${
                            materials
                              ? "bg-cyan-100 text-cyan-800 border-2 border-cyan-500 shadow-xs"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isAr ? "نعم، يرجى توفيرها" : "Yes, please"}
                          {svcMaterialsPrice > 0 ? ` (+AED ${svcMaterialsPrice})` : ""}
                        </button>
                      </div>
                    </div>

                    {/* Fuel Surcharge Promo Banner */}
                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3.5 flex items-center gap-2.5 text-xs text-cyan-900 font-bold leading-relaxed">
                      <Sparkles className="size-4 text-cyan-600 shrink-0" />
                      <span>
                        {isAr
                          ? "الحجز الأول؟ رسوم إنتقال المحترف مجاناً علينا. استمتع برحلتك!"
                          : "First booking? Your fuel surcharge fee is on us. Enjoy!"}
                      </span>
                    </div>

                    {/* Instructions Textarea */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold text-slate-700">
                          {isAr ? "تعليمات أو متطلبات خاصة؟" : "Any instructions or special requirements?"}
                        </Label>
                        <span className="text-[11px] text-slate-400 font-medium">{instructions.length}/150</span>
                      </div>
                      <Textarea
                        maxLength={150}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder={isAr ? "رمز البوابة، حيوانات أليفة، موقف السيارات..." : "Gate code, pets, parking instructions..."}
                        rows={3}
                        className="text-xs"
                      />
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      <Button
                        type="button"
                        onClick={goNext}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-sm py-3.5 rounded-full shadow-md"
                      >
                        {isAr ? "التالي" : "Next"}
                      </Button>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* STEP 1.5: Popular Add-ons Grid */}
            {step === 1 && hasAddons && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{isAr ? "الإضافات الشائعة" : "Popular Add-ons"}</h2>
                  <p className="mt-0.5 text-xs font-bold text-slate-600">{isAr ? "أضاف عملاء آخرون هذه الخدمات إلى حجزهم" : "People also added"}</p>
                </div>

                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                  {addons.map((a: any) => {
                    const selected = addonIds.includes(a.id);
                    const addonImg = resolveImageUrl(a.image_url || a.imageUrl) || FALLBACK_IMAGE;
                    const addonPrice = Number(a.price || 0);
                    const originalPrice = a.original_price || a.originalPrice;
                    const addonName = localizedText(a, "name", locale) ?? a.name;

                    return (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAddonDetail(a)}
                        className={`group relative flex flex-col overflow-hidden rounded-2xl border cursor-pointer transition-all ${
                          selected
                            ? "border-cyan-500 bg-cyan-50/30 ring-2 ring-cyan-500/20 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                          <img
                            src={addonImg}
                            alt={addonName}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Circular Cyan Plus / Check Action Button */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddonIds((prev) =>
                                selected ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                              );
                            }}
                            className={`absolute bottom-2 end-2 grid size-7 place-items-center rounded-full shadow-md transition-transform active:scale-90 ${
                              selected ? "bg-cyan-600 text-white" : "bg-cyan-400 text-white hover:bg-cyan-500"
                            }`}
                          >
                            {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-3">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {addonName}
                          </h4>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-900">
                              AED {addonPrice.toFixed(0)}
                            </span>
                            {originalPrice && (
                              <span className="text-[11px] font-semibold text-slate-400 line-through">
                                AED {Number(originalPrice).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={goBack} className="text-xs font-bold">
                    {isAr ? "رجوع" : "Back"}
                  </Button>
                  <Button
                    type="button"
                    onClick={goNext}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs px-8 rounded-full shadow-md"
                  >
                    {isAr ? "التالي" : "Next"}
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 2/3: Date & Time Picker */}
            {step === 2 && (
              <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                {/* Frequency Summary Box */}
                <div className="rounded-xl border border-cyan-300 bg-cyan-50/70 p-4 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-900">{isAr ? "التكرار" : "Frequency"}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1 text-xs font-extrabold text-white shadow-2xs">
                      <RefreshCw className="size-3.5" />
                      {frequencyTitle}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFreqDraft(frequency);
                      setFreqOpen(true);
                    }}
                    className="text-xs font-extrabold text-cyan-600 hover:underline"
                  >
                    {isAr ? "تغيير" : "Change"}
                  </button>
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isAr ? "متى ترغب في استلام الخدمة؟" : "When would you like your service?"}
                  </h2>
                </div>

                {/* Horizontal Oval Date Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => scrollContainer(dateSliderRef, "left")}
                    className="absolute start-0 top-1/2 z-10 -translate-y-1/2 grid size-7 place-items-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-700 hover:bg-slate-50"
                  >
                    {isAr ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                  </button>

                  <div
                    ref={dateSliderRef}
                    className="flex gap-2.5 overflow-x-auto px-8 pb-2 pt-1 scrollbar-none scroll-smooth"
                  >
                    {availableDates.map((d) => {
                      const isSelected = d === date;
                      const dObj = new Date(d);
                      const dayName = dObj.toLocaleDateString(isAr ? "ar-AE" : "en-US", { weekday: "short" });
                      const dayNum = dObj.getDate();
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setDate(d);
                            setSlotStart(null);
                          }}
                          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-extrabold transition-all ${
                            isSelected
                              ? "bg-cyan-100 text-cyan-800 border-2 border-cyan-500 shadow-xs"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{dayName}</span>
                          <span>{dayNum}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollContainer(dateSliderRef, "right")}
                    className="absolute end-0 top-1/2 z-10 -translate-y-1/2 grid size-7 place-items-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-700 hover:bg-slate-50"
                  >
                    {isAr ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                </div>

                {/* Time Slots Selector */}
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <Label className="text-xs sm:text-sm font-bold text-slate-900">
                      {isAr ? "ما الوقت الذي تود فيه أن نبدأ؟" : "What time would you like us to start?"}
                    </Label>
                    <span className="text-[11px] font-bold text-cyan-600">
                      {isAr ? "اختر موعدًا" : "Select time"}
                    </span>
                  </div>

                  {validSlots.length > 0 ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => scrollContainer(timeSliderRef, "left")}
                        className="absolute start-0 top-1/2 z-10 -translate-y-1/2 grid size-7 place-items-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-700 hover:bg-slate-50"
                      >
                        {isAr ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                      </button>

                      <div
                        ref={timeSliderRef}
                        className="flex gap-2 overflow-x-auto px-8 pb-2 pt-1 scrollbar-none scroll-smooth"
                      >
                        {validSlots.map((slot: any) => {
                          const isSelected = slotStart === slot.start;
                          const [h, m] = slot.start.split(":").map(Number);
                          const endM = (m + 30) % 60;
                          const endH = h + (m + 30 >= 60 ? 1 : 0);
                          const rangeStr = `${slot.start}-${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                          return (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => setSlotStart(slot.start)}
                              className={`shrink-0 rounded-full border py-2 px-3.5 text-xs font-extrabold transition-all ${
                                isSelected
                                  ? "bg-cyan-100 text-cyan-800 border-2 border-cyan-500 shadow-xs"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-cyan-500"
                              }`}
                            >
                              {rangeStr}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => scrollContainer(timeSliderRef, "right")}
                        className="absolute end-0 top-1/2 z-10 -translate-y-1/2 grid size-7 place-items-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-700 hover:bg-slate-50"
                      >
                        {isAr ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-800 font-semibold">
                      {isAr ? "لا توجد مواعيد متاحة اليوم حسب توقيت دبي. يرجى اختيار تاريخ قادم." : "No slots available today for Dubai time. Please pick a future date."}
                    </div>
                  )}
                </div>

                {/* Free Cancellation Banner */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-slate-400 shrink-0" />
                    <span>{isAr ? "استمتع بإلغاء مجاني حتى 6 ساعات قبل موعد بدء الحجز." : "Enjoy free cancellation up to 6 hours before your booking start time."}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPolicyOpen(true)}
                    className="text-xs font-bold text-cyan-600 underline shrink-0 ms-2"
                  >
                    {isAr ? "عرض السياسة" : "View our policy"}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={goBack} className="text-xs font-bold">
                    {isAr ? "رجوع" : "Back"}
                  </Button>
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={!canContinue}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs px-8 rounded-full shadow-md"
                  >
                    {isAr ? "التالي" : "Next"}
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 3: Address Selection */}
            {step === 3 && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{t("booking.step.address")}</h2>
                  <p className="mt-1 text-xs text-slate-500">{isAr ? "الخدمة متوفرة في إمارة دبي والإمارات" : "Service available in Dubai & United Arab Emirates"}</p>
                </div>

                <div className="space-y-4">
                  {/* Address Search Input with Map Trigger */}
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <Input
                        value={manualAddress}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualAddress(val);
                          if (val.trim().length >= 2) {
                            void searchPlaces(val).then((res) => setAddrResults(res)).catch(() => setAddrResults([]));
                          } else {
                            setAddrResults([]);
                          }
                        }}
                        placeholder={isAr ? "أدخل العنوان (فيلا، شقة، منطقة)" : "Enter Dubai address (Villa, Apartment, Area)"}
                        className="text-xs py-2.5 rounded-xl border-slate-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPickerOpen(true)}
                        className="shrink-0 text-xs font-bold rounded-xl border-slate-200 hover:border-cyan-500 hover:text-cyan-600 gap-1.5"
                      >
                        <MapPin className="size-4 text-cyan-600" />
                        {isAr ? "الخريطة" : "Map"}
                      </Button>
                    </div>

                    {/* Floating Search Suggestions Dropdown */}
                    {addrResults.length > 0 && (
                      <ul className="absolute start-0 end-24 top-12 z-50 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
                        {addrResults.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-start text-xs transition-colors hover:bg-cyan-50/60"
                              onClick={() => {
                                setManualAddress(r.address || r.name);
                                saveLocation({ address: r.address || r.name, lat: r.lat, lng: r.lng });
                                setAddrResults([]);
                              }}
                            >
                              <MapPin className="mt-0.5 size-3.5 shrink-0 text-cyan-600" />
                              <div>
                                <span className="block font-bold text-slate-900">{r.name}</span>
                                <span className="block text-[11px] text-slate-500">{r.address}</span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Selected Address Display Card */}
                  <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="grid size-9 place-items-center rounded-full bg-cyan-100 text-cyan-700 shrink-0">
                        <MapPin className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-800">
                          {isAr ? "العنوان المحدد للحجز" : "Selected Delivery Address"}
                        </span>
                        <span className="block text-xs font-bold text-slate-900 leading-relaxed truncate max-w-md">
                          {displayAddress}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPickerOpen(true)}
                      className="rounded-full text-xs font-bold border-cyan-500 text-cyan-700 hover:bg-cyan-100 shrink-0"
                    >
                      {isAr ? "تغيير" : "Change"}
                    </Button>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={goBack} className="text-xs font-bold rounded-full px-6">
                    {isAr ? "رجوع" : "Back"}
                  </Button>
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={!canContinue}
                    className="bg-[#FFC836] hover:bg-[#f5be29] text-slate-900 font-extrabold text-xs px-8 rounded-full shadow-md transition-all active:scale-98"
                  >
                    {isAr ? "التالي" : "Next"}
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 4: Verification & Payment (Matching Image 3) */}
            {step === 4 && (
              <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-0.5">
                      {isAr ? "الخطوة 4 من 4" : "Step 4 of 4"}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {isAr ? "إتمام الحجز والدفع" : "Checkout"}
                    </h2>
                  </div>
                </div>

                {/* Phone & Account Verification Box (Only shown if user has no verified account) */}
                {!token && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">
                          {isAr ? "تسجيل الدخول أو إنشاء حساب" : "Sign Up Or Log In"}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                          {isAr
                            ? "يرجى التحقق من رقم الهاتف وإنشاء الحساب لتأكيد طلبك."
                            : "Please verify your phone number & create your account to place your order."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="w-full rounded-full bg-[#FFC836] hover:bg-[#f5be29] py-3 px-6 text-center text-xs font-extrabold text-slate-900 shadow-md transition-all active:scale-98"
                    >
                      {isAr ? "إنشاء حساب أو تسجيل الدخول" : "Sign Up Or Log In"}
                    </button>
                  </div>
                )}

                {/* Clear Payment Details Breakdown Box (Transparent Order Details) */}
                <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/40 p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-cyan-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-cyan-600 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {isAr ? "تفاصيل الدفع والحساب الكاملة" : "Clear Payment Details & Breakdown"}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      <ShieldCheck className="size-3" />
                      {isAr ? "دفع آمن ومضمون" : "100% Secure"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    {/* Main Service or Options Lines */}
                    {Object.entries(optionQty).some(([, q]) => q > 0) ? (
                      <div className="space-y-1.5 pb-2 border-b border-cyan-100/70">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {isAr ? "الباقات والخيارات المحددة:" : "Selected Options & Packages:"}
                        </span>
                        {Object.entries(optionQty)
                          .filter(([, q]) => q > 0)
                          .map(([vId, q]) => {
                            const v = allVariants.find((item: any) => item.id === vId);
                            if (!v) return null;
                            const unitP = Number(v.price || v.base_price || 0);
                            const itemPrice = unitP * q;
                            const vName = localizedText(v, "name", locale) ?? v.name;
                            return (
                              <div key={vId} className="flex justify-between items-center py-0.5">
                                <div className="min-w-0 pr-2">
                                  <span className="font-bold text-slate-800">{vName}</span>
                                  <span className="text-slate-400 font-semibold ms-1 text-[11px]">
                                    (AED {unitP.toFixed(0)} × {q})
                                  </span>
                                </div>
                                <span className="font-extrabold text-slate-900 shrink-0">
                                  AED {itemPrice.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      (quote?.breakdown as any)?.subtotal !== undefined && Number((quote?.breakdown as any)?.subtotal) > 0 && (
                        <div className="flex justify-between items-center py-0.5">
                          <span className="font-semibold text-slate-700">
                            {serviceTitle} ({hours} {isAr ? "ساعات" : "hrs"} × {professionals} {isAr ? "محترف" : "pro"})
                          </span>
                          <span className="font-extrabold text-slate-900">
                            AED {Number((quote?.breakdown as any)?.subtotal || 0).toFixed(2)}
                          </span>
                        </div>
                      )
                    )}

                    {/* Addons Line Items if any */}
                    {addonIds.length > 0 && (
                      <div className="space-y-1 py-1 border-b border-cyan-100/70">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {isAr ? "الخدمات الإضافية:" : "Add-on Services:"}
                        </span>
                        {addons
                          .filter((a: any) => addonIds.includes(a.id))
                          .map((a: any) => {
                            const aName = localizedText(a, "name", locale) ?? a.name;
                            const aPrice = Number(a.price || 0);
                            return (
                              <div key={a.id} className="flex justify-between items-center py-0.5">
                                <span className="font-semibold text-slate-700">{aName}</span>
                                <span className="font-bold text-cyan-800">
                                  +AED {aPrice.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Materials fee if any */}
                    {materials && (
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-600 font-semibold">{isAr ? "مواد التنظيف" : "Cleaning Materials"}</span>
                        <span className="font-bold text-slate-800">
                          AED {Number((quote?.breakdown as any)?.materials || 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Frequency Discount Line if any */}
                    {(quote?.breakdown as any)?.frequencyDiscount !== undefined && Number((quote?.breakdown as any)?.frequencyDiscount) > 0 && (
                      <div className="flex justify-between items-center py-0.5 text-emerald-700 font-bold">
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw className="size-3 text-emerald-600" />
                          {isAr ? `خصم التكرار (${frequencyTitle})` : `Frequency Discount (${frequencyTitle})`}
                        </span>
                        <span>-AED {Number((quote?.breakdown as any)?.frequencyDiscount || 0).toFixed(2)}</span>
                      </div>
                    )}

                    {/* Coupon Discount Line if any */}
                    {(quote?.breakdown as any)?.discount ? (
                      <div className="flex justify-between items-center py-0.5 text-emerald-700 font-bold">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="size-3 text-emerald-600" />
                          {isAr ? `خصم الكوبون (${appliedCoupon})` : `Coupon Discount (${appliedCoupon})`}
                        </span>
                        <span>-AED {Number((quote?.breakdown as any)?.discount || 0).toFixed(2)}</span>
                      </div>
                    ) : null}

                    {/* Total Row */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-cyan-200 text-sm font-black text-slate-900">
                      <span>{isAr ? "المبلغ الإجمالي للدفع:" : "Total Payable Amount:"}</span>
                      <span className="text-base sm:text-lg font-black text-cyan-900 font-mono">
                        AED {Number((quote?.breakdown as any)?.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
                  <Label className="text-xs font-extrabold text-slate-800">{t("booking.applyCoupon")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={isAr ? "رمز الخصم (مثال: 50MOP)" : "E.G. 50MOP"}
                      className="text-xs uppercase bg-white font-mono rounded-xl border-slate-200"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-cyan-600 font-bold text-white hover:bg-cyan-700 shrink-0 text-xs rounded-xl"
                    >
                      {t("booking.apply")}
                    </Button>
                  </div>
                </div>

                {/* Payment Method UI (Matching Image 3) */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-extrabold text-slate-900">Payment Method</Label>
                    <span className="text-xs font-bold text-cyan-600 cursor-pointer hover:underline">Change</span>
                  </div>

                  {/* Credit / Debit Card Selected Pill Header */}
                  <div className="flex items-center justify-between rounded-xl border-2 border-cyan-500 bg-cyan-50/50 p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <CardIcon className="size-4 text-slate-900" />
                      <span className="text-xs font-extrabold text-slate-900">Credit / Debit Card</span>
                    </div>
                    {/* Card Logos: VISA, MasterCard, Amex */}
                    <div className="flex items-center gap-1">
                      <span className="rounded-md bg-blue-700 px-1.5 py-0.5 text-[9px] font-black italic text-white">VISA</span>
                      <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">MC</span>
                      <span className="rounded-md bg-cyan-700 px-1.5 py-0.5 text-[9px] font-black text-white">AMEX</span>
                    </div>
                  </div>

                  {/* Card Form Inputs */}
                  <div className="space-y-3.5 pt-1">
                    <div>
                      <Label className="block text-xs font-semibold text-slate-400 mb-1">
                        Card Number
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          name="cc-number"
                          autoComplete="off"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="1234 1234 1234 1234"
                          className="text-xs rounded-xl border-slate-200 bg-white font-mono"
                          maxLength={19}
                        />
                        <div className="absolute right-3 top-2.5 flex items-center gap-1">
                          <span className="rounded bg-blue-700 px-1 py-0.5 text-[8px] font-black text-white">VISA</span>
                          <span className="rounded bg-red-600 px-1 py-0.5 text-[8px] font-black text-white">MC</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="block text-xs font-semibold text-slate-400 mb-1">
                          Exp. Date (MM/YY)
                        </Label>
                        <Input
                          type="text"
                          name="cc-exp"
                          autoComplete="off"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          placeholder="MM/YY"
                          className="text-xs rounded-xl border-slate-200 bg-white font-mono"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-semibold text-slate-400 mb-1">
                          CVV Number
                        </Label>
                        <Input
                          type="password"
                          name="cc-csc"
                          autoComplete="off"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="CVV"
                          className="text-xs rounded-xl border-slate-200 bg-white font-mono"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complete Order Gold Button (Image 3) */}
                <div className="pt-2 space-y-2.5">
                  <Button
                    type="button"
                    disabled={confirm.isPending}
                    onClick={() => confirm.mutate()}
                    className="w-full rounded-full bg-[#FFC836] hover:bg-[#f5be29] py-3.5 px-6 text-center text-sm font-extrabold text-slate-900 shadow-md transition-all active:scale-98 disabled:opacity-50"
                  >
                    {confirm.isPending ? <Loader2 className="size-4 animate-spin me-2" /> : null}
                    {isAr ? "إتمام الحجز وتأكيد الطلب" : "Complete"}
                  </Button>

                  <p className="text-[11px] text-slate-500 text-center leading-relaxed font-medium">
                    {isAr ? (
                      <>
                        بإتمام طلبك، فإنك توافق على{" "}
                        <Link to="/terms" target="_blank" className="text-cyan-700 underline font-bold hover:text-cyan-800">
                          الشروط والأحكام
                        </Link>{" "}
                        و{" "}
                        <Link to="/privacy" target="_blank" className="text-cyan-700 underline font-bold hover:text-cyan-800">
                          سياسة الخصوصية
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        By completing your order, you agree to our{" "}
                        <Link to="/terms" target="_blank" className="text-cyan-700 underline font-bold hover:text-cyan-800">
                          Terms & Conditions
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" target="_blank" className="text-cyan-700 underline font-bold hover:text-cyan-800">
                          Privacy Policy
                        </Link>
                        .
                      </>
                    )}
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Right-Hand Sidebar ("Booking Details") */}
          <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs min-w-0 w-full overflow-hidden">
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg border-b border-slate-100 pb-4">
              {t("booking.detailsTitle")}
            </h2>

            <div className="mt-4 space-y-4 text-xs min-w-0">
              <div className="min-w-0">
                <span className="text-slate-400 font-semibold block mb-0.5">{t("booking.row.address")}</span>
                <span className="font-bold text-slate-800 block leading-relaxed break-words max-w-full">
                  {displayAddress}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">{t("booking.row.frequency")}</span>
                <span className="font-bold text-slate-800 text-end">{frequencyTitle}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">{t("booking.row.service")}</span>
                <span className="font-bold text-slate-800 text-end truncate">{serviceTitle}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">{t("booking.row.duration")}</span>
                <span className="font-bold text-slate-800 text-end">
                  {isHourlyBooking
                    ? isAr ? `${hours} ساعات` : `${hours} hours`
                    : totalOptionsDurationMinutes > 0
                    ? totalOptionsDurationMinutes >= 60
                      ? isAr
                        ? `${Math.floor(totalOptionsDurationMinutes / 60)} س ${totalOptionsDurationMinutes % 60 > 0 ? `${totalOptionsDurationMinutes % 60} د` : ""}`
                        : `${Math.floor(totalOptionsDurationMinutes / 60)} hr${Math.floor(totalOptionsDurationMinutes / 60) > 1 ? "s" : ""} ${totalOptionsDurationMinutes % 60 > 0 ? `${totalOptionsDurationMinutes % 60} min` : ""}`
                      : isAr ? `${totalOptionsDurationMinutes} دقيقة` : `${totalOptionsDurationMinutes} mins`
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">{t("booking.row.when")}</span>
                <span className="font-bold text-slate-800 text-end">
                  {slotStart ? `${formattedDateString}, ${formattedTimeRange}` : isAr ? "يحدد لاحقاً" : "To be selected"}
                </span>
              </div>

              {isHourlyBooking && (
                <>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 font-semibold shrink-0">{t("booking.row.pros")}</span>
                    <span className="font-bold text-slate-800 text-end">{professionals}</span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 font-semibold shrink-0">{t("booking.row.materials")}</span>
                    <span className="font-bold text-slate-800 text-end">
                      {materials ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}
                      {materials && svcMaterialsPrice > 0 ? ` (+AED ${svcMaterialsPrice})` : ""}
                    </span>
                  </div>
                </>
              )}

              {/* Special Instructions in Booking Details */}
              {instructions.trim() && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold block">{isAr ? "التعليمات الخاصة:" : "Special Instructions:"}</span>
                  <p className="font-bold text-slate-800 text-xs italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-snug break-words">
                    "{instructions.trim()}"
                  </p>
                </div>
              )}

              {/* Selected Options/Variants List */}
              {Object.entries(optionQty).some(([, q]) => q > 0) && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-slate-400 font-semibold block text-xs mb-1">{t("booking.selectedPackageOptions")}</span>
                  {Object.entries(optionQty)
                    .filter(([, q]) => q > 0)
                    .map(([vId, q]) => {
                      const v = allOptionsAndSubOptions.get(vId) || allVariants.find((item: any) => String(item.id) === String(vId));
                      if (!v) return null;
                      const itemPrice = Number(v.price || 0) * q;
                      const vName = localizedText(v, "name", locale) ?? v.name;
                      const itemDuration = v.durationMinutes || v.duration_minutes;
                      return (
                        <div key={vId} className="flex justify-between items-start text-xs py-1 border-b border-slate-50 last:border-b-0">
                          <div className="min-w-0 me-2 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800">{vName}</span>
                              <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded shrink-0">x{q}</span>
                            </div>
                            {itemDuration && Number(itemDuration) > 0 ? (
                              <p className="text-[11px] text-slate-400 font-medium">
                                ⏱️ {Number(itemDuration) * q} min
                              </p>
                            ) : null}
                          </div>
                          <span className="font-extrabold text-cyan-600 shrink-0">
                            +AED {itemPrice.toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Selected Add-ons List if any */}
              {addonIds.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-slate-400 font-semibold block mb-1">{t("booking.addons")}</span>
                  {addons
                    .filter((a: any) => addonIds.includes(a.id))
                    .map((a: any) => {
                      const aName = localizedText(a, "name", locale) ?? a.name;
                      return (
                        <div key={a.id} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700 truncate">{aName}</span>
                          <span className="font-extrabold text-cyan-600 shrink-0">
                            +AED {Number(a.price).toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Payment Summary Box */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <h3 className="font-extrabold text-slate-900 text-sm mb-3">{t("booking.paymentSummary")}</h3>
                
                {((quote?.breakdown as any)?.subtotal !== undefined && Number((quote?.breakdown as any)?.subtotal) > 0) || isHourlyBooking ? (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{t("booking.baseServiceLine")}</span>
                    <span>
                      AED{" "}
                      {Number(
                        (quote?.breakdown as any)?.subtotal ??
                          (Number(svcObj.hourly_rate ?? svcObj.hourlyRate ?? svcObj.base_price ?? 39) * hours * professionals)
                      ).toFixed(2)}
                    </span>
                  </div>
                ) : null}

                {(quote?.breakdown as any)?.items !== undefined && Number((quote?.breakdown as any)?.items) > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{t("booking.packageOptionsLine")}</span>
                    <span>AED {Number((quote?.breakdown as any)?.items || 0).toFixed(2)}</span>
                  </div>
                )}

                {(quote?.breakdown as any)?.addons !== undefined && Number((quote?.breakdown as any)?.addons) > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{t("booking.addons")}</span>
                    <span>AED {Number((quote?.breakdown as any)?.addons || 0).toFixed(2)}</span>
                  </div>
                )}

                {materials && (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{isAr ? "مواد التنظيف" : "Cleaning Materials"}</span>
                    <span>
                      AED{" "}
                      {Number(
                        (quote?.breakdown as any)?.materials ?? svcMaterialsPrice
                      ).toFixed(2)}
                    </span>
                  </div>
                )}

                {(quote?.breakdown as any)?.frequencyDiscount !== undefined && Number((quote?.breakdown as any)?.frequencyDiscount) > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                    <span>{isAr ? "خصم التكرار" : "Frequency Discount"}</span>
                    <span>-AED {Number((quote?.breakdown as any)?.frequencyDiscount || 0).toFixed(2)}</span>
                  </div>
                )}

                {(quote?.breakdown as any)?.discount ? (
                  <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                    <span>{t("booking.couponDiscount")}</span>
                    <span>-AED {Number((quote?.breakdown as any)?.discount || 0).toFixed(2)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>{t("common.total")}</span>
                  <span className="text-slate-900 font-black">
                    AED {Number((quote?.breakdown as any)?.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FREQUENCY SELECTION MODAL */}
      <Dialog open={freqOpen} onOpenChange={setFreqOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl overflow-hidden">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              {isAr ? "اختر عدد مرات التكرار" : "Choose your frequency"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto px-1">
            {FREQUENCY_LIST.map((item) => {
              const selected = freqDraft === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setFreqDraft(item.id)}
                  className={`relative flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                    selected
                      ? "border-cyan-400 bg-cyan-50/40 ring-2 ring-cyan-400/30"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {item.popular && (
                    <span className="absolute -top-2.5 start-4 rounded-md bg-cyan-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                      {isAr ? "الأكثر طلبًا" : "Most popular"}
                    </span>
                  )}

                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{isAr ? item.titleAr : item.title}</p>
                    {(isAr ? item.badgeAr : item.badge) && (
                      <span className="mt-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        {isAr ? item.badgeAr : item.badge}
                      </span>
                    )}
                  </div>

                  <div
                    className={`grid size-6 place-items-center rounded-full border-2 transition-all ${
                      selected ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected && <div className="size-2 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}

            {/* ServicePlus Promise Footer Section */}
            <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-cyan-600 font-extrabold text-base">سيرفس بلس</span>
                <span className="font-extrabold text-slate-900 text-base">{isAr ? "الوعد" : "Promise"}</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Tag className="size-4 text-slate-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{isAr ? "أي تنظيف، في أي وقت" : "Any Mess, Any Time"}</p>
                    <p className="text-[11px] text-slate-500">{isAr ? "محترفون بأعلى تقييم، جاهزون عندما تحتاجهم." : "Top-rated professionals, ready when you need them."}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CalendarClock className="size-4 text-slate-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{isAr ? "احجز فورًا، مرونة كاملة" : "Book Instantly, Stay Flexible"}</p>
                    <p className="text-[11px] text-slate-500">{isAr ? "مواعيد متعددة متاحة بدون أي التزام." : "Multiple slots available with no commitment."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button
              type="button"
              onClick={() => {
                setFrequency(freqDraft);
                setFreqOpen(false);
              }}
              className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold py-3.5 rounded-full text-sm shadow-md"
            >
              {isAr ? "تحديد" : "Select"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CANCELLATION & SERVICE POLICY MODAL */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              {isAr ? "سياسة الخدمة والإلغاء" : "Service & Cancellation Policy"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs leading-relaxed text-slate-600">
            <div className="space-y-1">
              <p className="font-extrabold text-slate-900 text-sm">{isAr ? "الإلغاء المجاني" : "Free Cancellation"}</p>
              <p>{isAr ? "يمكنك إلغاء أو إعادة جدولة حجزك مجانًا حتى 6 ساعات قبل موعد بدء الخدمة المحدد." : "You can cancel or reschedule your booking free of charge up to 6 hours before your scheduled start time."}</p>
            </div>

            <div className="space-y-1">
              <p className="font-extrabold text-slate-900 text-sm">{isAr ? "رسوم الإلغاء المتأخر" : "Late Cancellation Fee"}</p>
              <p>{isAr ? "الإلغاء قبل أقل من 6 ساعات من موعد بدء الخدمة قد يخضع لرسوم رمزية قدرها 25 درهمًا لتعويض المحترفين المعينين." : "Cancellations made less than 6 hours prior to start time may incur a nominal AED 25 fee to compensate assigned professionals."}</p>
            </div>

            <div className="space-y-1">
              <p className="font-extrabold text-slate-900 text-sm">{isAr ? "ضمان الرضا بنسبة 100%" : "100% Satisfaction Guarantee"}</p>
              <p>{isAr ? "إذا لم تكن راضيًا عن الخدمة المقدمة، تواصل معنا خلال 24 ساعة وسنرسل محترفًا لإعادة تقديم الخدمة مجانًا." : "If you are not satisfied with your service, contact us within 24 hours and we will send a top professional to re-clean free of charge."}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>{isAr ? "للاطلاع على السياسات الكاملة:" : "Review complete policies:"}</span>
              <div className="flex gap-2 font-bold">
                <Link to="/terms" target="_blank" className="text-cyan-700 underline hover:text-cyan-800">
                  {isAr ? "الشروط والأحكام" : "Terms"}
                </Link>
                <span>•</span>
                <Link to="/privacy" target="_blank" className="text-cyan-700 underline hover:text-cyan-800">
                  {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button
              type="button"
              onClick={() => setPolicyOpen(false)}
              className="w-full bg-slate-900 text-white font-extrabold py-3 rounded-full text-xs"
            >
              {isAr ? "فهمت ذلك" : "Got it"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD-ON DETAIL MODAL (Matching Reference UI) */}
      <Dialog
        open={Boolean(selectedAddonDetail)}
        onOpenChange={(open) => !open && setSelectedAddonDetail(null)}
      >
        <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-slate-200">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <DialogTitle className="text-base font-extrabold text-slate-900">
              {localizedText(selectedAddonDetail, "name", locale) ?? selectedAddonDetail?.name}
            </DialogTitle>
          </div>

          {/* Hero Image */}
          {(selectedAddonDetail?.image_url || selectedAddonDetail?.imageUrl) && (
            <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
              <img
                src={resolveImageUrl(selectedAddonDetail.image_url || selectedAddonDetail.imageUrl)}
                alt=""
                className="size-full object-cover"
              />
            </div>
          )}

          {/* Details Content */}
          <div className="p-5 space-y-4 text-xs text-slate-700">
            {/* Description */}
            {(localizedText(selectedAddonDetail, "description", locale) ?? selectedAddonDetail?.description) && (
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {localizedText(selectedAddonDetail, "description", locale) ?? selectedAddonDetail?.description}
              </p>
            )}

            {/* Price & Original Price */}
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900">
                AED {Number(selectedAddonDetail?.price || 0).toFixed(0)}
              </span>
              {(selectedAddonDetail?.original_price || selectedAddonDetail?.originalPrice) && (
                <span className="text-xs font-semibold text-slate-400 line-through">
                  AED {Number(selectedAddonDetail.original_price || selectedAddonDetail.originalPrice).toFixed(0)}
                </span>
              )}
            </div>

            {/* Additional Time Note */}
            {(selectedAddonDetail?.duration_minutes || selectedAddonDetail?.durationMinutes) ? (
              <p className="text-xs text-slate-500 font-medium">
                {isAr
                  ? `إضافة ${selectedAddonDetail.duration_minutes || selectedAddonDetail.durationMinutes} دقيقة إلى حجزك.`
                  : `Additional ${selectedAddonDetail.duration_minutes || selectedAddonDetail.durationMinutes} mins added to your booking.`}
              </p>
            ) : null}

            {/* What's Included */}
            {(selectedAddonDetail?.includes || selectedAddonDetail?.includes_ar) && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="font-extrabold text-slate-900 text-xs">
                  {isAr ? "ما تشمله الخدمة:" : "What's included:"}
                </p>
                <ul className="space-y-1.5 ps-1 text-slate-600">
                  {(Array.isArray(isAr && selectedAddonDetail.includes_ar ? selectedAddonDetail.includes_ar : selectedAddonDetail.includes)
                    ? (isAr && selectedAddonDetail.includes_ar ? selectedAddonDetail.includes_ar : selectedAddonDetail.includes)
                    : String(isAr && selectedAddonDetail.includes_ar ? selectedAddonDetail.includes_ar : selectedAddonDetail.includes || "").split("\n")
                  ).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="size-1.5 rounded-full bg-slate-700 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => {
                  if (!selectedAddonDetail) return;
                  const id = selectedAddonDetail.id;
                  if (!addonIds.includes(id)) {
                    setAddonIds((prev) => [...prev, id]);
                    toast.success(`${selectedAddonDetail.name} added to your booking!`);
                  } else {
                    setAddonIds((prev) => prev.filter((x) => x !== id));
                    toast.info(`${selectedAddonDetail.name} removed from your booking.`);
                  }
                  setSelectedAddonDetail(null);
                }}
                className="w-full bg-[#0093A3] hover:bg-[#007b88] text-white font-extrabold text-xs py-3.5 rounded-full shadow-md"
              >
                {addonIds.includes(selectedAddonDetail?.id)
                  ? (isAr ? "إزالة من الحجز" : "Remove from booking")
                  : (isAr
                      ? `إضافة مقابل AED ${Number(selectedAddonDetail?.price || 0).toFixed(0)}`
                      : `Add for AED ${Number(selectedAddonDetail?.price || 0).toFixed(0)}`)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* LOCATION MAP PICKER MODAL */}
      <LocationPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(loc) => {
          setManualAddress(loc.address);
          saveLocation(loc);
          setPickerOpen(false);
        }}
      />

      {/* ACCOUNT AUTHENTICATION & ONBOARDING MODAL */}
      <AccountAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* ORDER PLACED SUCCESSFUL CONFIRMATION MODAL */}
      <Dialog open={Boolean(orderSuccessModal?.open)} onOpenChange={() => setOrderSuccessModal(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-xs">
            <CheckCircle2 className="size-10" />
          </div>

          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">
              {isAr ? "تم إرسال الطلب بنجاح!" : "Order Placed Successfully!"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs text-slate-600 leading-relaxed">
            <p className="font-medium text-slate-700">
              {isAr
                ? "شكراً لك! تم تأكيد طلبك بنجاح وحفظ تفاصيل الحجز مباشرة في حسابك."
                : "Thank you! Your order has been placed successfully."}
            </p>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 space-y-2 text-start">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">{isAr ? "رقم المرجع:" : "Booking Ref:"}</span>
                <span className="font-black text-cyan-700 font-mono text-sm">{orderSuccessModal?.bookingNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">{isAr ? "الخدمة:" : "Service:"}</span>
                <span className="font-bold text-slate-900 truncate">{serviceTitle}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">{isAr ? "التاريخ والوقت:" : "Date & Time:"}</span>
                <span className="font-bold text-slate-900">{formattedDateString}, {formattedTimeRange}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">{isAr ? "المبلغ الإجمالي:" : "Total Amount:"}</span>
                <span className="font-extrabold text-slate-900 text-sm">AED {orderSuccessModal?.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="button"
              onClick={() => {
                setOrderSuccessModal(null);
                navigate({ to: "/dashboard" });
              }}
              className="w-full bg-[#0093A3] hover:bg-[#007b88] text-white font-extrabold py-3.5 rounded-full text-xs shadow-md"
            >
              {isAr ? "عرض حجوزاتي" : "View My Bookings"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PACKAGE MULTI-OPTIONS MODAL (MATCHING IMAGE 4) */}
      <Dialog open={Boolean(selectedPackageOption)} onOpenChange={(open) => !open && setSelectedPackageOption(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-6 border-slate-100 shadow-2xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 space-y-0">
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {localizedText(selectedPackageOption, "name", locale) ?? selectedPackageOption?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 pt-3">
            {selectedPackageOption &&
              parseOptionPayload(selectedPackageOption).subOptions.map((sub: SubOption) => {
                const qty = optionQty[sub.id] || 0;
                const subImg = resolveImageUrl(sub.imageUrl) || FALLBACK_IMAGE;
                const subName = localizedText(sub, "name", locale) ?? sub.name;
                const subDesc = localizedText(sub, "description", locale) ?? sub.description;
                const hasDuration = Boolean(sub.durationMinutes && Number(sub.durationMinutes) > 0);

                return (
                  <div
                    key={sub.id}
                    className="flex flex-row items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-slate-100 hover:border-slate-200 hover:shadow-2xs transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {sub.imageUrl ? (
                        <div className="size-16 sm:size-20 rounded-2xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <img src={subImg} alt={subName} className="size-full object-cover" />
                        </div>
                      ) : hasDuration ? (
                        <div className="size-16 sm:size-20 rounded-2xl bg-rose-50/90 border border-rose-100/80 p-2 flex flex-col items-center justify-center shrink-0 text-center shadow-2xs">
                          <span className="text-[10px] sm:text-[11px] text-rose-500 font-semibold leading-tight">
                            {isAr ? "فردي" : "Single"}
                          </span>
                          <span className="text-lg sm:text-2xl font-black text-rose-700 leading-none my-0.5">
                            {sub.durationMinutes}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-rose-600 font-semibold leading-tight">
                            {isAr ? "دقيقة" : "Min"}
                          </span>
                        </div>
                      ) : null}

                      <div className="min-w-0 space-y-1">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{subName}</h4>
                        {subDesc ? (
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                            {subDesc}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-2 pt-1 text-xs sm:text-sm">
                          <span className="font-extrabold text-slate-900">
                            AED {Number(sub.price).toFixed(0)}
                          </span>
                          {Boolean(sub.originalPrice && Number(sub.originalPrice) > 0) && (
                            <span className="text-slate-400 line-through font-semibold text-xs sm:text-sm">
                              AED {Number(sub.originalPrice).toFixed(0)}
                            </span>
                          )}
                          {hasDuration && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 font-semibold">{Number(sub.durationMinutes)} min</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex justify-end">
                      {qty === 0 ? (
                        <Button
                          type="button"
                          onClick={() => setQty(sub.id, 1)}
                          className="bg-[#00B4D8] hover:bg-[#0096c7] text-white font-extrabold text-xs sm:text-sm px-5 py-2 sm:px-6 sm:py-2.5 rounded-full shadow-xs active:scale-95 cursor-pointer"
                        >
                          {isAr ? "إضافة +" : "Add +"}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 rounded-full border border-[#00B4D8] bg-cyan-50/60 px-2 py-1.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setQty(sub.id, qty - 1)}
                            className="grid size-6 place-items-center rounded-full bg-white text-cyan-800 font-bold text-xs shadow-2xs hover:bg-slate-50 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-extrabold text-cyan-950 px-1">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(sub.id, qty + 1)}
                            className="grid size-6 place-items-center rounded-full bg-[#00B4D8] text-white font-bold text-xs shadow-2xs hover:bg-[#0096c7] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
