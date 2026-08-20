import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { requestOtp, verifyOtp } from "@/frontend/lib/api-services";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { useLocale } from "@/frontend/lib/locale";
import { useSession } from "@/frontend/lib/use-session";
import { useAuth, type AuthUser } from "@/frontend/lib/auth-context";

interface AuthSearch {
  redirect: string;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const raw =
      typeof search["redirect"] === "string" ? (search["redirect"] as string) : "/dashboard";
    return { redirect: raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard" };
  },
  head: () => ({
    meta: [
      { title: "Sign in — ServicePlus" },
      {
        name: "description",
        content: "Sign in to ServicePlus with your phone number to manage bookings.",
      },
      { property: "og:title", content: "Sign in — ServicePlus" },
      { property: "og:description", content: "Sign in with a one-time code sent to your phone." },
      { property: "og:url", content: "/auth" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { t } = useLocale();
  const { session } = useSession();
  const { setAuth } = useAuth();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: search.redirect, replace: true });
  }, [session, navigate, search.redirect]);

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await requestOtp(phone);
      setDevCode(res.dev_code);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errSend"));
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await verifyOtp(phone, code, name || undefined);
      setAuth(res.access_token, res.refresh_token, res.profile as unknown as AuthUser);
      navigate({ to: search.redirect, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errVerify"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-6">
        <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
          {step === "phone" ? <Phone className="size-5" /> : <ShieldCheck className="size-5" />}
        </span>
        <h1 className="mt-4 text-xl font-semibold">
          {step === "phone" ? t("auth.signInTitle") : t("auth.codeTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "phone"
            ? t("auth.phoneHint")
            : `${t("auth.codeSentTo")} ${phone}. ${t("auth.codeExpiry")}`}
        </p>

        {step === "phone" ? (
          <form onSubmit={onSendCode} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("auth.phoneLabel")}</Label>
              <Input
                id="phone"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+03079035614"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("auth.nameLabel")}</Label>
              <Input
                id="name"
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.namePlaceholder")}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("auth.sendCode")}
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">{t("auth.codeLabel")}</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
              />
            </div>
            {devCode ? (
              <p className="rounded-md bg-primary-soft px-3 py-2 text-xs text-accent-foreground">
                {t("auth.demoPrefix")} <span className="font-semibold">{devCode}</span>
              </p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("auth.verify")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
            >
              {t("auth.otherNumber")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
