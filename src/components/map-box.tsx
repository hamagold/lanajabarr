import { MapPin } from "lucide-react";
import { mapEmbedUrl, type SavedLocation } from "@/lib/locations";
import { useI18n } from "@/lib/i18n";

export function MapBox({
  location,
  saved,
}: {
  location: string;
  saved?: SavedLocation | undefined;
}) {
  const { t } = useI18n();
  const label = saved ? saved.name : location;
  if (!label) {
    return (
      <section className="surface mt-4 p-4">
        <p className="text-xs text-muted-foreground">{t("booking.location")}</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" strokeWidth={1.6} />
          <span>{t("loc.noLocationSet")}</span>
        </div>
      </section>
    );
  }

  const mapUrl = saved
    ? mapEmbedUrl(saved)
    : `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="surface mt-4 overflow-hidden">
      <div className="p-4">
        <p className="text-xs text-muted-foreground">{t("booking.location")}</p>
        <p className="mt-1 flex items-start gap-2 text-sm font-medium">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
          <span>{label}</span>
        </p>
        {saved?.address ? (
          <p className="mt-1 pl-6 text-xs text-muted-foreground">{saved.address}</p>
        ) : null}
      </div>
      <div className="relative h-56 w-full bg-muted">
        <iframe
          src={mapUrl}
          title={`Map showing ${label}`}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
