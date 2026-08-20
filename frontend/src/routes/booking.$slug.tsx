import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Loader2, MapPin, Plus, Tag } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { FREQUENCY_OPTIONS } from "@/frontend/lib/frequency";
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

const STEP_KEYS = [
  "booking.step.details",
  "booking.step.addons",
  "booking.step.datetime",
  "booking.step.address",
  "booking.step.confirm",
];

function BookingWizard() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const freqLabel = (key: string | null | undefined) => t(`freq.${key ?? "one_time"}`);
  const { session, loading } = useSession();

  const [step, setStep] = useState(0);
  const [hours, setHours] = useState(2);
  const [professionals, setProfessionals] = useState(1);
  const [materials, setMaterials] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [optionQty, setOptionQty] = useState<Record<string, number>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [date, setDate] = useState(upcomingDates(1)[0]!);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [newStreet, setNewStreet] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const { save: saveLocation } = useSavedLocation();
  const [frequency, setFrequency] = useState("one_time");
  const [freqOpen, setFreqOpen] = useState(false);
  const [freqDraft, setFreqDraft] = useState("one_time");
  const [freqAsked, setFreqAsked] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [idempotencyKey] = useState(() => `bk_${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", search: { redirect: `/booking/${slug}` } });
    }
  }, [loading, session, navigate, slug]);

  useEffect(() => {
    if (step === 2 && !freqAsked) {
      setFreqDraft(frequency);
      setFreqOpen(true);
      setFreqAsked(true);
    }
  }, [step, freqAsked, frequency]);

  const { data: detail } = useQuery({
    queryKey: ["service", slug],
    queryFn: () => getServiceDetail(slug),
  });

  const addonPayload = useMemo(() => addonIds.map((id) => ({ id, quantity: 1 })), [addonIds]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const optionGroups: any[] = (detail as any)?.option_groups ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const selectedOptions = variantPayload
    .map((v) => ({ ...allVariants.find((x) => x.id === v.id), quantity: v.quantity }))
    .filter((v) => v.id);
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
      couponCode,
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
        couponCode: couponCode || null,
        frequency,
      }),
  });

  const duration = quote?.duration_minutes ?? 120;

  const { data: availability } = useQuery({
    queryKey: ["availability", date, duration],
    queryFn: () => getAvailability(date, duration),
    enabled: step >= 2,
  });

  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => getMyAddresses(),
    enabled: Boolean(session),
  });

  const addAddress = useMutation({
    mutationFn: (street: string) => createAddress({ label: "Home", street }),
    onSuccess: async (row) => {
      setNewStreet("");
      setAddressId(row.id);
      await refetchAddresses();
    },
  });

  const confirm = useMutation({
    mutationFn: () =>
      createBooking({
        serviceSlug: slug,
        hours,
        professionals,
        materials,
        variantIds: variantPayload,
        addonIds: addonPayload,
        couponCode: couponCode || null,
        frequency,
        addressId: addressId!,
        scheduledDate: date,
        scheduledStart: slotStart!,
        instructions: instructions || undefined,
        paymentMethod,
        idempotencyKey,
      }),
    onSuccess: () => navigate({ to: "/dashboard" }),
    onError: (err) => setError(err instanceof Error ? err.message : t("booking.failed")),
  });

  const canContinue = useMemo(() => {
    if (step === 0 && hasOptions) return variantPayload.length > 0;
    if (step === 2) return Boolean(slotStart);
    if (step === 3) return Boolean(addressId);
    return true;
  }, [step, slotStart, addressId, hasOptions, variantPayload.length]);

  const addons = detail?.addons ?? [];
  const selectedAddons = addons.filter((a) => addonIds.includes(a.id));
  const selectedAddress = addresses.find((a) => a.id === addressId) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm text-muted-foreground">
        {t("booking.stepOf")} {step + 1} {t("booking.of")} {STEP_KEYS.length} ·{" "}
        {t(STEP_KEYS[step]!)}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {localizedText(detail?.service, "name", locale) ?? t("booking.fallbackTitle")}
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {step === 0 && hasOptions ? (
            <section className="space-y-5 rounded-xl border border-border bg-card p-5">
              <div>
                <h2 className="text-lg font-semibold">{t("booking.needTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("booking.needBody")}</p>
              </div>

              {optionGroups.length ? (
                <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                  {optionGroups.map((g) => {
                    const active = g.id === selectedGroupId;
                    const count = (g.options ?? []).filter(
                      (o: { id: string }) => (optionQty[o.id] ?? 0) > 0,
                    ).length;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveGroup(g.id)}
                        className={`relative w-32 shrink-0 overflow-hidden rounded-xl border text-start transition ${
                          active
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:shadow-md"
                        }`}
                      >
                        <div className="aspect-square bg-muted">
                          <img
                            src={resolveImageUrl(g.image_url) || FALLBACK_IMAGE}
                            alt={g.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        {count ? (
                          <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {count}
                          </span>
                        ) : null}
                        <p className="line-clamp-2 p-2 text-xs font-medium">
                          {localizedText(g, "name", locale) ?? g.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="space-y-3">
                {visibleOptions.length ? (
                  visibleOptions.map(
                    (o: {
                      id: string;
                      name: string;
                      description?: string | null;
                      image_url?: string | null;
                      price: number | string;
                      original_price?: number | string | null;
                      max_quantity?: number | null;
                    }) => {
                      const qty = optionQty[o.id] ?? 0;
                      const max = Number(o.max_quantity) || 10;
                      return (
                        <div
                          key={o.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 ${
                            qty ? "border-primary bg-primary-soft/40" : "border-border"
                          }`}
                        >
                          {o.image_url ? (
                            <img
                              src={resolveImageUrl(o.image_url)}
                              alt=""
                              loading="lazy"
                              className="size-14 rounded-lg object-cover"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{o.name}</p>
                            {o.description ? (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {o.description}
                              </p>
                            ) : null}
                            <p className="mt-1 text-sm">
                              <span className="font-semibold">{formatMoney(Number(o.price))}</span>
                              {o.original_price && Number(o.original_price) > Number(o.price) ? (
                                <span className="ms-2 text-xs text-muted-foreground line-through">
                                  {formatMoney(Number(o.original_price))}
                                </span>
                              ) : null}
                            </p>
                          </div>
                          {qty ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQty(o.id, qty - 1)}
                                aria-label={t("booking.decrease")}
                              >
                                −
                              </Button>
                              <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={qty >= max}
                                onClick={() => setQty(o.id, qty + 1)}
                                aria-label={t("booking.increase")}
                              >
                                +
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => setQty(o.id, 1)}>
                              {t("booking.add")}
                            </Button>
                          )}
                        </div>
                      );
                    },
                  )
                ) : (
                  <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    {t("booking.noOptions")}
                  </p>
                )}
              </div>

              {!variantPayload.length ? (
                <p className="text-xs text-muted-foreground">{t("booking.selectOne")}</p>
              ) : null}

              <div>
                <Label htmlFor="instructions" className="mb-2 block">
                  {t("booking.instructions")}
                </Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t("booking.instructionsPlaceholder")}
                />
              </div>
            </section>
          ) : null}

          {step === 0 && !hasOptions ? (
            <section className="space-y-6 rounded-xl border border-border bg-card p-5">
              <div>
                <Label className="mb-2 block">{t("booking.hours")}</Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                    <button
                      key={h}
                      onClick={() => setHours(h)}
                      className={`size-11 rounded-lg border text-sm ${
                        hours === h
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">{t("booking.pros")}</Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((p) => (
                    <button
                      key={p}
                      onClick={() => setProfessionals(p)}
                      className={`size-11 rounded-lg border text-sm ${
                        professionals === p
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">{t("booking.materials")}</Label>
                <div className="flex gap-2">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setMaterials(v)}
                      className={`h-11 rounded-lg border px-5 text-sm ${
                        materials === v
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border"
                      }`}
                    >
                      {v ? t("booking.yes") : t("booking.no")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="instructions" className="mb-2 block">
                  {t("booking.instructions")}
                </Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t("booking.instructionsPlaceholder")}
                />
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold">{t("booking.addonsTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("booking.addonsBody")}</p>
              {addons.length ? (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {addons.map((a) => {
                    const selected = addonIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setAddonIds((prev) =>
                            prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                          )
                        }
                        className={`group overflow-hidden rounded-xl border bg-card text-start transition-all ${
                          selected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:shadow-md"
                        }`}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <img
                            src={resolveImageUrl(a.image_url) || FALLBACK_IMAGE}
                            alt={a.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span
                            className={`absolute right-2 bottom-2 grid size-8 place-items-center rounded-full shadow-sm ${
                              selected
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-primary"
                            }`}
                            aria-hidden
                          >
                            {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
                          </span>
                        </div>
                        <div className="space-y-1 p-3">
                          <p className="truncate text-sm font-medium">
                            {localizedText(a, "name", locale) ?? a.name}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">{formatMoney(Number(a.price))}</span>
                            {a.original_price && Number(a.original_price) > Number(a.price) ? (
                              <span className="ms-2 text-xs text-muted-foreground line-through">
                                {formatMoney(Number(a.original_price))}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  {t("booking.noAddons")}
                </p>
              )}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <button
                type="button"
                onClick={() => {
                  setFreqDraft(frequency);
                  setFreqOpen(true);
                }}
                className="mb-4 flex w-full items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-start text-sm hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium">{t("booking.row.frequency")}</span>
                    <span className="block text-muted-foreground">{freqLabel(frequency)}</span>
                  </span>
                </span>
                <span className="text-primary">{t("freq.change")}</span>
              </button>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
                {upcomingDates(14).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDate(d);
                      setSlotStart(null);
                    }}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-xs ${
                      date === d ? "border-primary bg-primary-soft text-primary" : "border-border"
                    }`}
                  >
                    {new Date(`${d}T00:00:00Z`).toLocaleDateString(
                      locale === "ar" ? "ar-AE" : "en-AE",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      },
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(availability?.slots ?? []).map((s) => (
                  <button
                    key={s.start}
                    disabled={s.state === "unavailable" || s.state === "expired"}
                    onClick={() => setSlotStart(s.start)}
                    className={`rounded-lg border px-2 py-2 text-xs disabled:opacity-40 ${
                      slotStart === s.start
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border"
                    }`}
                  >
                    {s.start}
                    {s.state === "limited" ? (
                      <span className="block text-[10px] text-warning">
                        {t("booking.slotLeft")}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-4 rounded-xl border border-border bg-card p-5">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAddressId(a.id)}
                  className={`block w-full rounded-lg border px-4 py-3 text-start text-sm ${
                    addressId === a.id ? "border-primary bg-primary-soft" : "border-border"
                  }`}
                >
                  <span className="font-medium">{a.label}</span>
                  <span className="block text-muted-foreground">{a.street}</span>
                </button>
              ))}
              <div className="space-y-2 border-t border-border pt-4">
                <Label htmlFor="street">{t("booking.addAddress")}</Label>
                <Input
                  id="street"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder={t("booking.addressPlaceholder")}
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setPickerOpen(true)}>
                    <MapPin className="size-4" aria-hidden /> {t("booking.selectOnMap")}
                  </Button>
                  <Button
                    disabled={!newStreet.trim() || addAddress.isPending}
                    onClick={() => {
                      const value = newStreet.trim();
                      if (!isInDubai(value)) {
                        toast.error(SERVICE_AREA_MESSAGE);
                        return;
                      }
                      addAddress.mutate(value);
                    }}
                  >
                    {addAddress.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    {t("booking.saveAddress")}
                  </Button>
                </div>
                {addAddress.isError ? (
                  <p className="text-xs text-destructive">{t("booking.addressError")}</p>
                ) : null}
              </div>
              <LocationPicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onSelect={(loc) => {
                  if (!isInDubai(loc.address, loc.lat, loc.lng)) {
                    toast.error(SERVICE_AREA_MESSAGE);
                    return;
                  }
                  saveLocation(loc);
                  setNewStreet(loc.address);
                  addAddress.mutate(loc.address);
                }}
              />
            </section>
          ) : null}

          {step === 4 ? (
            <section className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div>
                <Label htmlFor="coupon">{t("booking.coupon")}</Label>
                <Input
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME20"
                />
                {quote?.coupon_error ? (
                  <p className="mt-1 text-xs text-destructive">{quote.coupon_error}</p>
                ) : null}
              </div>
              <div>
                <Label className="mb-2 block">{t("booking.payment")}</Label>
                <div className="flex gap-2">
                  {["cash", "card", "wallet"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`h-11 rounded-lg border px-4 text-sm capitalize ${
                        paymentMethod === m
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border"
                      }`}
                    >
                      {t(`booking.pay.${m}`)}
                    </button>
                  ))}
                </div>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </section>
          ) : null}

          <div className="flex gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                {t("common.back")}
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/services/$slug" params={{ slug }}>
                  {t("booking.backToService")}
                </Link>
              </Button>
            )}
            {step < 4 ? (
              <Button disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                {t("common.continue")}
              </Button>
            ) : (
              <Button
                disabled={confirm.isPending || !addressId || !slotStart}
                onClick={() => confirm.mutate()}
              >
                {confirm.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("booking.confirm")}
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">{t("booking.summary")}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row
                label={t("booking.row.address")}
                value={selectedAddress?.street ?? newStreet.trim()}
                placeholder={t("booking.notSelected")}
              />
              <Row label={t("booking.row.frequency")} value={freqLabel(frequency)} />
              <Row
                label={t("booking.row.service")}
                value={localizedText(detail?.service, "name", locale) ?? "—"}
              />
              <Row
                label={t("booking.row.duration")}
                value={`${Math.round(duration / 60)} ${t("booking.hoursShort")}`}
              />
              <Row label={t("booking.row.pros")} value={String(professionals)} />
              <Row
                label={t("booking.row.materials")}
                value={materials ? t("booking.yes") : t("booking.no")}
              />
              <Row
                label={t("booking.row.when")}
                value={slotStart ? `${date} · ${slotStart}` : ""}
                placeholder={t("booking.notSelected")}
              />
              {instructions.trim() ? (
                <Row label={t("booking.row.instructions")} value={instructions.trim()} />
              ) : null}
            </dl>

            {selectedOptions.length ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-medium">{t("booking.selectedOptions")}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {selectedOptions.map((o) => (
                    <li key={o.id} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        {localizedText(o, "name", locale) ?? o.name}
                        {o.quantity > 1 ? ` × ${o.quantity}` : ""}
                      </span>
                      <span>{formatMoney(Number(o.price) * o.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selectedAddons.length ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-medium">{t("booking.addons")}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {selectedAddons.map((a) => (
                    <li key={a.id} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        {localizedText(a, "name", locale) ?? a.name}
                      </span>
                      <span>{formatMoney(Number(a.price))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {quote ? (
              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <Row
                  label={t("booking.subtotal")}
                  value={formatMoney(quote.breakdown.subtotal + quote.breakdown.items)}
                />
                {quote.breakdown.addons ? (
                  <Row label={t("booking.addons")} value={formatMoney(quote.breakdown.addons)} />
                ) : null}
                {quote.breakdown.materials ? (
                  <Row
                    label={t("booking.materialsLine")}
                    value={formatMoney(quote.breakdown.materials)}
                  />
                ) : null}
                {quote.breakdown.discount ? (
                  <Row
                    label={t("booking.couponDiscount")}
                    value={`-${formatMoney(quote.breakdown.discount)}`}
                  />
                ) : null}
                {quote.breakdown.frequency_discount ? (
                  <Row
                    label={`${freqLabel(frequency)} ${t("booking.discount")}`}
                    value={`-${formatMoney(quote.breakdown.frequency_discount)}`}
                  />
                ) : null}
                <Row label={t("booking.fee")} value={formatMoney(quote.breakdown.fees)} />
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <span>{t("common.total")}</span>
                  <span>{formatMoney(quote.breakdown.total)}</span>
                </div>
              </dl>
            ) : null}
          </div>
        </aside>

        <Dialog open={freqOpen} onOpenChange={setFreqOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("freq.title")}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pe-1">
              {FREQUENCY_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setFreqDraft(o.key)}
                  className={`relative flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-4 text-start ${
                    freqDraft === o.key ? "border-primary bg-primary-soft" : "border-border"
                  }`}
                >
                  {o.popular ? (
                    <span className="absolute -top-2 start-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {t("freq.mostPopular")}
                    </span>
                  ) : null}
                  <span>
                    <span className="block font-medium">{t(`freq.${o.key}`)}</span>
                    {o.badge ? (
                      <span className="mt-1 inline-block rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        {t(`freq.badge.${o.key}`)}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                      freqDraft === o.key ? "border-primary" : "border-muted-foreground/40"
                    }`}
                    aria-hidden
                  >
                    {freqDraft === o.key ? (
                      <span className="size-2.5 rounded-full bg-primary" />
                    ) : null}
                  </span>
                </button>
              ))}

              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">{t("freq.promiseTitle")}</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex gap-2">
                    <Tag className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block font-medium">{t("freq.moreDays")}</span>
                      <span className="block text-muted-foreground">{t("freq.moreDaysBody")}</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block font-medium">{t("freq.reschedule")}</span>
                      <span className="block text-muted-foreground">
                        {t("freq.rescheduleBody")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={() => {
                  setFrequency(freqDraft);
                  setFreqOpen(false);
                }}
              >
                {t("freq.select")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
}) {
  const shown = value?.trim() ? value : (placeholder ?? "—");
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`text-end ${value?.trim() ? "" : "text-muted-foreground"}`}>{shown}</dd>
    </div>
  );
}
