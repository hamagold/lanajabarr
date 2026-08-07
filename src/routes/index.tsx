import { Link, createFileRoute } from "@tanstack/react-router";

import logo from "../../public/shootflow-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shootflow — Booking manager for photographers" },
      {
        name: "description",
        content:
          "Plan shoots, track editing and deliveries, and manage client payments in one simple mobile app.",
      },
      { property: "og:title", content: "Shootflow — Booking manager for photographers" },
      {
        property: "og:description",
        content: "Plan, shoot, deliver. A calm workflow app for working photographers.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between px-8 py-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative">
          <img
            src={logo}
            alt="Shootflow"
            width={120}
            height={120}
            className="h-32 w-32 drop-shadow-soft"
          />
        </div>
        <h1 className="mt-8 text-[46px] leading-none tracking-tight">Shootflow</h1>
        <p className="mt-3 text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
          Plan. Shoot. Deliver.
        </p>
        <p className="mt-10 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
          The calm, all-in-one workflow for photographers to manage bookings, clients, edits, and
          deliveries.
        </p>
      </div>
      <div className="w-full space-y-3">
        <Link
          to="/dashboard"
          className="block w-full rounded-full bg-primary px-6 py-4 text-center text-[15px] font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
        >
          Get started
        </Link>
        <p className="text-center text-[11px] text-muted-foreground">Simple. Mobile. Made for photographers.</p>
      </div>
    </div>
  );
}
