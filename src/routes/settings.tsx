import { createFileRoute } from "@tanstack/react-router";
import { Bell, CreditCard, Download, HelpCircle, Upload, User, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { useBookings } from "@/lib/booking-store";
import { downloadExport, parseImport } from "@/lib/booking-io";

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

const ROWS: { icon: LucideIcon; label: string; hint: string }[] = [
  { icon: User, label: "Profile", hint: "Studio name, contact" },
  { icon: CreditCard, label: "Payments", hint: "Currency, invoice details" },
  { icon: HelpCircle, label: "Help & feedback", hint: "Get in touch" },
];

function SettingsPage() {
  const { bookings, importBookings } = useBookings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      const count = importBookings(parseImport(await file.text()), mode);
      setStatus({
        ok: true,
        text:
          mode === "replace"
            ? `Restored ${count} bookings, replacing everything on this device.`
            : `Imported ${count} bookings. Matching IDs were updated.`,
      });
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : "Import failed." });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <AppShell header={<PageHeader title="Settings" subtitle="Shootflow · version 1.0" />}>
      <div className="surface divide-y divide-border overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Shoot reminders</p>
            <p className="text-xs text-muted-foreground">Notify me the day before</p>
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
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          </button>
        ))}
      </div>

      <section className="surface mt-4 p-4">
        <p className="text-sm font-medium">Backup & restore</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Export your {bookings.length} bookings as a JSON file, or restore them from a
          previous export.
        </p>

        <button
          type="button"
          onClick={() => downloadExport(bookings)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-medium transition-transform active:scale-[0.98]"
        >
          <Download className="h-4 w-4" strokeWidth={1.6} />
          Export bookings
        </button>

        <div className="mt-4 flex gap-2">
          <ModeChip active={mode === "merge"} onClick={() => setMode("merge")}>
            Merge
          </ModeChip>
          <ModeChip active={mode === "replace"} onClick={() => setMode("replace")}>
            Replace all
          </ModeChip>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {mode === "merge"
            ? "Keeps existing bookings and updates ones with the same ID."
            : "Deletes bookings on this device and restores only the file's."}
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
          Import from file
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
        Bookings are stored on this device for now.
      </p>
    </AppShell>
  );
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