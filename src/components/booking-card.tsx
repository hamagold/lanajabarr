import { Link } from "@tanstack/react-router";
import { Clock, MapPin, ImageIcon } from "lucide-react";
import { formatDate, formatMoney, STAGE_LABELS, type Booking } from "@/lib/bookings";

export function StagePill({ stage }: { stage: Booking["stage"] }) {
  return (
    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Link
      to="/bookings/$id"
      params={{ id: booking.id }}
      className="surface block p-4 transition-transform active:scale-[0.99]"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{booking.clientName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {booking.shootType} · {formatMoney(booking.price)}
          </p>
        </div>
        <StagePill stage={booking.stage} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.6} />
          {formatDate(booking.date)} · {booking.time}
        </span>
        {booking.location ? (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            <span className="truncate">{booking.location}</span>
          </span>
        ) : null}
      </div>
      {booking.images.length > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <img
              src={booking.images[0]}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.6} />
            {booking.images.length} photo{booking.images.length > 1 ? "s" : ""}
          </span>
        </div>
      ) : null}
    </Link>
  );
}