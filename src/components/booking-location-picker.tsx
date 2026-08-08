import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useLocations } from "@/lib/location-store";

export function BookingLocationPicker({
  locationId,
  onAssign,
}: {
  locationId?: string;
  onAssign: (patch: { locationId?: string; location: string }) => void;
}) {
  const { locations } = useLocations();

  return (
    <section className="surface mt-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Saved location</p>
        <Link to="/locations" className="text-xs underline underline-offset-2">
          Library
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
        <select
          className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
          value={locationId ?? ""}
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
      {locationId ? (
        <Link
          to="/locations/$id"
          params={{ id: locationId }}
          className="mt-3 inline-block text-xs underline underline-offset-2"
        >
          Open location details
        </Link>
      ) : null}
    </section>
  );
}