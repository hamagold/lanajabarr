import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Booking, seedBookings } from "./bookings";

const KEY = "shootflow.bookings.v1";

function normalize(list: Booking[]): Booking[] {
  return (Array.isArray(list) ? list : []).map((b) => ({
    ...b,
    images: Array.isArray(b?.images) ? b.images : [],
    checklist: Array.isArray(b?.checklist) ? b.checklist : [],
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      setBookings(normalize(raw ? (JSON.parse(raw) as Booking[]) : seedBookings()));
    } catch {
      setBookings(normalize(seedBookings()));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(bookings));
    } catch {
      /* ignore quota errors */
    }
  }, [bookings, ready]);

  const getBooking = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings],
  );
  const addBooking = useCallback((b: Booking) => setBookings((p) => [b, ...p]), []);
  const updateBooking = useCallback(
    (id: string, patch: Partial<Booking>) =>
      setBookings((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    [],
  );
  const removeBooking = useCallback(
    (id: string) => setBookings((p) => p.filter((b) => b.id !== id)),
    [],
  );

  const importBookings = useCallback(
    (incoming: Booking[], mode: "merge" | "replace") => {
      if (mode === "replace") {
        setBookings(normalize(incoming));
        return incoming.length;
      }
      let added = 0;
      setBookings((prev) => {
        const byId = new Map(prev.map((b) => [b.id, b]));
        for (const b of normalize(incoming)) {
          if (!byId.has(b.id)) added += 1;
          byId.set(b.id, b);
        }
        return Array.from(byId.values());
      });
      return incoming.length;
    },
    [],
  );

  const value = useMemo(
    () => ({
      bookings,
      ready,
      getBooking,
      addBooking,
      updateBooking,
      removeBooking,
      importBookings,
    }),
    [bookings, ready, getBooking, addBooking, updateBooking, removeBooking, importBookings],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookings must be used inside BookingProvider");
  return ctx;
}