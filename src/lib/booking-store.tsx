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
import { type Booking } from "./bookings";

function cacheKey(userId: string) {
  return `shootflow.bookings.${userId}`;
}

function normalize(list: Booking[]): Booking[] {
  return (Array.isArray(list) ? list : []).map((b) => ({
    ...b,
    images: Array.isArray(b?.images) ? b.images : [],
    checklist: Array.isArray(b?.checklist) ? b.checklist : [],
    expenses: Array.isArray(b?.expenses) ? b.expenses : [],
  }));
}

type Ctx = {
  bookings: Booking[];
  ready: boolean;
  getBooking: (id: string) => Booking | undefined;
  addBooking: (b: Booking) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  importBookings: (incoming: Booking[], mode: "merge" | "replace") => number;
};

const BookingContext = createContext<Ctx | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const userId = user?.id ?? null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ready, setReady] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const userRef = useRef<string | null>(null);
  userRef.current = loadedUserId === userId ? userId : null;

  // Load this account's bookings from the cloud (with a local cache for speed).
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setReady(false);
    setLoadedUserId(null);
    if (!userId) {
      setBookings([]);
      setReady(true);
      return;
    }

    try {
      const cached = window.localStorage.getItem(cacheKey(userId));
      if (cached) setBookings(normalize(JSON.parse(cached) as Booking[]));
      else setBookings([]);
    } catch {
      setBookings([]);
    }

    (async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, data")
        .eq("user_id", userId);
      if (cancelled || error) {
        if (error) console.error(error);
        setReady(true);
        return;
      }

      const rows = normalize((data ?? []).map((r) => r.data as unknown as Booking));

      if (cancelled) return;
      setBookings(rows);
      setLoadedUserId(userId);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  // Keep a per-account offline cache.
  useEffect(() => {
    if (!ready || !userId || loadedUserId !== userId) return;
    try {
      window.localStorage.setItem(cacheKey(userId), JSON.stringify(bookings));
    } catch {
      /* ignore quota errors */
    }
  }, [bookings, ready, userId, loadedUserId]);

  const persist = useCallback(async (rows: Booking[]) => {
    const uid = userRef.current;
    if (!uid || rows.length === 0) return;
    const { error } = await supabase
      .from("bookings")
      .upsert(rows.map((b) => ({ id: b.id, user_id: uid, data: b as never })));
    if (error) console.error(error);
  }, []);

  const getBooking = useCallback((id: string) => bookings.find((b) => b.id === id), [bookings]);

  const addBooking = useCallback(
    (b: Booking) => {
      setBookings((p) => [b, ...p]);
      void persist([b]);
    },
    [persist],
  );

  const updateBooking = useCallback(
    (id: string, patch: Partial<Booking>) =>
      setBookings((p) => {
        const next = p.map((b) => (b.id === id ? { ...b, ...patch } : b));
        const changed = next.find((b) => b.id === id);
        if (changed) void persist([changed]);
        return next;
      }),
    [persist],
  );

  const removeBooking = useCallback((id: string) => {
    setBookings((p) => p.filter((b) => b.id !== id));
    const uid = userRef.current;
    if (uid) {
      void supabase.from("bookings").delete().eq("id", id).eq("user_id", uid);
    }
  }, []);

  const importBookings = useCallback(
    (incoming: Booking[], mode: "merge" | "replace") => {
      const rows = normalize(incoming);
      if (mode === "replace") {
        setBookings(rows);
        const uid = userRef.current;
        if (uid) {
          void (async () => {
            await supabase.from("bookings").delete().eq("user_id", uid);
            await persist(rows);
          })();
        }
        return rows.length;
      }
      setBookings((prev) => {
        const byId = new Map(prev.map((b) => [b.id, b]));
        for (const b of rows) byId.set(b.id, b);
        return Array.from(byId.values());
      });
      void persist(rows);
      return rows.length;
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      bookings: loadedUserId === userId ? bookings : [],
      ready: ready && (!userId || loadedUserId === userId),
      getBooking,
      addBooking,
      updateBooking,
      removeBooking,
      importBookings,
    }),
    [bookings, ready, userId, loadedUserId, getBooking, addBooking, updateBooking, removeBooking, importBookings],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookings must be used inside BookingProvider");
  return ctx;
}
