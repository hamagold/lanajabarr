import { Link } from "@tanstack/react-router";
import { CalendarDays, Home, MapPin, Settings, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n, type TranslationKey } from "@/lib/i18n";

const TABS: { to: string; label: TranslationKey; icon: LucideIcon }[] = [
  { to: "/dashboard", label: "nav.home", icon: Home },
  { to: "/calendar", label: "nav.calendar", icon: CalendarDays },
  { to: "/locations", label: "nav.locations", icon: MapPin },
  { to: "/settings", label: "nav.settings", icon: Settings },
];

export function AppShell({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      {header}
      <main className="flex-1 px-5 pb-28">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md items-center justify-around border-t border-border bg-card/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        {TABS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] text-muted-foreground transition-colors"
            activeProps={{ className: "text-primary font-medium" }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.6} />
            {t(label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pt-8 pb-5">
      <div className="min-w-0">
        <h1 className="truncate text-[27px] leading-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </header>
  );
}