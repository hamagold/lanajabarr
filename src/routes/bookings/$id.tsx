import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Mail, Phone, Trash2, X } from "lucide-react";
import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useBookings } from "@/lib/booking-store";
import {
  PAYMENT_STATUSES,
  STAGES,
  STAGE_LABELS,
  formatDate,
  formatMoney,
  type PaymentStatus,
  type Stage,
} from "@/lib/bookings";

export const Route = createFileRoute("/bookings/$id")({
  head: () => ({
    meta: [
      { title: "Booking details — Shootflow" },
      {
        name: "description",
        content: "Client info, session details, checklist and workflow stage for a booking.",
      },
      { property: "og:title", content: "Booking details — Shootflow" },
      { property: "og:description", content: "Everything about this photography session." },
    ],
  }),
  component: BookingDetails,
});

function BookingDetails() {
  const { id } = Route.useParams();
  const { getBooking, updateBooking, removeBooking, ready } = useBookings();
  const navigate = useNavigate();
  const booking = getBooking(id);

  if (!ready) return null;

  if (!booking) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-muted-foreground">This booking no longer exists.</p>
        <Link to="/dashboard" className="text-sm font-medium text-primary underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const stageIndex = STAGES.indexOf(booking.stage);
  const doneCount = booking.checklist.filter((c) => c.done).length;

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-16">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 pt-8 pb-5">
        <Link to="/dashboard" aria-label="Back" className="-ml-2 p-2 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-2xl">{booking.clientName}</h1>
        <button
          type="button"
          aria-label="Delete booking"
          onClick={() => {
            removeBooking(booking.id);
            navigate({ to: "/dashboard" });
          }}
          className="p-2 text-muted-foreground"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </header>

      <section className="surface p-4">
        <p className="text-xs text-muted-foreground">Workflow stage</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAGES.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => updateBooking(booking.id, { stage: s })}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                s === booking.stage
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < stageIndex
                    ? "border-border bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground"
              }`}
            >
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
        {stageIndex < STAGES.length - 1 ? (
          <button
            type="button"
            onClick={() =>
              updateBooking(booking.id, { stage: STAGES[stageIndex + 1] as Stage })
            }
            className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Move to {STAGE_LABELS[STAGES[stageIndex + 1] as Stage]}
          </button>
        ) : null}
      </section>

      <section className="surface mt-4 divide-y divide-border">
        <Row label="Photoshoot type" value={booking.shootType} />
        <Row label="Date & time" value={`${formatDate(booking.date)} · ${booking.time}`} />
        <Row label="Location" value={booking.location || "—"} />
        <Row label="Price" value={formatMoney(booking.price)} />
        <Row label="Delivery deadline" value={formatDate(booking.deliveryDeadline)} />
        <div className="flex items-center justify-between gap-3 p-4">
          <span className="text-xs text-muted-foreground">Payment status</span>
          <select
            className="rounded-md border border-input bg-card px-2 py-1 text-sm"
            value={booking.paymentStatus}
            onChange={(e) =>
              updateBooking(booking.id, {
                paymentStatus: e.target.value as PaymentStatus,
              })
            }
          >
            {PAYMENT_STATUSES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="surface mt-4 p-4">
        <p className="text-xs text-muted-foreground">Client</p>
        <p className="mt-1 text-sm font-medium">{booking.clientName}</p>
        <div className="mt-3 flex gap-2">
          <a
            href={`tel:${booking.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2 text-xs"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={1.6} />
            {booking.phone || "No phone"}
          </a>
          <a
            href={`mailto:${booking.email}`}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-border py-2 text-xs"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            <span className="truncate">{booking.email || "No email"}</span>
          </a>
        </div>
      </section>

      <section className="surface mt-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Checklist</p>
          <p className="text-xs text-muted-foreground">
            {doneCount}/{booking.checklist.length}
          </p>
        </div>
        <ul className="mt-3 space-y-3">
          {booking.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <Checkbox
                id={item.id}
                checked={item.done}
                onCheckedChange={(v) =>
                  updateBooking(booking.id, {
                    checklist: booking.checklist.map((c) =>
                      c.id === item.id ? { ...c, done: v === true } : c,
                    ),
                  })
                }
              />
              <label
                htmlFor={item.id}
                className={`text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}
              >
                {item.label}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface mt-4 p-4">
        <p className="text-xs text-muted-foreground">Notes</p>
        <Textarea
          rows={4}
          className="mt-2"
          value={booking.notes}
          onChange={(e) => updateBooking(booking.id, { notes: e.target.value })}
          placeholder="Anything important about the client or the session…"
        />
      </section>

      <BookingGallery booking={booking} updateBooking={updateBooking} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}

const MAX_IMAGES = 5;

function BookingGallery({
  booking,
  updateBooking,
}: {
  booking: {
    id: string;
    images: string[];
  };
  updateBooking: (id: string, patch: { images: string[] }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_IMAGES - booking.images.length;
    const toRead = Math.min(files.length, remaining);
    if (toRead <= 0) {
      alert(`You can add up to ${MAX_IMAGES} images per booking.`);
      return;
    }

    const nextImages: string[] = [];
    let loaded = 0;

    for (let i = 0; i < toRead; i++) {
      const file = files[i]!;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          nextImages[i] = reader.result;
        }
        loaded += 1;
        if (loaded === toRead) {
          updateBooking(booking.id, { images: [...booking.images, ...nextImages] });
        }
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  }

  function removeImage(index: number) {
    updateBooking(booking.id, {
      images: booking.images.filter((_, i) => i !== index),
    });
  }

  return (
    <section className="surface mt-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Gallery</p>
        <p className="text-xs text-muted-foreground">
          {booking.images.length}/{MAX_IMAGES}
        </p>
      </div>

      {booking.images.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {booking.images.map((src, i) => (
            <div key={`${src.slice(0, 24)}-${i}`} className="relative aspect-square overflow-hidden rounded-xl">
              <img
                src={src}
                alt={`Gallery image ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {booking.images.length < MAX_IMAGES ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 w-full rounded-full border border-dashed border-border py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          + Add photo
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileChange}
      />
    </section>
  );
}