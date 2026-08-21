import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { HelpCircle, LogOut, User, MapPin, Calendar, ChevronRight } from "lucide-react";
import { useAuth } from "@/frontend/lib/auth-context";
import { useLocale } from "@/frontend/lib/locale";
import { ComingSoonModal } from "@/frontend/components/ComingSoonModal";

export function AccountPopover({
  onOpenAuthModal,
  onClosePopover,
}: {
  onOpenAuthModal: () => void;
  onClosePopover?: () => void;
}) {
  const { user, token, clearAuth } = useAuth();
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const [appModalOpen, setAppModalOpen] = useState(false);
  const isAr = locale === "ar";

  const handleLogout = () => {
    clearAuth();
    onClosePopover?.();
  };

  const handleAuthClick = () => {
    onClosePopover?.();
    onOpenAuthModal();
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="w-80 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200/80">
      {/* Logged Out State */}
      {!token ? (
        <div className="mb-3">
          <button
            type="button"
            onClick={handleAuthClick}
            className="w-full rounded-full bg-[#FFC836] hover:bg-[#f5be29] py-3 px-6 text-center text-sm font-extrabold text-slate-900 shadow-md transition-all active:scale-98"
          >
            {isAr ? "إنشاء حساب أو تسجيل الدخول" : "Sign Up Or Log In"}
          </button>
        </div>
      ) : (
        /* Logged In State */
        <div className="mb-3 space-y-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="grid size-10 place-items-center rounded-full bg-cyan-100 text-cyan-700 font-extrabold text-base">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.full_name || (isAr ? "مستخدم ServicePlus" : "ServicePlus User")}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.phone || user?.email || ""}</p>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <Link
              to="/dashboard"
              onClick={onClosePopover}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="size-4 text-slate-500" />
                <span>{isAr ? "حجوزاتي وحسابي" : "My Bookings & Account"}</span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-start"
            >
              <LogOut className="size-4" />
              <span>{isAr ? "تسجيل الخروج" : "Log Out"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Section */}
      <div className="py-1 space-y-0.5 border-t border-slate-100">
        <Link
          to="/"
          onClick={onClosePopover}
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>{isAr ? "الرئيسية" : "Home"}</span>
        </Link>
        <Link
          to="/search"
          search={{ q: "" }}
          onClick={onClosePopover}
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>{isAr ? "جميع الخدمات" : "All Services"}</span>
        </Link>
        <Link
          to="/dashboard"
          onClick={onClosePopover}
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>{isAr ? "حجوزاتي" : "My Bookings"}</span>
        </Link>
        <a
          href="mailto:support@serviceplus.app"
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <HelpCircle className="size-4 text-slate-500" />
          <span>{isAr ? "المساعدة" : "Help"}</span>
        </a>
      </div>

      <div className="my-2 border-t border-slate-100" />

      {/* Store Download Badges (Image 1) */}
      <div className="flex items-center justify-center gap-2 pt-1">
        {/* Google Play Store Badge */}
        <button
          type="button"
          onClick={() => setAppModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-start text-white shadow-xs transition-transform hover:scale-102 active:scale-98"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
          </svg>
          <div className="leading-tight">
            <span className="block text-[9px] font-normal uppercase tracking-wider text-slate-300">
              Download on
            </span>
            <span className="block text-[11px] font-bold text-white">Google play</span>
          </div>
        </button>

        {/* App Store Badge */}
        <button
          type="button"
          onClick={() => setAppModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-start text-white shadow-xs transition-transform hover:scale-102 active:scale-98"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <div className="leading-tight">
            <span className="block text-[9px] font-normal uppercase tracking-wider text-slate-300">
              Download on the
            </span>
            <span className="block text-[11px] font-bold text-white">App Store</span>
          </div>
        </button>
      </div>

      <ComingSoonModal open={appModalOpen} onOpenChange={setAppModalOpen} />
    </div>
  );
}
