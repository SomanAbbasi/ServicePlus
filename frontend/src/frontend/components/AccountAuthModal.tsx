/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, MapPin, Search, Check, Maximize2, Minimize2, Crosshair, Loader2 } from "lucide-react";
import { requestOtp, verifyOtp, updateProfile, createAddress, reverseGeocode, searchPlaces } from "@/frontend/lib/api-services";
import { useAuth } from "@/frontend/lib/auth-context";
import { useSavedLocation } from "@/frontend/lib/location";
import { DUBAI_CENTER, loadMapboxGl, MAPBOX_ACCESS_TOKEN } from "@/frontend/lib/mapbox";
import { toast } from "sonner";

interface CountryCode {
  name: string;
  code: string;
  flag: string;
}

const COUNTRIES: CountryCode[] = [
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Qatar", code: "+974", flag: "🇶🇦" },
  { name: "Oman", code: "+968", flag: "🇴🇲" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼" },
  { name: "Bahrain", code: "+973", flag: "🇧🇭" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Jordan", code: "+962", flag: "🇯🇴" },
  { name: "Lebanon", code: "+961", flag: "🇱🇧" },
];

export function AccountAuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { setAuth } = useAuth();
  const { location } = useSavedLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Multi-step state: 'phone' | 'otp' | 'address' | 'personal'
  const [step, setStep] = useState<"phone" | "otp" | "address" | "personal">("phone");

  // Step 1: Phone
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRIES[0]!);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phone, setPhone] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 2: OTP
  const [otpCode, setOtpCode] = useState("");

  // Step 3: Address Details & Interactive Map
  const [addressTab, setAddressTab] = useState<"home" | "work" | "other">("home");
  const [otherLabel, setOtherLabel] = useState("");
  // Default values come strictly from user location or empty string (no hardcoded "Test" or "Toyota Building")
  const [buildingName, setBuildingName] = useState(location?.address || "");
  const [flatNo, setFlatNo] = useState("");
  const [directions, setDirections] = useState("");

  // Mapbox & Location Search state
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [geocodingBusy, setGeocodingBusy] = useState(false);
  const [coords, setCoords] = useState(
    location?.lat && location?.lng ? { lat: location.lat, lng: location.lng } : DUBAI_CENTER,
  );

  // Step 4: Personal Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"Female" | "Male" | "Rather Not Say">("Rather Not Say");

  // Lazy Load Mapbox GL when Step 3 is open
  useEffect(() => {
    if (step !== "address" || !MAPBOX_ACCESS_TOKEN) return;
    let cancelled = false;

    loadMapboxGl()
      .then((mapboxgl) => {
        if (cancelled || !mapElRef.current) return;
        const map = new mapboxgl.Map({
          container: mapElRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [coords.lng, coords.lat],
          zoom: 14,
        });

        const marker = new mapboxgl.Marker({ draggable: true, color: "#ef4444" })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);

        mapRef.current = map;
        markerRef.current = marker;

        const updateFromCoords = async (lat: number, lng: number) => {
          setCoords({ lat, lng });
          setGeocodingBusy(true);
          try {
            const addr = await reverseGeocode(lat, lng);
            if (addr && !cancelled) {
              setBuildingName(addr);
            }
          } catch {
            /* keep user input */
          } finally {
            if (!cancelled) setGeocodingBusy(false);
          }
        };

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          void updateFromCoords(lngLat.lat, lngLat.lng);
        });

        map.on("click", (e: any) => {
          const { lat, lng } = e.lngLat;
          marker.setLngLat([lng, lat]);
          void updateFromCoords(lat, lng);
        });
      })
      .catch(() => {
        /* Map fallback */
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [step]);

  // Resize map canvas when toggling map height
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.resize(), 200);
    }
  }, [mapExpanded]);

  // Auto-sync location from useSavedLocation when modal opens
  useEffect(() => {
    if (location?.address) {
      setBuildingName((prev) => (prev.trim() ? prev : location.address));
    }
    if (location?.lat && location?.lng) {
      setCoords({ lat: location.lat, lng: location.lng });
    }
  }, [location, open, step]);

  if (!open || !mounted) return null;

  const fullPhone = `${selectedCountry.code}${phone.replace(/\D/g, "")}`;

  // Step 1 Submit: Send OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtp(fullPhone);
      setDevCode(res.dev_code ?? "123456");
      setOtpCode(res.dev_code ?? "123456");
      setStep("otp");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submit: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error("Please enter the verification code");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(fullPhone, otpCode.trim());
      const p = (res.profile || {}) as Record<string, any>;
      const userFullName = typeof p.fullName === "string" ? p.fullName : typeof p.full_name === "string" ? p.full_name : null;
      const userEmail = typeof p.email === "string" ? p.email : null;

      setAuth(res.access_token, res.refresh_token, {
        id: res.user_id,
        phone: fullPhone,
        email: userEmail,
        full_name: userFullName,
        avatar_url: null,
      });

      if (userFullName) setFullName(userFullName);
      if (userEmail) setEmail(userEmail);
      if (location?.address) setBuildingName((prev) => (prev.trim() ? prev : location.address));

      toast.success("Phone verified!");
      setStep("address");
    } catch (err: any) {
      toast.error(err?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Map Place Search
  const handleMapSearch = async (val: string) => {
    setMapSearchQuery(val);
    if (val.trim().length < 3) {
      setMapSearchResults([]);
      return;
    }
    try {
      const res = await searchPlaces(val);
      setMapSearchResults(res);
    } catch {
      setMapSearchResults([]);
    }
  };

  // Step 3 Select Searched Location
  const handleSelectSearchResult = (r: any) => {
    setBuildingName(r.address || r.name);
    setCoords({ lat: r.lat, lng: r.lng });
    if (markerRef.current) markerRef.current.setLngLat([r.lng, r.lat]);
    if (mapRef.current) mapRef.current.flyTo({ center: [r.lng, r.lat], zoom: 15 });
    setMapSearchResults([]);
    setMapSearchQuery("");
  };

  // Step 3 Use Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeocodingBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
        if (mapRef.current) mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        try {
          const addr = await reverseGeocode(lat, lng);
          if (addr) setBuildingName(addr);
        } catch {
          /* keep input */
        } finally {
          setGeocodingBusy(false);
        }
      },
      () => setGeocodingBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Step 3 Submit: Save Address
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingName.trim()) {
      toast.error("Please enter building name / address");
      return;
    }
    setLoading(true);
    try {
      const label = addressTab === "other" ? (otherLabel.trim() || "Other") : addressTab === "work" ? "Work" : "Home";
      await createAddress({
        label,
        street: `${buildingName} ${flatNo ? `- Flat ${flatNo}` : ""}`.trim(),
        building: buildingName,
      });
      toast.success("Address saved!");
      setStep("personal");
    } catch {
      setStep("personal");
    } finally {
      setLoading(false);
    }
  };

  // Step 4 Submit: Complete Personal Details
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        gender,
      });
      toast.success("Account setup complete!");
      onClose();
    } catch {
      toast.success("Account logged in!");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch),
  );

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Dark Backdrop Overlay (No click bypass) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
        
        {/* STEP 1: Phone Login Modal */}
        {step === "phone" && (
          <div className="p-6">
            {/* Header */}
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Log in or sign up</h2>
            </div>

            <form onSubmit={handlePhoneSubmit} className="mt-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Your phone number
                </label>

                {/* Country Code + Phone Input Container */}
                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white p-1 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20">
                  {/* Country Code Button */}
                  <button
                    type="button"
                    onClick={() => setCountryDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <span className="text-base">{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </button>

                  <div className="h-6 w-px bg-slate-200 mx-1" />

                  {/* Phone Input */}
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="50 123 4567"
                    className="flex-1 bg-transparent px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none"
                    autoFocus
                  />
                </div>

                {/* Country Dropdown Drawer */}
                {countryDropdownOpen && (
                  <div className="absolute left-6 right-6 top-32 z-30 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country..."
                        className="w-full rounded-lg bg-slate-50 py-1.5 pl-8 pr-2 text-xs font-medium text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      {filteredCountries.map((c) => (
                        <button
                          key={`${c.name}-${c.code}`}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setCountryDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-start transition-colors ${
                            selectedCountry.code === c.code && selectedCountry.name === c.name
                              ? "bg-cyan-50 font-bold text-cyan-700"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </div>
                          <span className="font-mono text-slate-400">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Continue Button */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#FFC836] hover:bg-[#f5be29] py-3.5 px-6 text-center text-sm font-extrabold text-slate-900 shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Continue"}
                </button>
                <p className="text-[11px] text-slate-400 text-center leading-tight">
                  By continuing, you agree to our{" "}
                  <a href="/terms" target="_blank" rel="noreferrer" className="underline font-semibold text-slate-600 hover:text-cyan-600">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="underline font-semibold text-slate-600 hover:text-cyan-600">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="grid size-7 place-items-center rounded-full hover:bg-slate-100"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <h2 className="text-base font-bold text-slate-900">Verify phone number</h2>
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="mt-6 space-y-6">
              <div>
                <p className="text-xs text-slate-500">
                  Enter the 6-digit code sent to <span className="font-bold text-slate-900">{fullPhone}</span>
                </p>

                {devCode && (
                  <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                    <p className="text-xs font-bold text-amber-800">
                      Testing Dev Code: <span className="font-mono text-sm underline">{devCode}</span>
                    </p>
                  </div>
                )}

                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="mt-4 w-full text-center tracking-widest text-2xl font-bold rounded-2xl border border-slate-200 py-3.5 focus:border-cyan-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#FFC836] hover:bg-[#f5be29] py-3.5 px-6 text-center text-sm font-extrabold text-slate-900 shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Address Details & Interactive Map Box */}
        {step === "address" && (
          <div className="max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="grid size-7 place-items-center rounded-full hover:bg-slate-100"
                >
                  <ChevronLeft className="size-5 text-slate-800" />
                </button>
                <h2 className="text-lg font-extrabold text-slate-900">Address Details</h2>
              </div>
            </div>

            {/* Interactive Map Container with Search & Resize */}
            <div className="relative w-full bg-slate-100 border-b border-slate-200/80">
              {/* Map Canvas */}
              <div
                ref={mapElRef}
                className={`w-full transition-all duration-300 ${mapExpanded ? "h-64" : "h-36"}`}
              />

              {/* Top Search Bar & Controls inside Map Box */}
              <div className="absolute top-2.5 left-3 right-3 z-10 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => void handleMapSearch(e.target.value)}
                    placeholder="Search address or landmark on map..."
                    className="w-full rounded-xl bg-white/95 backdrop-blur-xs py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-900 shadow-md border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {/* Search Results Dropdown */}
                  {mapSearchResults.length > 0 && (
                    <ul className="absolute left-0 right-0 top-9 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl py-1 z-30">
                      {mapSearchResults.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSearchResult(r)}
                            className="flex w-full items-start gap-2 px-3 py-2 text-start text-xs hover:bg-slate-50 transition-colors"
                          >
                            <MapPin className="size-3.5 text-cyan-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-900 block">{r.name}</span>
                              <span className="text-[11px] text-slate-500 block truncate">{r.address}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Map Control Buttons: Current Location & Resize */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  title="Use Current Location"
                  className="grid size-8 place-items-center rounded-xl bg-white/95 text-slate-700 shadow-md border border-slate-200/80 hover:bg-slate-50 transition-colors shrink-0"
                >
                  <Crosshair className="size-4 text-cyan-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setMapExpanded((v) => !v)}
                  title={mapExpanded ? "Minimize Map" : "Expand Map"}
                  className="grid size-8 place-items-center rounded-xl bg-white/95 text-slate-700 shadow-md border border-slate-200/80 hover:bg-slate-50 transition-colors shrink-0"
                >
                  {mapExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleAddressSubmit} className="p-6 space-y-5">
              {/* Address Type Tabs: Home | Work | Other */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAddressTab("home")}
                  className={`flex-1 rounded-full py-2.5 px-4 text-center text-xs font-bold transition-all ${
                    addressTab === "home"
                      ? "bg-[#00C3E3] text-white shadow-md shadow-cyan-500/30"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Home
                </button>

                <button
                  type="button"
                  onClick={() => setAddressTab("work")}
                  className={`flex-1 rounded-full py-2.5 px-4 text-center text-xs font-bold transition-all ${
                    addressTab === "work"
                      ? "bg-[#00C3E3] text-white shadow-md shadow-cyan-500/30"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Work
                </button>

                <button
                  type="button"
                  onClick={() => setAddressTab("other")}
                  className={`flex-1 rounded-full py-2.5 px-4 text-center text-xs font-bold transition-all ${
                    addressTab === "other"
                      ? "bg-[#00C3E3] text-white shadow-md shadow-cyan-500/30"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Other
                </button>
              </div>

              {/* Extra Field for 'Other' Tab */}
              {addressTab === "other" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Other
                  </label>
                  <input
                    type="text"
                    value={otherLabel}
                    onChange={(e) => setOtherLabel(e.target.value)}
                    placeholder="Location Name"
                    className="w-full border-b border-slate-200 bg-transparent py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              {/* Address / Building Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Address / Building Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="Building Name / Street Address"
                    className="w-full border-b border-slate-200 bg-transparent py-2 pr-8 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                  />
                  {geocodingBusy && (
                    <Loader2 className="absolute right-0 top-2.5 size-4 animate-spin text-cyan-600" />
                  )}
                </div>
              </div>

              {/* Flat / Villa No. */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Flat / Villa No.
                </label>
                <input
                  type="text"
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  placeholder="Flat / Villa No."
                  className="w-full border-b border-slate-200 bg-transparent py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Directions (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Directions (Optional)
                </label>
                <input
                  type="text"
                  value={directions}
                  onChange={(e) => setDirections(e.target.value)}
                  placeholder="Directions / Landmark (Optional)"
                  className="w-full border-b border-slate-200 bg-transparent py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Save Address Gold Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#FFC836] hover:bg-[#f5be29] py-3.5 px-6 text-center text-sm font-extrabold text-slate-900 shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: Personal Details Modal */}
        {step === "personal" && (
          <div className="p-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Personal Details</h2>
            </div>

            <form onSubmit={handlePersonalSubmit} className="mt-5 space-y-5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Contact Information
              </p>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Gender Selector: Female | Male | Rather Not Say */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Gender
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {(["Female", "Male", "Rather Not Say"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        gender === g
                          ? "bg-slate-900 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {gender === g && <Check className="size-3.5 text-white" />}
                      {g}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                  This information helps us refer you to relevant ServicePlus services.
                </p>
              </div>

              {/* Complete Setup Gold Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#FFC836] hover:bg-[#f5be29] py-3.5 px-6 text-center text-sm font-extrabold text-slate-900 shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Complete Profile & Sign In"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
