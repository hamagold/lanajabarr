import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { BookingCard } from "@/components/booking-card";
import { useBookings } from "@/lib/booking-store";
import { STAGES, type Stage } from "@/lib/bookings";
import { useMoney } from "@/lib/money";
import { useI18n, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Shootflow" },
      {
        name: "description",
        content: "See every photography job and move it through your workflow stages.",
      },
      { property: "og:title", content: "Dashboard — Shootflow" },
      { property: "og:description", content: "Every photography job in one calm list." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { bookings } = useBookings();
  const { t } = useI18n();
  const { money } = useMoney();
  const [filter, setFilter] = useState<Stage | "all">("all");

  const visible = filter === "all" ? bookings : bookings.filter((b) => b.stage === filter);
  const revenue = bookings
    .filter((b) => b.paymentStatus === "Paid")
    .reduce((sum, b) => sum + b.price, 0);
  const upcoming = bookings.filter((b) => b.stage === "upcoming").length;

  return (
    <AppShell
      header={
        <PageHeader
          title={t("dash.title")}
          subtitle={t("dash.subtitle")}
        />
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("dash.upcoming")} value={String(upcoming)} hint={t("dash.bookings")} />
        <Stat
          label={t("dash.collected")}
          value={money(revenue)}
          hint={t("dash.paidInFull")}
        />
      </div>

      <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          {t("dash.all")}
        </Chip>
        {STAGES.map((s) => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {t(`stage.${s}` as TranslationKey)}
          </Chip>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {visible.length === 0 ? (
          <p className="surface p-6 text-center text-sm text-muted-foreground">
            {t("dash.empty")}
          </p>
        ) : (
          visible.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </div>

      <Link
        to="/bookings/new"
        search={{ date: undefined }}
        aria-label={t("dash.newBooking")}
        className="fixed bottom-24 left-1/2 z-40 ml-[7rem] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={1.8} />
      </Link>
    </AppShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="surface p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Chip({
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
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}