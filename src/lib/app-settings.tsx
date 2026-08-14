import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-session";
import { isCurrencyCode, type CurrencyCode } from "./currency";

const LEGACY_KEY = "shootflow.appSettings.v1";
const cacheKey = (uid: string) => `shootflow.appSettings.${uid}`;

export type AppSettings = {
  name: string;
  logo: string | null; // base64 data URL or null
  currency: CurrencyCode;
  theme: ThemeMode;
};

export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const DEFAULTS: AppSettings = {
  name: "Shootflow",
  logo: null,
  currency: "SEK",
  theme: "light",
};

function normalize(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return DEFAULTS;
  const r = raw as Partial<AppSettings>;
  return {
    name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : DEFAULTS.name,
    logo: typeof r.logo === "string" && r.logo.startsWith("data:") ? r.logo : null,
    currency: isCurrencyCode(r.currency) ? r.currency : DEFAULTS.currency,
    theme: (THEME_MODES as readonly string[]).includes(r.theme as string)
      ? (r.theme as ThemeMode)
      : DEFAULTS.theme,
  };
}

type Ctx = {
  settings: AppSettings;
  ready: boolean;
  setName: (name: string) => void;
  setLogo: (dataUrl: string | null) => void;
  setCurrency: (code: CurrencyCode) => void;
  setTheme: (mode: ThemeMode) => void;
  reset: () => void;
};

const AppSettingsContext = createContext<Ctx | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  const { user, loading } = useSession();
  const userId = user?.id ?? null;
  const userRef = useRef<string | null>(null);
  userRef.current = userId;

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setReady(false);

    const local = (key: string) => {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    if (!userId) {
      setSettings(normalize(local(LEGACY_KEY)));
      setReady(true);
      return;
    }

    setSettings(normalize(local(cacheKey(userId)) ?? local(LEGACY_KEY)));

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("settings")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (data?.settings && Object.keys(data.settings).length > 0) {
        setSettings(normalize(data.settings));
      }
      window.localStorage.removeItem(LEGACY_KEY);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  useEffect(() => {
    if (!ready) return;
    const uid = userRef.current;
    try {
      window.localStorage.setItem(uid ? cacheKey(uid) : LEGACY_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota errors */
    }
    if (!uid) return;
    void supabase
      .from("profiles")
      .upsert({ user_id: uid, settings: settings as never }, { onConflict: "user_id" });
  }, [settings, ready]);

  const setName = useCallback((name: string) => {
    setSettings((p) => ({ ...p, name: name.trim() || DEFAULTS.name }));
  }, []);

  const setLogo = useCallback((logo: string | null) => {
    setSettings((p) => ({ ...p, logo }));
  }, []);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setSettings((p) => ({ ...p, currency }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((p) => ({ ...p, theme }));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && media.matches);
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    if (settings.theme !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme, ready]);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
  }, []);

  const value = useMemo(
    () => ({ settings, ready, setName, setLogo, setCurrency, setTheme, reset }),
    [settings, ready, setName, setLogo, setCurrency, setTheme, reset],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used inside AppSettingsProvider");
  return ctx;
}
