import { Link, createFileRoute } from "@tanstack/react-router";
import { useAppSettings } from "@/lib/app-settings";
import { useI18n } from "@/lib/i18n";

import lightLogo from "../../public/shootflow-logo-light.png";
import welcomeBg from "../../public/shootflow-welcome-bg.jpg";

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
      { property: "og:image", content: welcomeBg },
      { name: "twitter:image", content: welcomeBg },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { settings } = useAppSettings();
  const { t } = useI18n();
  const logoSrc = settings.logo || lightLogo;
  const appName = settings.name || "Shootflow";

  return (
    <div
      className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between overflow-hidden px-6 py-12 text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, oklch(0.62 0.04 70 / 0.25), oklch(0.45 0.05 70 / 0.45)), url(${welcomeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 -z-10 bg-black/15" />

      <div className="flex flex-col items-center pt-8 text-center">
        <img
          src={logoSrc}
          alt={appName}
          width={80}
          height={80}
          className="h-20 w-20 rounded-full object-contain drop-shadow-lg"
        />
        <h1 className="mt-5 text-[40px] leading-none tracking-tight drop-shadow-md">{appName}</h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.4em] text-white/90">
          {t("welcome.tagline")}
        </p>
      </div>

      <div className="w-full space-y-3">
        <Link
          to="/auth"
          className="block w-full rounded-full bg-white px-6 py-4 text-center text-[15px] font-medium text-[oklch(0.35_0.03_55)] shadow-soft transition-transform active:scale-[0.98]"
        >
          {t("welcome.cta")}
        </Link>
        <p className="text-center text-[11px] text-white/70">
          {t("welcome.footnote")}
        </p>
      </div>
    </div>
  );
}
