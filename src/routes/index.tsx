import { Link, createFileRoute } from "@tanstack/react-router";
import { Aperture } from "lucide-react";

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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-8 py-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Aperture className="h-12 w-12 text-primary" strokeWidth={1} />
        <h1 className="mt-6 text-[42px] leading-none tracking-tight">Shootflow</h1>
        <p className="mt-3 text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          Plan. Shoot. Deliver.
        </p>
        <p className="mt-8 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
          The all-in-one app for photographers to plan sessions, organize clients and grow
          their business.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="block rounded-full bg-primary px-6 py-4 text-center text-[15px] font-medium text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Get started
      </Link>
    </div>
  );
}
