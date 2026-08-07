import { createFileRoute } from "@tanstack/react-router";
import { Check, ExternalLink, MapPin } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useLocations } from "@/lib/location-store";
import { googleMapsUrl, mapEmbedUrl } from "@/lib/locations";

export const Route = createFileRoute("/share/$shareId")({
  head: () => ({
    meta: [
      { title: "Choose your location — Shootflow" },
      {
        name: "description",
        content: "Browse the locations your photographer suggested and pick your favourite.",
      },
      { property: "og:title", content: "Choose your photoshoot location" },
      {
        property: "og:description",
        content: "Photos, maps and notes for each suggested location.",
      },
    ],
  }),
  component: ClientSharePage,
});

function ClientSharePage() {
  const { shareId } = Route.useParams();
  const { getShare, locations, recordSelection, ready } = useLocations();
  const share = getShare(shareId);
  const [comment, setComment] = useState("");

  if (!ready) return null;

  if (!share) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-5 text-center">
        <p className="text-sm text-muted-foreground">
          This location page isn't available on this device.
        </p>
      </div>
    );
  }

  const picks = share.locationIds
    .map((id) => locations.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-16">
      <header className="pt-10 pb-6 text-center">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Shootflow</p>
        <h1 className="mt-2 text-[30px] leading-tight">
          {share.clientName ? `Hi ${share.clientName}` : "Choose your location"}
        </h1>
        {share.message ? (
          <p className="mt-2 text-sm text-muted-foreground">{share.message}</p>
        ) : null}
      </header>

      <div className="space-y-5">
        {picks.map((l) => {
          const chosen = share.selectedLocationId === l.id;
          const images = l.images ?? [];
          return (
            <section key={l.id} className="surface overflow-hidden">
              {images.length > 0 ? (
                <div className="flex snap-x gap-2 overflow-x-auto p-2">
                  {images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={l.name}
                      className="h-44 w-60 shrink-0 snap-start rounded-xl object-cover"
                    />
                  ))}
                </div>
              ) : null}
              <div className="p-4">
                <h2 className="text-xl">{l.name}</h2>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
                  {l.address}
                </p>
                {l.notes ? <p className="mt-3 text-sm whitespace-pre-wrap">{l.notes}</p> : null}
                {(l.tags ?? []).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(l.tags ?? []).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="relative h-44 w-full bg-muted">
                <iframe
                  src={mapEmbedUrl(l)}
                  title={`Map of ${l.name}`}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={googleMapsUrl(l)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 border-t border-border py-3 text-xs font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} />
                Open in Google Maps
              </a>
              <button
                type="button"
                onClick={() => recordSelection(share.id, l.id, comment)}
                className={`flex w-full items-center justify-center gap-2 border-t border-border py-3.5 text-sm font-medium ${
                  chosen ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {chosen ? <Check className="h-4 w-4" strokeWidth={1.8} /> : null}
                {chosen ? "Your choice" : "Choose this location"}
              </button>
            </section>
          );
        })}
      </div>

      <div className="surface mt-5 p-4">
        <p className="text-xs text-muted-foreground">Anything you'd like to add?</p>
        <Textarea
          rows={3}
          className="mt-2"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="We'd prefer late afternoon…"
        />
        {share.selectedLocationId ? (
          <button
            type="button"
            onClick={() => recordSelection(share.id, share.selectedLocationId!, comment)}
            className="mt-3 w-full rounded-full border border-border bg-card py-2.5 text-xs font-medium"
          >
            Send note to photographer
          </button>
        ) : null}
      </div>
    </div>
  );
}