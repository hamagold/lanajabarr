import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { BookingCard } from "@/components/booking-card";
import { MonthCalendar, toIso } from "@/components/month-calendar";
import { useBookings } from "@/lib/booking-store";
import { formatDate } from "@/lib/bookings";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Shootflow" },
      { name: "description", content: "See all upcoming shoots and tap a date for details." },
      { property: "og:title", content: "Calendar — Shootflow" },
      { property: "og:description", content: "All your shoots, month by month." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { bookings } = useBookings();
  const { t, locale } = useI18n();
  const today = new Date();
  const [selected, setSelected] = useState(
    toIso(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const dayBookings = bookings.filter((b) => b.date === selected);

  return (
    <AppShell header={<PageHeader title={t("cal.title")} />}>
      <div className="lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-6">
      <div className="surface p-4 lg:h-fit">
        <MonthCalendar
          value={selected}
          onChange={setSelected}
          bookedDates={bookings.map((b) => b.date)}
        />
      </div>

      <div className="mt-6 lg:mt-0">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{formatDate(selected, locale)}</p>
            <p className="text-xs text-muted-foreground">
              {dayBookings.length}{" "}
              {dayBookings.length === 1 ? t("cal.booking") : t("cal.bookings")}
            </p>
          </div>
          <Link
            to="/bookings/new"
            search={{ date: selected }}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-transform active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("dash.newBooking")}
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {dayBookings.length === 0 ? (
            <Link
              to="/bookings/new"
              search={{ date: selected }}
              className="surface flex flex-col items-center gap-2 px-5 py-8 text-center"
            >
              <CalendarPlus className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">{t("cal.noShoots")}</p>
              <p className="text-xs text-muted-foreground">
                {t("cal.tapToBook", { date: formatDate(selected, locale) })}
              </p>
            </Link>
          ) : (
            dayBookings
              .slice()
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </div>
      </div>
    </AppShell>
  );
}