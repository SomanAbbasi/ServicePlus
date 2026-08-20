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
import {
  getServiceDetail,
  getQuote,
  getAvailability,
  getMyAddresses,
  createAddress,
  createBooking,
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

export const Route = createFileRoute("/booking/$slug")({
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
  { id: "one_time", title: "One Time", badge: null, popular: false },
  { id: "every_2_weeks", title: "Every 2 Weeks", badge: "5% Off", popular: false },
  { id: "once_a_week", title: "Once a Week", badge: "10% Off", popular: true },
  { id: "multiple_times_a_week", title: "Multiple Times a Week", badge: "Up to 25% off", popular: false },
];

function BookingWizard() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const isAr = locale === "ar";
  const { session } = useSession();

  const [step, setStep] = useState(0);
  const [hours, setHours] = useState(2);
  const [professionals, setProfessionals] = useState(1);
  const [materials, setMaterials] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [optionQty, setOptionQty] = useState<Record<string, number>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

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
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash | card
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [idempotencyKey] = useState(() => `bk_${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState<string | null>(null);

  const { data: detail } = useQuery({
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

  const addonPayload = useMemo(() => addonIds.map((id) => ({ id, quantity: 1 })), [addonIds]);

  const optionGroups: any[] = (detail as any)?.option_groups ?? [];
  const allVariants: any[] = (detail as any)?.variants ?? [];
  const ungroupedOptions = allVariants.filter((v) => !v.group_id);
  const hasOptions = optionGroups.length > 0 || ungroupedOptions.length > 0;
  const selectedGroupId = activeGroup ?? optionGroups[0]?.id ?? null;
  const visibleOptions = selectedGroupId
    ? (optionGroups.find((g) => g.id === selectedGroupId)?.options ?? [])
    : ungroupedOptions;

  const variantPayload = useMemo(
    () =>
      Object.entries(optionQty)
        .filter(([, q]) => q > 0)
        .map(([id, quantity]) => ({ id, quantity })),
    [optionQty],
  );

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
        const row = await createAddress({
          label: "Home",
          street: manualAddress.trim() || savedLoc?.address || "Dubai, UAE",
        });
        finalAddressId = row.id;
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
    onSuccess: () => {
      toast.success(isAr ? "تم إرسال الطلب بنجاح!" : "Order placed successfully!");
      navigate({ to: "/dashboard" });
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
    if (step === 0) {
      setStep(hasAddons ? 1 : 2);
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
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

  const canContinue = useMemo(() => {
    if (step === 0 && hasOptions) return variantPayload.length > 0;
    if (step === 2) return Boolean(slotStart);
    if (step === 3) return Boolean(addressId || manualAddress.trim() || savedLoc?.address);
    return true;
  }, [step, slotStart, addressId, manualAddress, savedLoc, hasOptions, variantPayload.length]);

  const serviceTitle = localizedText(detail?.service, "name", locale) ?? "Home Cleaning";
  const displayAddress =
    manualAddress || savedLoc?.address || "F93H+PHX - Al Mushrif - W24 02 - Abu Dhabi - United Arab Emirates";

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
    const month = dObj.toLocaleDateString("en-US", { month: "short" });
    const year = dObj.getFullYear();
    return `${day} ${month} ${year}`;
  }, [date]);

  const frequencyTitle = useMemo(() => {
    const found = FREQUENCY_LIST.find((f) => f.id === frequency);
    return found ? `${found.title} Service` : "One Time Service";
  }, [frequency]);

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
            <span>Step {currentStepNumber} of {totalSteps}</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {serviceTitle}
            </h1>
            {detail?.service?.rating ? (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{String(detail.service.rating)}</span>
                </div>
                <span>({detail.service.reviewCount ? Number(detail.service.reviewCount).toLocaleString() : "28,557"} bookings)</span>
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
                {hasOptions ? (
                  /* Deep Cleaning / Multi-Group Sub-Category Selector (Matching Screenshot media_1787231010179.png) */
                  <div className="space-y-6">
                    {/* Horizontal Group Selector Tabs */}
                    {optionGroups.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {optionGroups.map((g) => {
                          const isGroupSelected = selectedGroupId === g.id;
                          const groupImg = resolveImageUrl(g.imageUrl || g.image_url) || FALLBACK_IMAGE;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setActiveGroup(g.id)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all shrink-0 w-28 text-center ${
                                isGroupSelected
                                  ? "border-cyan-500 bg-cyan-50/60 ring-2 ring-cyan-500/20 shadow-xs"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="size-12 rounded-xl overflow-hidden bg-slate-100 mb-2">
                                <img src={groupImg} alt={g.name} className="size-full object-cover" />
                              </div>
                              <span className={`text-[11px] font-bold leading-tight line-clamp-2 ${
                                isGroupSelected ? "text-cyan-900" : "text-slate-700"
                              }`}>
                                {g.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Visible Package Options under Active Group */}
                    <div className="space-y-4 pt-2">
                      {visibleOptions.map((opt: any) => {
                        const qty = optionQty[opt.id] || 0;
                        const optImg = resolveImageUrl(opt.imageUrl || opt.image_url) || FALLBACK_IMAGE;
                        const optOriginal = opt.originalPrice || opt.original_price;

                        return (
                          <div
                            key={opt.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs"
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="size-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                                <img src={optImg} alt={opt.name} className="size-full object-cover" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <h4 className="text-sm font-extrabold text-slate-900">{opt.name}</h4>
                                {opt.description && (
                                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                    {opt.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-sm font-extrabold text-slate-900">
                                    AED {Number(opt.price).toFixed(0)}
                                  </span>
                                  {optOriginal && (
                                    <span className="text-xs text-slate-400 line-through font-semibold">
                                      AED {Number(optOriginal).toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 self-end sm:self-center">
                              {qty === 0 ? (
                                <Button
                                  type="button"
                                  onClick={() => setQty(opt.id, 1)}
                                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs px-5 py-2 rounded-full shadow-2xs"
                                >
                                  Add +
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2 rounded-full border border-cyan-500 bg-cyan-50 px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => setQty(opt.id, qty - 1)}
                                    className="grid size-6 place-items-center rounded-full bg-white text-cyan-800 font-bold text-xs shadow-2xs"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-extrabold text-cyan-900 px-1">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setQty(opt.id, qty + 1)}
                                    className="grid size-6 place-items-center rounded-full bg-cyan-600 text-white font-bold text-xs shadow-2xs"
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

                    <div className="pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        onClick={goNext}
                        disabled={!canContinue}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-sm py-3.5 rounded-full shadow-md"
                      >
                        Next
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
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
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
                        {[1, 2, 3, 4].map((p) => (
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
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Label className="text-xs sm:text-sm font-bold text-slate-900">
                          {isAr ? "هل تحتاج مواد تنظيف؟" : "Need cleaning materials?"}
                        </Label>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          Powered by <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white italic font-black">Jif</span>
                        </span>
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
                        </button>
                      </div>
                    </div>

                    {/* Fuel Surcharge Promo Banner */}
                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3.5 flex items-center gap-2.5 text-xs text-cyan-900 font-bold leading-relaxed">
                      <Sparkles className="size-4 text-cyan-600 shrink-0" />
                      <span>First booking? Your fuel surcharge fee is on us. Enjoy!</span>
                    </div>

                    {/* Instructions Textarea */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold text-slate-700">
                          {isAr ? "أي تعليمات أو متطلبات خاصة؟" : "Any instructions or special requirements?"}
                        </Label>
                        <span className="text-[11px] text-slate-400 font-medium">{instructions.length}/150</span>
                      </div>
                      <Textarea
                        maxLength={150}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Gate code, pets, parking instructions..."
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
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* STEP 1.5: Popular Add-ons Grid (Matching Screenshot media_1787230745646.png) */}
            {step === 1 && hasAddons && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Popular Add-ons</h2>
                  <p className="mt-0.5 text-xs font-bold text-slate-600">People also added</p>
                </div>

                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                  {addons.map((a: any) => {
                    const selected = addonIds.includes(a.id);
                    const addonImg = resolveImageUrl(a.image_url || a.imageUrl) || FALLBACK_IMAGE;
                    const addonPrice = Number(a.price || 0);
                    const originalPrice = a.original_price || a.originalPrice;

                    return (
                      <div
                        key={a.id}
                        onClick={() =>
                          setAddonIds((prev) =>
                            selected ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                          )
                        }
                        className={`group relative flex flex-col overflow-hidden rounded-2xl border cursor-pointer transition-all ${
                          selected
                            ? "border-cyan-500 bg-cyan-50/30 ring-2 ring-cyan-500/20 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                          <img
                            src={addonImg}
                            alt={a.name}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Circular Cyan Plus / Check Action Button */}
                          <div
                            className={`absolute bottom-2 end-2 grid size-7 place-items-center rounded-full shadow-md transition-transform active:scale-90 ${
                              selected ? "bg-cyan-600 text-white" : "bg-cyan-400 text-white hover:bg-cyan-500"
                            }`}
                          >
                            {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-3">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {localizedText(a, "name", locale) ?? a.name}
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
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={goNext}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs px-8 rounded-full shadow-md"
                  >
                    Next
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 2/3: Date & Time Picker */}
            {step === 2 && (
              <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                {/* Frequency Summary Box (Matching Screenshot media_1787226593343.png) */}
                <div className="rounded-xl border border-cyan-300 bg-cyan-50/70 p-4 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-900">Frequency</p>
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
                    Change
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
                      const dayName = dObj.toLocaleDateString("en-US", { weekday: "short" });
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
                      No slots available today for Dubai time. Please pick a future date.
                    </div>
                  )}
                </div>

                {/* Free Cancellation Banner */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-slate-400 shrink-0" />
                    <span>Enjoy free cancellation up to 6 hours before your booking start time.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPolicyOpen(true)}
                    className="text-xs font-bold text-cyan-600 underline shrink-0 ms-2"
                  >
                    View our policy
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={goBack} className="text-xs font-bold">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={!canContinue}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs px-8 rounded-full shadow-md"
                  >
                    Next
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 3: Address Selection */}
            {step === 3 && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t("booking.step.address")}</h2>
                  <p className="mt-1 text-xs text-slate-500">Service available in Dubai Emirate only</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="Enter Dubai address (Villa, Apartment, Area)"
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPickerOpen(true)}
                      className="shrink-0 text-xs font-bold"
                    >
                      <MapPin className="size-3.5 me-1 text-cyan-600" />
                      Map
                    </Button>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={goBack} className="text-xs font-bold">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={!canContinue}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs px-8 rounded-full shadow-md"
                  >
                    Next
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 4: Verification & Payment */}
            {step === 4 && (
              <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Verification & Payment</h2>
                  <p className="mt-1 text-xs text-slate-500">Verify phone number and select payment method</p>
                </div>

                {/* Phone Verification */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">Phone Number Verification</Label>
                    {phoneVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        Verified
                      </span>
                    )}
                  </div>

                  {!phoneVerified ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+971 50 123 4567"
                          className="text-xs bg-white"
                        />
                        <Button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpSending || otpSent}
                          className="bg-cyan-600 font-bold text-white hover:bg-cyan-700 shrink-0 text-xs"
                        >
                          {otpSending ? <Loader2 className="size-3.5 animate-spin" /> : "Send OTP"}
                        </Button>
                      </div>

                      {otpSent && (
                        <div className="space-y-2 pt-1">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="Enter 6-digit OTP (123456)"
                              className="text-xs bg-white font-mono tracking-widest"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyOtp}
                              className="bg-slate-900 font-bold text-white hover:bg-slate-800 shrink-0 text-xs"
                            >
                              Verify OTP
                            </Button>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold italic">
                            💡 Demo verification code is: <span className="font-bold text-cyan-600">123456</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span>{phone}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Code */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <Label className="text-xs font-bold text-slate-800">Apply Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. 50MOP"
                      className="text-xs uppercase bg-white font-mono"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-cyan-600 font-bold text-white hover:bg-cyan-700 shrink-0 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-800">Select Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-start transition-all ${
                        paymentMethod === "cash"
                          ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <Wallet className="size-5 text-cyan-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">Cash on Delivery</p>
                        <p className="text-[10px] text-slate-500 truncate">Pay cash directly</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-start transition-all ${
                        paymentMethod === "card"
                          ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <CardIcon className="size-5 text-cyan-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">Credit Card</p>
                        <p className="text-[10px] text-slate-500 truncate">Online payment</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={goBack} className="text-xs font-bold">
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={confirm.isPending}
                    onClick={() => confirm.mutate()}
                    className="bg-emerald-600 font-extrabold text-white hover:bg-emerald-700 text-xs px-8 rounded-full shadow-md"
                  >
                    {confirm.isPending ? <Loader2 className="size-4 animate-spin me-2" /> : null}
                    Place Order & Confirm
                  </Button>
                </div>
              </section>
            )}
          </div>

          {/* Right-Hand Sidebar ("Booking Details") */}
          <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs min-w-0 w-full overflow-hidden">
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg border-b border-slate-100 pb-4">
              Booking Details
            </h2>

            <div className="mt-4 space-y-4 text-xs min-w-0">
              <div className="min-w-0">
                <span className="text-slate-400 font-semibold block mb-0.5">Address</span>
                <span className="font-bold text-slate-800 block leading-relaxed break-words max-w-full">
                  {displayAddress}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Frequency</span>
                <span className="font-bold text-slate-800 text-end">{frequencyTitle}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Service</span>
                <span className="font-bold text-slate-800 text-end truncate">{serviceTitle}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Duration</span>
                <span className="font-bold text-slate-800 text-end">{hours} hours</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Date & Start Time</span>
                <span className="font-bold text-slate-800 text-end">
                  {formattedDateString}, {formattedTimeRange}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Number of Professionals</span>
                <span className="font-bold text-slate-800 text-end">{professionals}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Material</span>
                <span className="font-bold text-slate-800 text-end">{materials ? "Yes" : "No"}</span>
              </div>

              {/* Selected Options/Variants List */}
              {Object.entries(optionQty).some(([, q]) => q > 0) && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-slate-400 font-semibold block mb-1">Selected Package / Options</span>
                  {Object.entries(optionQty)
                    .filter(([, q]) => q > 0)
                    .map(([vId, q]) => {
                      const v = allVariants.find((item: any) => item.id === vId);
                      if (!v) return null;
                      const itemPrice = Number(v.price || v.base_price || 0) * q;
                      return (
                        <div key={vId} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700 truncate me-2">
                            {v.name} {q > 1 ? `(x${q})` : ""}
                          </span>
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
                  <span className="text-slate-400 font-semibold block mb-1">Selected Add-ons</span>
                  {addons
                    .filter((a: any) => addonIds.includes(a.id))
                    .map((a: any) => (
                      <div key={a.id} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 truncate">{a.name}</span>
                        <span className="font-extrabold text-cyan-600 shrink-0">
                          +AED {Number(a.price).toFixed(0)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Payment Summary Box */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <h3 className="font-extrabold text-slate-900 text-sm mb-3">Payment Summary</h3>
                
                {(quote?.breakdown as any)?.subtotal !== undefined && Number((quote?.breakdown as any)?.subtotal) > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Base Service</span>
                    <span>AED {Number((quote?.breakdown as any)?.subtotal || 0).toFixed(2)}</span>
                  </div>
                )}

                {(quote?.breakdown as any)?.items !== undefined && Number((quote?.breakdown as any)?.items) > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Package Options</span>
                    <span>AED {Number((quote?.breakdown as any)?.items || 0).toFixed(2)}</span>
                  </div>
                )}

                {(quote?.breakdown as any)?.addons !== undefined && Number((quote?.breakdown as any)?.addons) > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Add-ons Total</span>
                    <span>AED {Number((quote?.breakdown as any)?.addons || 0).toFixed(2)}</span>
                  </div>
                )}

                {(quote?.breakdown as any)?.discount ? (
                  <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>-AED {Number((quote?.breakdown as any)?.discount || 0).toFixed(2)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-slate-900 font-black">
                    AED {Number((quote?.breakdown as any)?.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FREQUENCY SELECTION MODAL (Matching Uploaded Screenshots media_1787226500832.png & media_1787226538814.png) */}
      <Dialog open={freqOpen} onOpenChange={setFreqOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl overflow-hidden">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              Choose your frequency
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
                      Most popular
                    </span>
                  )}

                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{item.title}</p>
                    {item.badge && (
                      <span className="mt-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        {item.badge}
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
                <span className="text-cyan-600 font-extrabold text-base">serviceplus</span>
                <span className="font-extrabold text-slate-900 text-base">Promise</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Tag className="size-4 text-slate-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Any Mess, Any Time</p>
                    <p className="text-[11px] text-slate-500">Top-rated professionals, ready when you need them.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CalendarClock className="size-4 text-slate-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Book Instantly, Stay Flexible</p>
                    <p className="text-[11px] text-slate-500">Multiple slots available with no commitment.</p>
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
              Select
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CANCELLATION & SERVICE POLICY MODAL */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              Service & Cancellation Policy
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs leading-relaxed text-slate-600">
            <div className="space-y-1">
              <p className="font-extrabold text-slate-900 text-sm">Free Cancellation</p>
              <p>You can cancel or reschedule your booking free of charge up to 6 hours before your scheduled start time.</p>
            </div>

            <div className="space-y-1">
              <p className="font-extrabold text-slate-900 text-sm">Late Cancellation Fee</p>
              <p>Cancellations made less than 6 hours prior to start time may incur a nominal AED 25 fee to compensate assigned professionals.</p>
            </div>

            <div className="space-y-1">
              <p className="font-extrabold text-slate-900 text-sm">100% Satisfaction Guarantee</p>
              <p>If you are not satisfied with your service, contact us within 24 hours and we will send a top professional to re-clean free of charge.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button
              type="button"
              onClick={() => setPolicyOpen(false)}
              className="w-full bg-slate-900 text-white font-extrabold py-3 rounded-full text-xs"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LocationPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(loc) => {
          setManualAddress(loc.address);
          saveLocation(loc);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
