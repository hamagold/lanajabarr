import { Link, createFileRoute } from "@tanstack/react-router";

import logo from "../../public/shootflow-logo.png";
import { OnboardingTour } from "../components/onboarding-tour";

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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between px-6 py-12">
      <div className="flex flex-col items-center pt-6 text-center">
        <img
          src={logo}
          alt="Shootflow"
          width={120}
          height={120}
          className="h-24 w-24 drop-shadow-soft"
        />
        <h1 className="mt-5 text-[40px] leading-none tracking-tight">Shootflow</h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
          Plan. Shoot. Deliver.
        </p>
      </div>

      <div className="w-full flex-1 py-8">
        <OnboardingTour />
      </div>

      <div className="w-full space-y-3">
        <Link
          to="/dashboard"
          className="block w-full rounded-full bg-primary px-6 py-4 text-center text-[15px] font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
        >
          Get started
        </Link>
        <p className="text-center text-[11px] text-muted-foreground">
          Simple. Mobile. Made for photographers.
        </p>
      </div>
    </div>
  );
}
