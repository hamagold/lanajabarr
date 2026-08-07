export const LOCATION_TAGS = [
  "Wedding",
  "Family",
  "Portrait",
  "Newborn",
  "Branding",
  "Couple",
  "Outdoor",
  "Studio",
  "Urban",
  "Beach",
] as const;

export type LocationTag = (typeof LOCATION_TAGS)[number];

export type SavedLocation = {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lon?: number;
  notes: string;
  tags: string[];
  images: string[]; // base64 data URLs
  createdAt: string;
};

export type ClientShare = {
  id: string;
  clientName: string;
  bookingId?: string;
  locationIds: string[];
  message: string;
  createdAt: string;
  selectedLocationId?: string;
  selectedAt?: string;
  clientComment?: string;
};

export function mapQuery(loc: Pick<SavedLocation, "address" | "name" | "lat" | "lon">) {
  if (typeof loc.lat === "number" && typeof loc.lon === "number") {
    return `${loc.lat},${loc.lon}`;
  }
  return loc.address || loc.name;
}

export function mapEmbedUrl(loc: SavedLocation, zoom = 14) {
  const q = encodeURIComponent(mapQuery(loc));
  return `https://maps.google.com/maps?q=${q}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
}

export function googleMapsUrl(loc: SavedLocation) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(loc))}`;
}

export type GeoResult = { label: string; lat: number; lon: number };

export async function searchPlaces(query: string): Promise<GeoResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Place search is unavailable right now.");
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((d) => ({
    label: d.display_name,
    lat: Number(d.lat),
    lon: Number(d.lon),
  }));
}

export function seedLocations(): SavedLocation[] {
  return [
    {
      id: "l1",
      name: "Kalmar Old Town",
      address: "Gamla stan, Kalmar, Sweden",
      lat: 56.6634,
      lon: 16.3568,
      notes: "Cobbled streets and pastel walls. Best in soft light, avoid midday crowds.",
      tags: ["Couple", "Portrait", "Urban"],
      images: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "l2",
      name: "Stensö Beach",
      address: "Stensö, Kalmar, Sweden",
      lat: 56.6478,
      lon: 16.3391,
      notes: "Wide open beach with reeds. Golden hour is unbeatable. Parking is 5 min away.",
      tags: ["Family", "Wedding", "Outdoor", "Beach"],
      images: [],
      createdAt: new Date().toISOString(),
    },
  ];
}