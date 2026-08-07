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

type Ctx = {
  bookings: Booking[];
  ready: boolean;
  getBooking: (id: string) => Booking | undefined;
  addBooking: (b: Booking) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
};

const BookingContext = createContext<Ctx | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      setBookings(raw ? (JSON.parse(raw) as Booking[]) : seedBookings());
    } catch {
      setBookings(seedBookings());
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

  const value = useMemo(
    () => ({ bookings, ready, getBooking, addBooking, updateBooking, removeBooking }),
    [bookings, ready, getBooking, addBooking, updateBooking, removeBooking],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookings must be used inside BookingProvider");
  return ctx;
}