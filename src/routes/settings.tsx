import { createFileRoute } from "@tanstack/react-router";
import { Bell, CreditCard, Download, HelpCircle, User, type LucideIcon } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";

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
  { icon: Download, label: "Export data", hint: "Download bookings" },
  { icon: HelpCircle, label: "Help & feedback", hint: "Get in touch" },
];

function SettingsPage() {
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
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Bookings are stored on this device for now.
      </p>
    </AppShell>
  );
}