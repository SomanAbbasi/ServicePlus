import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, UserCircle, Globe, MapPin, Search } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
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
const logoUrl = "/serviceplus-logo.webp";
import { useSession } from "@/frontend/lib/use-session";

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

function AccountLink() {
  return (
    <Button asChild variant="ghost" size="icon" aria-label="Account">
      <Link to="/dashboard">
        <UserCircle className="size-5" />
      </Link>
    </Button>
  );
}

export function Navbar() {
  const { locale, setLocale, t } = useLocale();
  const { location, save } = useSavedLocation();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
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
          className="hidden max-w-[14rem] items-center gap-1.5 rounded-full border border-border/60 bg-primary-soft/50 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 md:inline-flex"
        >
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">
            {location?.address ?? t("home.setLocation")}
          </span>
        </button>

        {/* Desktop: Search */}
        <SearchSuggest className="hidden flex-1 md:block" />

        {/* Right section */}
        <div className="ms-auto flex items-center gap-0.5">
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

          {/* Desktop: Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 px-2 sm:inline-flex"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            aria-label="Toggle language"
          >
            <Globe className="size-4" aria-hidden />
            <span className="text-xs font-semibold">
              {locale === "en" ? "AR" : "EN"}
            </span>
          </Button>

          <UaeFlag />
          <AccountLink />

          {/* Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("nav.menu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-b border-border/50 px-5 py-4">
                <SheetTitle className="text-base">{t("nav.menu")}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-0.5 p-3">
                {links.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border/50 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setLocale(locale === "en" ? "ar" : "en")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Globe className="size-4" aria-hidden />
                  {locale === "en" ? "العربية" : "English"}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearch && (
        <div className="border-t border-border/50 px-3 py-2 md:hidden">
          <SearchSuggest autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      )}

      <LocationPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(loc) => {
          save(loc);
          setPickerOpen(false);
        }}
      />
    </header>
  );
}
