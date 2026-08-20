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
        className="h-9 w-auto object-contain sm:h-10"
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
      <svg viewBox="0 0 6 4" className="size-6" role="img" aria-hidden>
        <rect width="6" height="4" fill="#fff" />
        <rect width="6" height="1.333" fill="#00732f" />
        <rect y="2.667" width="6" height="1.333" fill="#000" />
        <rect width="1.5" height="4" fill="#ff0000" />
      </svg>
    </span>
  );
}

function AccountLink() {
  const { session } = useSession();
  return (
    <Button asChild variant="ghost" size="icon" aria-label="Account">
      <Link to={session ? "/dashboard" : "/auth"}>
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Logo />

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex max-w-[9rem] items-center gap-1.5 rounded-full bg-primary-soft px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/15 sm:max-w-[16rem]"
        >
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">{location?.address ?? t("home.setLocation")}</span>
        </button>

        <SearchSuggest className="hidden flex-1 md:block" />

        <div className="ms-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t("searchPlaceholder")}
            onClick={() => setMobileSearch((v) => !v)}
          >
            <Search className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 sm:inline-flex"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          >
            <Globe className="size-4" aria-hidden />
            {locale === "en" ? "العربية" : "English"}
          </Button>

          <UaeFlag />

          <AccountLink />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("nav.menu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80">
              <SheetHeader>
                <SheetTitle>{t("nav.menu")}</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-1 px-4 pb-6 text-sm">
                {links.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => setLocale(locale === "en" ? "ar" : "en")}
                  className="rounded-md px-3 py-2 text-start hover:bg-muted sm:hidden"
                >
                  {locale === "en" ? "العربية" : "English"}
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {mobileSearch ? (
        <div className="px-3 pb-3 md:hidden">
          <SearchSuggest autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      ) : null}

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
