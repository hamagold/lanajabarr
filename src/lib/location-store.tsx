import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-session";
import { seedLocations, type ClientShare, type SavedLocation } from "./locations";

const LEGACY_LOC_KEY = "shootflow.locations.v1";
const LEGACY_SHARE_KEY = "shootflow.locationShares.v1";

const locCache = (uid: string) => `shootflow.locations.${uid}`;
const shareCache = (uid: string) => `shootflow.locationShares.${uid}`;

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

function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Anyone with the link can read a share (and its location snapshots). */
export async function fetchPublicShare(
  shareId: string,
): Promise<{ share: ClientShare; locations: SavedLocation[] } | null> {
  const { data, error } = await supabase.rpc("get_public_share", { p_id: shareId });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return null;
  return {
    share: row.data as unknown as ClientShare,
    locations: normalize((row.locations ?? []) as unknown as SavedLocation[]),
  };
}

export async function recordPublicSelection(
  shareId: string,
  locationId: string,
  comment: string,
): Promise<ClientShare | null> {
  const { data, error } = await supabase.rpc("respond_to_share", {
    p_id: shareId,
    p_location_id: locationId,
    p_comment: comment,
  });
  if (error || !data) return null;
  return data as unknown as ClientShare;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const userId = user?.id ?? null;
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [shares, setShares] = useState<ClientShare[]>([]);
  const [ready, setReady] = useState(false);
  const userRef = useRef<string | null>(null);
  const locRef = useRef<SavedLocation[]>([]);
  userRef.current = userId;
  locRef.current = locations;

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setReady(false);
    if (!userId) {
      setLocations([]);
      setShares([]);
      setReady(true);
      return;
    }

    setLocations(normalize(readCache<SavedLocation[]>(locCache(userId), [])));
    setShares(readCache<ClientShare[]>(shareCache(userId), []));

    (async () => {
      const [locRes, shareRes] = await Promise.all([
        supabase.from("locations").select("id, data").eq("user_id", userId),
        supabase.from("location_shares").select("id, data").eq("user_id", userId),
      ]);
      if (cancelled) return;
      if (locRes.error) console.error(locRes.error);
      if (shareRes.error) console.error(shareRes.error);

      let locRows = normalize(
        (locRes.data ?? []).map((r) => r.data as unknown as SavedLocation),
      );
      if (locRows.length === 0) {
        let legacy: SavedLocation[] = normalize(
          readCache<SavedLocation[]>(LEGACY_LOC_KEY, []),
        );
        locRows = legacy.length > 0 ? legacy : normalize(seedLocations());
        window.localStorage.removeItem(LEGACY_LOC_KEY);
        window.localStorage.removeItem(LEGACY_SHARE_KEY);
        await supabase
          .from("locations")
          .upsert(locRows.map((l) => ({ id: l.id, user_id: userId, data: l as never })));
      }

      if (cancelled) return;
      setLocations(locRows);
      setShares((shareRes.data ?? []).map((r) => r.data as unknown as ClientShare));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  useEffect(() => {
    if (!ready || !userId) return;
    try {
      window.localStorage.setItem(locCache(userId), JSON.stringify(locations));
      window.localStorage.setItem(shareCache(userId), JSON.stringify(shares));
    } catch {
      /* ignore quota errors */
    }
  }, [locations, shares, ready, userId]);

  const persistLocations = useCallback(async (rows: SavedLocation[]) => {
    const uid = userRef.current;
    if (!uid || rows.length === 0) return;
    const { error } = await supabase
      .from("locations")
      .upsert(rows.map((l) => ({ id: l.id, user_id: uid, data: l as never })));
    if (error) console.error(error);
  }, []);

  const persistShare = useCallback(async (s: ClientShare) => {
    const uid = userRef.current;
    if (!uid) return;
    const snapshots = locRef.current.filter((l) => s.locationIds.includes(l.id));
    const { error } = await supabase.from("location_shares").upsert({
      id: s.id,
      user_id: uid,
      data: s as never,
      locations: snapshots as never,
    });
    if (error) console.error(error);
  }, []);

  const getLocation = useCallback((id: string) => locations.find((l) => l.id === id), [locations]);

  const addLocation = useCallback(
    (l: SavedLocation) => {
      setLocations((p) => [l, ...p]);
      void persistLocations([l]);
    },
    [persistLocations],
  );

  const updateLocation = useCallback(
    (id: string, patch: Partial<SavedLocation>) =>
      setLocations((p) => {
        const next = p.map((l) => (l.id === id ? { ...l, ...patch } : l));
        const changed = next.find((l) => l.id === id);
        if (changed) void persistLocations([changed]);
        return next;
      }),
    [persistLocations],
  );

  const removeLocation = useCallback((id: string) => {
    setLocations((p) => p.filter((l) => l.id !== id));
    const uid = userRef.current;
    if (uid) void supabase.from("locations").delete().eq("id", id).eq("user_id", uid);
  }, []);

  const getShare = useCallback((id: string) => shares.find((s) => s.id === id), [shares]);

  const addShare = useCallback(
    (s: ClientShare) => {
      setShares((p) => [s, ...p]);
      void persistShare(s);
    },
    [persistShare],
  );

  const removeShare = useCallback((id: string) => {
    setShares((p) => p.filter((s) => s.id !== id));
    const uid = userRef.current;
    if (uid) void supabase.from("location_shares").delete().eq("id", id).eq("user_id", uid);
  }, []);

  const recordSelection = useCallback(
    (shareId: string, locationId: string, comment: string) =>
      setShares((p) => {
        const next = p.map((s) =>
          s.id === shareId
            ? {
                ...s,
                selectedLocationId: locationId,
                selectedAt: new Date().toISOString(),
                clientComment: comment,
              }
            : s,
        );
        const changed = next.find((s) => s.id === shareId);
        if (changed) void persistShare(changed);
        return next;
      }),
    [persistShare],
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
