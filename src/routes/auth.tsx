import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Input } from "@/components/ui/input";
import { useAppSettings } from "@/lib/app-settings";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/use-session";

import lightLogo from "../../public/shootflow-logo-light.png";
import welcomeBg from "../../public/shootflow-welcome-bg.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Shootflow" },
      {
        name: "description",
        content: "Create your Shootflow account or sign in with email, Google or Apple.",
      },
      { property: "og:title", content: "Sign in — Shootflow" },
      {
        property: "og:description",
        content: "Create your Shootflow account or sign in with email, Google or Apple.",
      },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

function AuthPage() {
  const { settings } = useAppSettings();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "email" | "google" | "apple">(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(t("auth.invalid"));
      return;
    }
    setBusy("email");
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (err) throw err;
        setInfo(t("auth.checkEmail"));
      } else {
        const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
        if (err) throw err;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.failed"));
    } finally {
      setBusy(null);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setBusy(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(t("auth.failed"));
      setBusy(null);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div
      className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12 text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, oklch(0.45 0.05 70 / 0.55), oklch(0.3 0.04 70 / 0.75)), url(${welcomeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-col items-center text-center">
        <img
          src={settings.logo || lightLogo}
          alt={settings.name || "Shootflow"}
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-contain drop-shadow-lg"
        />
        <h1 className="mt-4 text-[30px] leading-tight tracking-tight">
          {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </h1>
        <p className="mt-1 text-xs text-white/80">{t("auth.subtitle")}</p>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={busy !== null}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-[15px] font-medium text-[oklch(0.3_0.02_55)] shadow-soft transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleMark />
          )}
          {t("auth.google")}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("apple")}
          disabled={busy !== null}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-black/85 px-6 py-3.5 text-[15px] font-medium text-white transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleMark />}
          {t("auth.apple")}
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/25" />
        <span className="text-[11px] uppercase tracking-[0.25em] text-white/70">
          {t("auth.or")}
        </span>
        <span className="h-px flex-1 bg-white/25" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.email")}
          className="h-12 rounded-2xl border-white/25 bg-white/10 text-white placeholder:text-white/60"
        />
        <Input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={6}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.password")}
          className="h-12 rounded-2xl border-white/25 bg-white/10 text-white placeholder:text-white/60"
        />
        <button
          type="submit"
          disabled={busy !== null}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white/95 px-6 py-3.5 text-[15px] font-medium text-[oklch(0.3_0.02_55)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy === "email" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" strokeWidth={1.8} />
          )}
          {mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
        </button>
      </form>

      {error ? <p className="mt-3 text-center text-xs text-red-200">{error}</p> : null}
      {info ? <p className="mt-3 text-center text-xs text-white/90">{info}</p> : null}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setInfo(null);
        }}
        className="mt-6 text-center text-xs text-white/80 underline underline-offset-4"
      >
        {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}
      </button>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M16.4 12.8c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.4-.9-2.4-3.7zM14.1 4.7c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.6 2.8-1.5z" />
    </svg>
  );
}
