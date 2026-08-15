import { RequireAuth } from "@/components/require-auth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ImagePlus, Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocations } from "@/lib/location-store";
import { LOCATION_TAGS, searchPlaces, type GeoResult } from "@/lib/locations";

export const Route = createFileRoute("/locations/new")({
  head: () => ({
    meta: [
      { title: "Add location — Shootflow" },
      {
        name: "description",
        content: "Save a new photoshoot location with photos, notes and tags.",
      },
      { property: "og:title", content: "Add location — Shootflow" },
      { property: "og:description", content: "Save a new photoshoot location." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NewLocation />
    </RequireAuth>
  ),
});

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function NewLocation() {
  const { addLocation } = useLocations();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

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

  function pick(r: GeoResult) {
    setAddress(r.label);
    setCoords({ lat: r.lat, lon: r.lon });
    setResults([]);
    if (!name) setName(r.label.split(",")[0] ?? "");
  }

  async function addImages(files: FileList | null) {
    if (!files) return;
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, 8)) {
      next.push(await readFile(file));
    }
    setImages((p) => [...p, ...next].slice(0, 12));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = `l${Date.now()}`;
    addLocation({
      id,
      name: name.trim() || "Untitled location",
      address: address.trim(),
      ...(coords ? { lat: coords.lat, lon: coords.lon } : {}),
      notes: notes.trim(),
      tags,
      images,
      createdAt: new Date().toISOString(),
    });
    navigate({ to: "/locations/$id", params: { id } });
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-16">
      <header className="flex items-center gap-2 pt-8 pb-5">
        <Link to="/locations" aria-label="Back" className="-ml-2 p-2 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl">Add location</h1>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Location name">
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Stensö Beach"
          />
        </Field>

        <Field label="Search the map">
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
              placeholder="Stensö, Kalmar"
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              className="inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-card"
              aria-label="Search places"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
              ) : (
                <Search className="h-4 w-4" strokeWidth={1.6} />
              )}
            </button>
          </div>
        </Field>

        {results.length > 0 ? (
          <ul className="surface divide-y divide-border overflow-hidden">
            {results.map((r) => (
              <li key={`${r.lat}-${r.lon}`}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="w-full p-3 text-left text-xs transition-colors active:bg-secondary"
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <Field label="Address / area">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Stensö, Kalmar, Sweden"
          />
        </Field>
        {coords ? (
          <p className="-mt-2 text-[11px] text-muted-foreground">
            Saved coordinates: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
          </p>
        ) : null}

        <Field label="Reference photos">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card py-4 text-xs text-muted-foreground">
            <ImagePlus className="h-4 w-4" strokeWidth={1.6} />
            Upload photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void addImages(e.target.files)}
            />
          </label>
          {images.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 rounded-full bg-card/90 p-1"
                  >
                    <X className="h-3 w-3" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </Field>

        <Field label="Tags">
          <div className="flex flex-wrap gap-2">
            {LOCATION_TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setTags((p) => (on ? p.filter((x) => x !== t) : [...p, t]))
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
        </Field>

        <Field label="Notes">
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Best light, parking, permits, backup spot…"
          />
        </Field>

        <button
          type="submit"
          className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Save location
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
