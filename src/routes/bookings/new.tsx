import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBookings } from "@/lib/booking-store";
import { useLocations } from "@/lib/location-store";
import {
  PAYMENT_STATUSES,
  SHOOT_TYPES,
  newChecklist,
  type PaymentStatus,
} from "@/lib/bookings";

export const Route = createFileRoute("/bookings/new")({
  head: () => ({
    meta: [
      { title: "New booking — Shootflow" },
      { name: "description", content: "Create a new photography booking in seconds." },
      { property: "og:title", content: "New booking — Shootflow" },
      { property: "og:description", content: "Create a new photography booking." },
    ],
  }),
  component: NewBooking,
});

function NewBooking() {
  const { addBooking } = useBookings();
  const { locations } = useLocations();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientName: "",
    phone: "",
    email: "",
    shootType: "Portrait",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    location: "",
    locationId: "",
    price: "",
    paymentStatus: "Unpaid" as PaymentStatus,
    deliveryDeadline: "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = `b${Date.now()}`;
    addBooking({
      ...form,
      id,
      ...(form.locationId ? { locationId: form.locationId } : {}),
      price: Number(form.price) || 0,
      checklist: newChecklist(),
      stage: "upcoming",
      images: [],
    });
    navigate({ to: "/bookings/$id", params: { id } });
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-16">
      <header className="flex items-center gap-2 pt-8 pb-5">
        <Link to="/dashboard" aria-label="Back" className="-ml-2 p-2 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl">New booking</h1>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Client name">
          <Input
            required
            value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            placeholder="Jenny Andersson"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Photoshoot type">
          <select
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={form.shootType}
            onChange={(e) => set("shootType", e.target.value)}
          >
            {SHOOT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Saved location">
          <select
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={form.locationId}
            onChange={(e) => {
              const id = e.target.value;
              const loc = locations.find((l) => l.id === id);
              setForm((f) => ({
                ...f,
                locationId: id,
                location: loc ? loc.address || loc.name : f.location,
              }));
            }}
          >
            <option value="">None — type it manually</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <Input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Seaside, Kalmar"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (EUR)">
            <Input
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="350"
            />
          </Field>
          <Field label="Payment status">
            <select
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              value={form.paymentStatus}
              onChange={(e) => set("paymentStatus", e.target.value)}
            >
              {PAYMENT_STATUSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Delivery deadline">
          <Input
            type="date"
            value={form.deliveryDeadline}
            onChange={(e) => set("deliveryDeadline", e.target.value)}
          />
        </Field>
        <Field label="Notes">
          <Textarea
            rows={4}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything important about the client or session…"
          />
        </Field>

        <button
          type="submit"
          className="w-full rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Create booking
        </button>
      </form>
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