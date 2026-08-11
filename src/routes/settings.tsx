import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronDown,
  Coins,
  CreditCard,
  Download,
  HelpCircle,
  ImageIcon,
  Languages,
  RefreshCcw,
  Upload,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppSettings } from "@/lib/app-settings";
import { CURRENCIES } from "@/lib/currency";
import { useBookings } from "@/lib/booking-store";
import { downloadExport, parseImport } from "@/lib/booking-io";
import { LANGUAGES, useI18n, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Shootflow" },
      { name: "description", content: "Manage your Shootflow profile, reminders and data." },
      { property: "og:title", content: "Settings — Shootflow" },
      { property: "og:description", content: "Manage your profile, reminders and data." },
    ],
  }),
  component: SettingsPage,
});

const ROWS: { icon: LucideIcon; label: TranslationKey; hint: TranslationKey }[] = [
  { icon: User, label: "set.profile", hint: "set.profileHint" },
  { icon: CreditCard, label: "set.payments", hint: "set.paymentsHint" },
  { icon: HelpCircle, label: "set.help", hint: "set.helpHint" },
];

function SettingsPage() {
  const { bookings, importBookings } = useBookings();
  const { settings, setName, setLogo, setCurrency, reset } = useAppSettings();
  const { t, lang, setLang } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState<"lang" | "currency" | null>(null);

  const activeLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const activeCurrency = CURRENCIES.find((c) => c.code === settings.currency) ?? CURRENCIES[0];

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      const count = importBookings(parseImport(await file.text()), mode);
      setStatus({
        ok: true,
        text: t(mode === "replace" ? "set.restored" : "set.imported", { count }),
      });
    } catch (err) {
      setStatus({
        ok: false,
        text: err instanceof Error ? err.message : t("set.importFailed"),
      });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleLogoFile(file: File | undefined) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setLogo(dataUrl);
  }

  return (
    <AppShell
      header={
        <PageHeader
          title={t("set.title")}
          subtitle={t("set.version", { name: settings.name })}
        />
      }
    >
      <div className="surface divide-y divide-border overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t("set.reminders")}</p>
            <p className="text-xs text-muted-foreground">{t("set.remindersHint")}</p>
          </div>
          <Switch defaultChecked />
        </div>
        {ROWS.map(({ icon: Icon, label, hint }) => (
          <button
            key={label}
            type="button"
            className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-secondary"
          >
            <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t(label)}</p>
              <p className="text-xs text-muted-foreground">{t(hint)}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="surface mt-4 divide-y divide-border overflow-hidden">
        <SelectRow
          icon={Languages}
          label={t("set.language")}
          hint={t("set.languageHint")}
          value={activeLang.native}
          open={open === "lang"}
          onToggle={() => setOpen(open === "lang" ? null : "lang")}
          options={LANGUAGES.map((l) => ({
            key: l.code,
            lead: l.native,
            title: l.label,
            selected: lang === l.code,
            onSelect: () => {
              setLang(l.code);
              setOpen(null);
            },
          }))}
        />
        <SelectRow
          icon={Coins}
          label={t("set.currency")}
          hint={t("set.currencyHint")}
          value={`${activeCurrency.symbol} ${activeCurrency.code}`}
          open={open === "currency"}
          onToggle={() => setOpen(open === "currency" ? null : "currency")}
          options={CURRENCIES.map((c) => ({
            key: c.code,
            lead: c.symbol,
            title: c.code,
            subtitle: c.label,
            selected: settings.currency === c.code,
            onSelect: () => {
              setCurrency(c.code);
              setOpen(null);
            },
          }))}
        />
      </div>

      <section className="surface mt-4 p-4">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t("set.branding")}</p>
            <p className="text-xs text-muted-foreground">{t("set.brandingHint")}</p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="app-name" className="text-xs text-muted-foreground">
            {t("set.appName")}
          </label>
          <Input
            id="app-name"
            value={settings.name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
            placeholder="Shootflow"
          />
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted-foreground">{t("set.logo")}</p>
          <div className="mt-2 flex items-center gap-3">
            {settings.logo ? (
              <div className="relative">
                <img
                  src={settings.logo}
                  alt={settings.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label={t("set.removeLogo")}
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <ImageIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
              </div>
            )}
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium transition-colors active:bg-secondary"
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={1.6} />
              {t("set.uploadLogo")}
            </button>
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogoFile(e.target.files?.[0])}
          />
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-xs font-medium text-muted-foreground transition-colors active:bg-secondary"
        >
          <RefreshCcw className="h-3.5 w-3.5" strokeWidth={1.6} />
          {t("set.resetDefault")}
        </button>
      </section>

      <section className="surface mt-4 p-4">
        <p className="text-sm font-medium">{t("set.backup")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("set.backupHint", { count: bookings.length })}
        </p>

        <button
          type="button"
          onClick={() => downloadExport(bookings)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-medium transition-transform active:scale-[0.98]"
        >
          <Download className="h-4 w-4" strokeWidth={1.6} />
          {t("set.export")}
        </button>

        <div className="mt-4 flex gap-2">
          <ModeChip active={mode === "merge"} onClick={() => setMode("merge")}>
            {t("set.merge")}
          </ModeChip>
          <ModeChip active={mode === "replace"} onClick={() => setMode("replace")}>
            {t("set.replace")}
          </ModeChip>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {mode === "merge" ? t("set.mergeHint") : t("set.replaceHint")}
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Upload className="h-4 w-4" strokeWidth={1.6} />
          {t("set.import")}
        </button>

        {status ? (
          <p
            className={`mt-3 text-xs ${status.ok ? "text-muted-foreground" : "text-destructive"}`}
          >
            {status.text}
          </p>
        ) : null}
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("set.storedLocally")}
      </p>
    </AppShell>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read file."));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full border px-3 py-2 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
type SelectOption = {
  key: string;
  lead: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
};

function SelectRow({
  icon: Icon,
  label,
  hint,
  value,
  open,
  onToggle,
  options,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  options: SelectOption[];
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-secondary"
      >
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
          {value}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.8}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-1 px-3 pb-3">
            {options.map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  onClick={o.onSelect}
                  aria-pressed={o.selected}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                    o.selected ? "border-primary bg-secondary" : "border-transparent bg-card"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                    {o.lead}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{o.title}</span>
                    {o.subtitle ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {o.subtitle}
                      </span>
                    ) : null}
                  </span>
                  {o.selected ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
