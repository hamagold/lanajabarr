import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, MapPin, Plus, Share2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { LocationCard } from "@/components/location-card";
import { useLocations } from "@/lib/location-store";

export const Route = createFileRoute("/locations/")({
  head: () => ({
    meta: [
      { title: "Location library — Shootflow" },
      {
        name: "description",
        content:
          "Save, organise and share your favourite photography locations with clients.",
      },
      { property: "og:title", content: "Location library — Shootflow" },
      {
        property: "og:description",
        content: "Save and share your favourite photoshoot locations.",
      },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const { locations, shares, ready } = useLocations();
  const navigate = useNavigate();
  const [tag, setTag] = useState<string>("All");
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => (l.tags ?? []).forEach((t) => set.add(t)));
    return ["All", ...Array.from(set).sort()];
  }, [locations]);

  const visible = useMemo(
    () => (tag === "All" ? locations : locations.filter((l) => (l.tags ?? []).includes(tag))),
    [locations, tag],
  );

  const answered = shares.filter((s) => s.selectedLocationId);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  return (
    <AppShell
      header={
        <PageHeader
          title="Locations"
          subtitle={`${locations.length} saved spot${locations.length === 1 ? "" : "s"}`}
          right={
            <button
              type="button"
              onClick={() => {
                setPicking((p) => !p);
                setPicked([]);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium"
            >
              {picking ? (
                <>
                  <X className="h-4 w-4" strokeWidth={1.6} /> Cancel
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" strokeWidth={1.6} /> Share
                </>
              )}
            </button>
          }
        />
      }
    >
      {answered.length > 0 && !picking ? (
        <section className="surface mb-4 p-4">
          <p className="text-xs text-muted-foreground">Client picks</p>
          <ul className="mt-2 space-y-1.5">
            {answered.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                <span className="min-w-0">
                  <span className="font-medium">{s.clientName || "Client"}</span> chose{" "}
                  <Link
                    to="/locations/$id"
                    params={{ id: s.selectedLocationId! }}
                    className="underline underline-offset-2"
                  >
                    this location
                  </Link>
                  {s.clientComment ? (
                    <span className="block text-xs text-muted-foreground">
                      “{s.clientComment}”
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTag(t)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              tag === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {ready && visible.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 p-8 text-center">
          <MapPin className="h-6 w-6 text-muted-foreground" strokeWidth={1.4} />
          <p className="text-sm font-medium">No locations yet</p>
          <p className="text-xs text-muted-foreground">
            Save the spots you love so they're ready for the next shoot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {visible.map((l) => (
            <LocationCard
              key={l.id}
              location={l}
              selectable={picking}
              selected={picked.includes(l.id)}
              onToggle={() => toggle(l.id)}
            />
          ))}
        </div>
      )}

      {picking ? (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto w-full max-w-md px-5 md:max-w-2xl lg:bottom-8 lg:max-w-3xl">
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() =>
              navigate({ to: "/locations/share", search: { ids: picked.join(",") } })
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.6} />
            Share {picked.length || ""} with client
          </button>
        </div>
      ) : (
        <Link
          to="/locations/new"
          className="fixed right-[max(1.25rem,calc(50%-13.5rem))] bottom-24 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft"
          aria-label="Add location"
        >
          <Plus className="h-6 w-6" strokeWidth={1.6} />
        </Link>
      )}
    </AppShell>
  );
}