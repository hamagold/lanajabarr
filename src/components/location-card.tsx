import { Link } from "@tanstack/react-router";
import { ImageIcon, MapPin } from "lucide-react";
import { mapEmbedUrl, type SavedLocation } from "@/lib/locations";
import { useI18n } from "@/lib/i18n";

export function LocationThumb({ location }: { location: SavedLocation }) {
  const images = location.images ?? [];
  if (images.length > 0) {
    return (
      <img
        src={images[0]}
        alt={location.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <iframe
      src={mapEmbedUrl(location, 13)}
      title={`Map of ${location.name}`}
      className="pointer-events-none h-full w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}

export function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
      {children}
    </span>
  );
}

export function LocationCard({
  location,
  selectable,
  selected,
  onToggle,
}: {
  location: SavedLocation;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const { t, tx } = useI18n();
  const images = location.images ?? [];
  const tags = location.tags ?? [];

  const body = (
    <>
      <div className="relative h-28 w-full overflow-hidden bg-muted">
        <LocationThumb location={location} />
        {images.length > 1 ? (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[10px] text-muted-foreground">
            <ImageIcon className="h-3 w-3" strokeWidth={1.6} />
            {images.length}
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold">{location.name}</p>
        <p className="mt-0.5 flex items-start gap-1 text-[11px] text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.6} />
          <span className="line-clamp-2">{location.address || t("loc.noAddress")}</span>
        </p>
        {tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <TagPill key={tag}>{tx(`tag.${tag}`, tag)}</TagPill>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`surface overflow-hidden text-left transition-transform active:scale-[0.99] ${
          selected ? "ring-2 ring-primary" : ""
        }`}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      to="/locations/$id"
      params={{ id: location.id }}
      className="surface overflow-hidden transition-transform active:scale-[0.99]"
    >
      {body}
    </Link>
  );
}