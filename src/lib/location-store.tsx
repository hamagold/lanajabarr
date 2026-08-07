import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedLocations, type ClientShare, type SavedLocation } from "./locations";

const LOC_KEY = "shootflow.locations.v1";
const SHARE_KEY = "shootflow.locationShares.v1";

function normalize(list: SavedLocation[]): SavedLocation[] {
  return (Array.isArray(list) ? list : []).map((l) => ({
    ...l,
    images: Array.isArray(l?.images) ? l.images : [],
    tags: Array.isArray(l?.tags) ? l.tags : [],
  }));
}

type Ctx = {
  locations: SavedLocation[];
  shares: ClientShare[];
  ready: boolean;
  getLocation: (id: string) => SavedLocation | undefined;
  addLocation: (l: SavedLocation) => void;
  updateLocation: (id: string, patch: Partial<SavedLocation>) => void;
  removeLocation: (id: string) => void;
  getShare: (id: string) => ClientShare | undefined;
  addShare: (s: ClientShare) => void;
  removeShare: (id: string) => void;
  recordSelection: (shareId: string, locationId: string, comment: string) => void;
};

const LocationContext = createContext<Ctx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [shares, setShares] = useState<ClientShare[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocations(normalize(read<SavedLocation[]>(LOC_KEY, seedLocations())));
    setShares(read<ClientShare[]>(SHARE_KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(LOC_KEY, JSON.stringify(locations));
      window.localStorage.setItem(SHARE_KEY, JSON.stringify(shares));
    } catch {
      /* ignore quota errors */
    }
  }, [locations, shares, ready]);

  // Keep the photographer's view in sync when a client selects in another tab.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === SHARE_KEY) setShares(read<ClientShare[]>(SHARE_KEY, []));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const getLocation = useCallback(
    (id: string) => locations.find((l) => l.id === id),
    [locations],
  );
  const addLocation = useCallback((l: SavedLocation) => setLocations((p) => [l, ...p]), []);
  const updateLocation = useCallback(
    (id: string, patch: Partial<SavedLocation>) =>
      setLocations((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l))),
    [],
  );
  const removeLocation = useCallback(
    (id: string) => setLocations((p) => p.filter((l) => l.id !== id)),
    [],
  );

  const getShare = useCallback((id: string) => shares.find((s) => s.id === id), [shares]);
  const addShare = useCallback((s: ClientShare) => setShares((p) => [s, ...p]), []);
  const removeShare = useCallback(
    (id: string) => setShares((p) => p.filter((s) => s.id !== id)),
    [],
  );
  const recordSelection = useCallback(
    (shareId: string, locationId: string, comment: string) =>
      setShares((p) =>
        p.map((s) =>
          s.id === shareId
            ? {
                ...s,
                selectedLocationId: locationId,
                selectedAt: new Date().toISOString(),
                clientComment: comment,
              }
            : s,
        ),
      ),
    [],
  );

  const value = useMemo(
    () => ({
      locations,
      shares,
      ready,
      getLocation,
      addLocation,
      updateLocation,
      removeLocation,
      getShare,
      addShare,
      removeShare,
      recordSelection,
    }),
    [
      locations,
      shares,
      ready,
      getLocation,
      addLocation,
      updateLocation,
      removeLocation,
      getShare,
      addShare,
      removeShare,
      recordSelection,
    ],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocations() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocations must be used inside LocationProvider");
  return ctx;
}