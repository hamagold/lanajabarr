import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { BookingCard } from "@/components/booking-card";
import { useBookings } from "@/lib/booking-store";
import { formatDate } from "@/lib/bookings";

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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function CalendarPage() {
  const { bookings } = useBookings();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(
    toIso(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dayBookings = bookings.filter((b) => b.date === selected);

  return (
    <AppShell header={<PageHeader title="Calendar" />}>
      <div className="surface p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="p-2 text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium">
            {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="p-2 text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
          {DAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <span key={`e${i}`} />;
            const iso = toIso(year, month, day);
            const has = bookings.some((b) => b.date === iso);
            const isSelected = iso === selected;
            const weekday = (new Date(year, month, day).getDay() + 6) % 7;
            const isWeekend = weekday >= 5;
            const tone = has
              ? "bg-day-booked text-day-booked-foreground"
              : isWeekend
                ? "bg-day-weekend text-day-weekend-foreground"
                : "bg-day-free text-day-free-foreground";
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={`relative aspect-square rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card"
                    : tone
                }`}
              >
                {day}
                {has && !isSelected ? (
                  <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-day-booked-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-day-booked" /> Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-day-free" /> Free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-day-weekend" /> Weekend
          </span>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium">{formatDate(selected)}</p>
        <p className="text-xs text-muted-foreground">
          {dayBookings.length} {dayBookings.length === 1 ? "booking" : "bookings"}
        </p>
        <div className="mt-3 space-y-3">
          {dayBookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}