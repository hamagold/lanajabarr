import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ExternalLink, ImagePlus, Share2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { TagPill } from "@/components/location-card";
import { useLocations } from "@/lib/location-store";
import { googleMapsUrl, mapEmbedUrl } from "@/lib/locations";

export const Route = createFileRoute("/locations/$id")({
  head: () => ({
    meta: [
      { title: "Location details — Shootflow" },
      {
        name: "description",
        content: "Photos, map, notes and tags for a saved photoshoot location.",
      },
      { property: "og:title", content: "Location details — Shootflow" },
      { property: "og:description", content: "Photos, map and notes for a saved location." },
    ],
  }),
  component: LocationDetail,
});

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function LocationDetail() {
  const { id } = Route.useParams();
  const { getLocation, updateLocation, removeLocation, ready } = useLocations();
  const navigate = useNavigate();
  const location = getLocation(id);
  const [notesOpen, setNotesOpen] = useState(false);

  if (!ready) return null;

  if (!location) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-5">
        <p className="text-sm text-muted-foreground">This location no longer exists.</p>
        <Link to="/locations" className="text-sm underline underline-offset-4">
          Back to locations
        </Link>
      </div>
    );
  }

  const images = location.images ?? [];
  const tags = location.tags ?? [];

  async function addImages(files: FileList | null) {
    if (!files || !location) return;
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, 8)) next.push(await readFile(file));
    updateLocation(location.id, { images: [...images, ...next].slice(0, 20) });
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-16">
      <header className="flex items-center gap-2 pt-8 pb-4">
        <Link to="/locations" aria-label="Back" className="-ml-2 p-2 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-2xl">{location.name}</h1>
        <button
          type="button"
          aria-label="Delete location"
          onClick={() => {
            removeLocation(location.id);
            navigate({ to: "/locations" });
          }}
          className="p-2 text-muted-foreground"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </header>

      <section className="surface overflow-hidden">
        {images.length > 0 ? (
          <div className="-mx-0 flex snap-x gap-2 overflow-x-auto p-2">
            {images.map((src, i) => (
              <div
                key={i}
                className="relative h-48 w-64 shrink-0 snap-start overflow-hidden rounded-xl"
              >
                <img src={src} alt={location.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() =>
                    updateLocation(location.id, {
                      images: images.filter((_, idx) => idx !== i),
                    })
                  }
                  className="absolute top-2 right-2 rounded-full bg-card/90 p-1.5"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-center text-xs text-muted-foreground">No photos yet</p>
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-border py-3 text-xs text-muted-foreground">
          <ImagePlus className="h-4 w-4" strokeWidth={1.6} />
          Add photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void addImages(e.target.files)}
          />
        </label>
      </section>

      <section className="surface mt-4 overflow-hidden">
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Address</p>
          <p className="mt-1 text-sm font-medium">{location.address || "No address saved"}</p>
          {typeof location.lat === "number" ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {location.lat.toFixed(5)}, {location.lon?.toFixed(5)}
            </p>
          ) : null}
        </div>
        <div className="relative h-56 w-full bg-muted">
          <iframe
            src={mapEmbedUrl(location)}
            title={`Map of ${location.name}`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <a
          href={googleMapsUrl(location)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 border-t border-border py-3 text-sm font-medium"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.6} />
          Open in Google Maps
        </a>
      </section>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <TagPill key={t}>{t}</TagPill>
          ))}
        </div>
      ) : null}

      <section className="surface mt-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Notes</p>
          <button
            type="button"
            onClick={() => setNotesOpen((o) => !o)}
            className="text-xs underline underline-offset-2"
          >
            {notesOpen ? "Done" : "Edit"}
          </button>
        </div>
        {notesOpen ? (
          <Textarea
            rows={4}
            className="mt-2"
            value={location.notes}
            onChange={(e) => updateLocation(location.id, { notes: e.target.value })}
          />
        ) : (
          <p className="mt-2 text-sm whitespace-pre-wrap">
            {location.notes || "No notes yet."}
          </p>
        )}
      </section>

      <Link
        to="/locations/share"
        search={{ ids: location.id }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
      >
        <Share2 className="h-4 w-4" strokeWidth={1.6} />
        Share with client
      </Link>
    </div>
  );
}