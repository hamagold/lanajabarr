import { Link } from "@tanstack/react-router";
import { AlertTriangle, ImagePlus, Loader2, MapPin, Search, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocations } from "@/lib/location-store";
import { LOCATION_TAGS, searchPlaces, type GeoResult, type SavedLocation } from "@/lib/locations";

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

export function BookingLocationPicker({
  locationId,
  onAssign,
}: {
  locationId?: string | undefined;
  onAssign: (patch: { locationId?: string | undefined; location: string }) => void;
}) {
  const { locations, ready, updateLocation } = useLocations();
  const [editOpen, setEditOpen] = useState(false);
  const assigned = locationId ? locations.find((l) => l.id === locationId) : undefined;
  const missing = ready && !!locationId && !assigned;

  return (
    <section className="surface mt-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Saved location</p>
        <Link to="/locations" className="text-xs underline underline-offset-2">
          Library
        </Link>
      </div>
      {missing ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-secondary p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
          <div className="min-w-0">
            <p className="text-xs">
              The saved location linked to this booking was deleted.
            </p>
            <button
              type="button"
              onClick={() => onAssign({ locationId: undefined, location: "" })}
              className="mt-1 text-xs underline underline-offset-2"
            >
              Clear the link
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
        <select
          className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
          value={assigned ? assigned.id : ""}
          onChange={(e) => {
            const id = e.target.value;
            if (!id) {
              onAssign({ locationId: undefined, location: "" });
              return;
            }
            const loc = locations.find((l) => l.id === id);
            if (loc) onAssign({ locationId: loc.id, location: loc.address || loc.name });
          }}
        >
          <option value="">No saved location</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      {assigned ? (
        <>
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setEditOpen((o) => !o)}
              className="text-xs underline underline-offset-2"
            >
              {editOpen ? "Done editing" : "Quick edit"}
            </button>
            <Link
              to="/locations/$id"
              params={{ id: assigned.id }}
              className="text-xs underline underline-offset-2"
            >
              Open location details
            </Link>
          </div>
          {editOpen ? (
            <QuickEdit
              location={assigned}
              onChange={(patch) => {
                updateLocation(assigned.id, patch);
                if (patch.address || patch.name) {
                  onAssign({
                    locationId: assigned.id,
                    location: patch.address ?? assigned.address ?? patch.name ?? assigned.name,
                  });
                }
              }}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function QuickEdit({
  location,
  onChange,
}: {
  location: SavedLocation;
  onChange: (patch: Partial<SavedLocation>) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const images = location.images ?? [];
  const tags = location.tags ?? [];

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const found = await searchPlaces(query.trim());
      setResults(found);
      if (found.length === 0) setError("No places matched that search.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    }
    setSearching(false);
  }

  async function addImages(files: FileList | null) {
    if (!files) return;
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, 8)) next.push(await readFile(file));
    onChange({ images: [...images, ...next].slice(0, 20) });
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Name</Label>
        <Input value={location.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Address / area</Label>
        <Input value={location.address} onChange={(e) => onChange({ address: e.target.value })} />
        {typeof location.lat === "number" ? (
          <p className="text-[11px] text-muted-foreground">
            {location.lat.toFixed(5)}, {location.lon?.toFixed(5)}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Update coordinates</Label>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="Search a place…"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            aria-label="Search places"
            className="inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-card"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
            ) : (
              <Search className="h-4 w-4" strokeWidth={1.6} />
            )}
          </button>
        </div>
        {results.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {results.map((r) => (
              <li key={`${r.lat}-${r.lon}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ address: r.label, lat: r.lat, lon: r.lon });
                    setResults([]);
                    setQuery("");
                  }}
                  className="w-full p-3 text-left text-xs active:bg-secondary"
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Tags</Label>
        <div className="flex flex-wrap gap-2">
          {LOCATION_TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() =>
                  onChange({ tags: on ? tags.filter((x) => x !== t) : [...tags, t] })
                }
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Photos</Label>
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                <img src={src} alt={location.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => onChange({ images: images.filter((_, idx) => idx !== i) })}
                  className="absolute top-1 right-1 rounded-full bg-card/90 p-1"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-border py-3 text-xs text-muted-foreground">
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
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea
          rows={3}
          value={location.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Parking, light, permits…"
        />
      </div>
    </div>
  );
}