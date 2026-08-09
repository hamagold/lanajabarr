import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const KEY = "shootflow.appSettings.v1";

export type AppSettings = {
  name: string;
  logo: string | null; // base64 data URL or null
};

const DEFAULTS: AppSettings = {
  name: "Shootflow",
  logo: null,
};

function normalize(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return DEFAULTS;
  const r = raw as Partial<AppSettings>;
  return {
    name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : DEFAULTS.name,
    logo: typeof r.logo === "string" && r.logo.startsWith("data:") ? r.logo : null,
  };
}

type Ctx = {
  settings: AppSettings;
  ready: boolean;
  setName: (name: string) => void;
  setLogo: (dataUrl: string | null) => void;
  reset: () => void;
};

const AppSettingsContext = createContext<Ctx | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      setSettings(normalize(raw ? JSON.parse(raw) : null));
    } catch {
      setSettings(DEFAULTS);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota errors */
    }
  }, [settings, ready]);

  const setName = useCallback((name: string) => {
    setSettings((p) => ({ ...p, name: name.trim() || DEFAULTS.name }));
  }, []);

  const setLogo = useCallback((logo: string | null) => {
    setSettings((p) => ({ ...p, logo }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
  }, []);

  const value = useMemo(
    () => ({ settings, ready, setName, setLogo, reset }),
    [settings, ready, setName, setLogo, reset],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used inside AppSettingsProvider");
  return ctx;
}
