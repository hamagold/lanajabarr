import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronLeft, Copy, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationThumb } from "@/components/location-card";
import { useBookings } from "@/lib/booking-store";
import { useLocations } from "@/lib/location-store";

export const Route = createFileRoute("/locations/share")({
  validateSearch: (search: Record<string, unknown>) => ({
    ids: typeof search['ids'] === "string" ? search['ids'] : "",
  }),
  head: () => ({
    meta: [
      { title: "Share locations — Shootflow" },
      {
        name: "description",
        content: "Send a client-friendly page so your client can pick their favourite spot.",
      },
      { property: "og:title", content: "Share locations — Shootflow" },
      { property: "og:description", content: "Let your client choose their favourite spot." },
    ],
  }),
  component: ShareLocations,
});

function ShareLocations() {
  const { ids } = Route.useSearch();
  const { locations, addShare } = useLocations();
  const { bookings } = useBookings();
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [message, setMessage] = useState(
    "Here are a few locations I'd love to shoot at — let me know which one you prefer.",
  );
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedIds = useMemo(() => ids.split(",").filter(Boolean), [ids]);
  const selected = locations.filter((l) => selectedIds.includes(l.id));

  function create() {
    const id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    addShare({
      id,
      clientName: clientName.trim(),
      ...(bookingId ? { bookingId } : {}),
      locationIds: selectedIds,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    });
    setLink(`${window.location.origin}/share/${id}`);
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-16">
      <header className="flex items-center gap-2 pt-8 pb-5">
        <Link to="/locations" aria-label="Back" className="-ml-2 p-2 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl">Share with client</h1>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {selected.map((l) => (
          <div key={l.id} className="surface overflow-hidden">
            <div className="h-16 w-full bg-muted">
              <LocationThumb location={l} />
            </div>
            <p className="truncate p-2 text-[11px]">{l.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Client name">
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Jenny Andersson"
          />
        </Field>
        <Field label="Client email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jenny@email.com"
          />
        </Field>
        <Field label="Connect to a booking (optional)">
          <select
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          >
            <option value="">No booking</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.clientName} · {b.shootType}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Message">
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>

        {link ? (
          <div className="surface p-4">
            <p className="text-xs text-muted-foreground">Client link</p>
            <p className="mt-1 text-xs break-all">{link}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-xs font-medium"
              >
                {copied ? (
                  <Check className="h-4 w-4" strokeWidth={1.8} />
                ) : (
                  <Copy className="h-4 w-4" strokeWidth={1.6} />
                )}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
                  "Choose your photoshoot location",
                )}&body=${encodeURIComponent(`${message}\n\n${link}`)}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-medium text-primary-foreground"
              >
                <Mail className="h-4 w-4" strokeWidth={1.6} />
                Send email
              </a>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={create}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Create client page
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}