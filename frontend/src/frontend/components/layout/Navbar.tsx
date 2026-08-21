import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, UserCircle, Globe, MapPin, Search } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/frontend/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/frontend/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { amIAdmin } from "@/frontend/lib/api-services";
import { LocationPicker } from "@/frontend/components/LocationPicker";
import { SearchSuggest } from "@/frontend/components/SearchSuggest";
import { useLocale } from "@/frontend/lib/locale";
import { useSavedLocation } from "@/frontend/lib/location";
import { useSession } from "@/frontend/lib/use-session";
import { AccountPopover } from "@/frontend/components/AccountPopover";
import { AccountAuthModal } from "@/frontend/components/AccountAuthModal";

const logoUrl = "/serviceplus-logo.webp";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="ServicePlus home"
      className={`inline-flex shrink-0 items-center ${className}`}
    >
      <img
        src={logoUrl}
        alt="Service Plus FMP"
        className="h-8 w-auto object-contain sm:h-9"
        width={160}
        height={40}
      />
    </Link>
  );
}

/** UAE flag badge shown next to the language switch. */
function UaeFlag() {
  return (
    <span
      aria-label="United Arab Emirates"
      title="United Arab Emirates"
      className="hidden overflow-hidden rounded-full border border-border sm:inline-flex"
    >
      <svg viewBox="0 0 6 4" className="size-5" role="img" aria-hidden>
        <rect width="6" height="4" fill="#fff" />
        <rect width="6" height="1.333" fill="#00732f" />
        <rect y="2.667" width="6" height="1.333" fill="#000" />
        <rect width="1.5" height="4" fill="#ff0000" />
      </svg>
    </span>
  );
}

export function Navbar() {
  const { locale, setLocale, t } = useLocale();
  const { location, save } = useSavedLocation();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { session } = useSession();
  const { data: gate } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => amIAdmin(),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (mobileSearch) setOpen(false);
  }, [mobileSearch]);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/search", label: t("nav.allServices") },
    { to: "/dashboard", label: t("nav.myBookings") },
    ...(gate?.is_admin ? [{ to: "/admin", label: t("nav.admin") }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        {/* Mobile: Logo */}
        <Logo />

        {/* Mobile: Location icon only */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          aria-label={t("home.setLocation")}
          onClick={() => setPickerOpen(true)}
        >
          <MapPin className="size-5 text-primary" />
        </Button>

        {/* Desktop: Location pill */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="hidden max-w-[15rem] items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50/80 px-3.5 py-1.5 text-xs font-extrabold text-cyan-800 transition-colors hover:bg-cyan-100/80 md:inline-flex shrink-0 shadow-2xs"
        >
          <MapPin className="size-3.5 shrink-0 text-cyan-600 fill-cyan-500/20" aria-hidden />
          <span className="truncate">
            {location?.address ?? t("home.setLocation")}
          </span>
        </button>

        {/* Desktop: Medium Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg mx-2">
          <SearchSuggest className="w-full" />
        </div>

        {/* Right section */}
        <div className="ms-auto flex items-center gap-2">
          {/* Mobile: Search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t("searchPlaceholder")}
            onClick={() => setMobileSearch((v) => !v)}
          >
            <Search className="size-5" />
          </Button>

          {/* Language toggle text */}
          <button
            type="button"
            className="text-xs font-bold text-slate-700 hover:text-cyan-600 transition-colors inline-block px-1"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          >
            {locale === "en" ? "العربية" : "English"}
          </button>

          <span
            aria-label="United Arab Emirates"
            title="United Arab Emirates"
            className="overflow-hidden rounded-full border border-border inline-flex"
          >
            <svg viewBox="0 0 6 4" className="size-5" role="img" aria-hidden>
              <rect width="6" height="4" fill="#fff" />
              <rect width="6" height="1.333" fill="#00732f" />
              <rect y="2.667" width="6" height="1.333" fill="#000" />
              <rect width="1.5" height="4" fill="#ff0000" />
            </svg>
          </span>

          {/* Unified Account & Menu Pill Button (Matching Image 3) */}
          <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-98"
                aria-label="Account options menu"
              >
                <UserCircle className="size-4 text-slate-700" />
                <Menu className="size-4 text-slate-700" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="p-0 border-none bg-transparent shadow-none w-auto">
              <AccountPopover
                onOpenAuthModal={() => setAuthModalOpen(true)}
                onClosePopover={() => setAccountPopoverOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearch && (
        <div className="border-t border-border/50 px-3 py-2 md:hidden">
          <SearchSuggest autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      )}

      {/* Location Picker */}
      <LocationPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(loc) => {
          save(loc);
          setPickerOpen(false);
        }}
      />

      {/* Account Authentication & Onboarding Modal */}
      <AccountAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </header>
  );
}
