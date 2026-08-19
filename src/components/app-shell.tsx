import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Clock, Home, MapPin, Settings, type LucideIcon } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccountStatusFn } from "@/lib/admin.functions";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useSession } from "@/lib/use-session";

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
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const getStatus = useServerFn(getAccountStatusFn);
  const statusQuery = useQuery({
    queryKey: ["account-status", user?.id],
    queryFn: () => getStatus({}),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return null;
  if (statusQuery.isLoading) return null;
  if (statusQuery.data && !statusQuery.data.isActive)
    return <PendingApproval expired={Boolean(statusQuery.data.expired)} />;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pt-[env(safe-area-inset-top)] md:max-w-2xl">
      {header}
      <main className="flex-1 px-5 pb-28">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md items-center justify-around border-t border-border bg-card/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:max-w-2xl">
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

function PendingApproval({ expired }: { expired?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-8 text-center">
      <Clock className="h-9 w-9 text-primary" strokeWidth={1.5} />
      <h1 className="text-2xl leading-tight">
        {expired ? t("pending.expiredTitle") : t("pending.title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {expired ? t("pending.expiredBody") : t("pending.body")}
      </p>
      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-2 rounded-full border border-border px-5 py-2.5 text-sm"
      >
        {t("auth.signOut")}
      </button>
    </div>
  );
}

function LegacyPageHeader({
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