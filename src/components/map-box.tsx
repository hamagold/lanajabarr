import { MapPin } from "lucide-react";

export function MapBox({ location }: { location: string }) {
  if (!location) {
    return (
      <section className="surface mt-4 p-4">
        <p className="text-xs text-muted-foreground">Location</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" strokeWidth={1.6} />
          <span>No location set</span>
        </div>
      </section>
    );
  }

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="surface mt-4 overflow-hidden">
      <div className="p-4">
        <p className="text-xs text-muted-foreground">Location</p>
        <p className="mt-1 flex items-start gap-2 text-sm font-medium">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
          <span>{location}</span>
        </p>
      </div>
      <div className="relative h-56 w-full bg-muted">
        <iframe
          src={mapUrl}
          title={`Map showing ${location}`}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
