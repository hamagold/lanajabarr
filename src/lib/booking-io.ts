import {
  PAYMENT_STATUSES,
  STAGES,
  newChecklist,
  type Booking,
  type PaymentStatus,
  type Stage,
} from "./bookings";

export const EXPORT_VERSION = 1;

export type ExportFile = {
  app: "shootflow";
  version: number;
  exportedAt: string;
  bookings: Booking[];
};

export function buildExport(bookings: Booking[]): ExportFile {
  return {
    app: "shootflow",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    bookings,
  };
}

export function downloadExport(bookings: Booking[]) {
  const blob = new Blob([JSON.stringify(buildExport(bookings), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shootflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function str(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

/** Accepts a Shootflow export file or a bare array of bookings. */
export function parseImport(raw: string): Booking[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as ExportFile).bookings)
      ? (data as ExportFile).bookings
      : null;

  if (!list) throw new Error("No bookings found in this file.");

  const bookings = list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, i): Booking => {
      const stage = str(item['stage']) as Stage;
      const payment = str(item['paymentStatus']) as PaymentStatus;
      const checklist = Array.isArray(item['checklist'])
        ? (item['checklist'] as Record<string, unknown>[])
            .filter((c) => c && typeof c === "object")
            .map((c, ci) => ({
              id: str(c['id'], `c${ci}-${Math.random().toString(36).slice(2, 7)}`),
              label: str(c['label'], "Untitled"),
              done: c['done'] === true,
            }))
        : newChecklist();
      const images = Array.isArray(item['images'])
        ? (item['images'] as unknown[]).filter((img): img is string => typeof img === "string")
        : [];

      return {
        id: str(item['id'], `imp${Date.now()}-${i}`),
        clientName: str(item['clientName'], "Unnamed client"),
        phone: str(item['phone']),
        email: str(item['email']),
        shootType: str(item['shootType'], "Other"),
        date: str(item['date']),
        time: str(item['time'], "10:00"),
        location: str(item['location']),
        price: Number(item['price']) || 0,
        paymentStatus: PAYMENT_STATUSES.includes(payment) ? payment : "Unpaid",
        deliveryDeadline: str(item['deliveryDeadline']),
        notes: str(item['notes']),
        checklist,
        stage: STAGES.includes(stage) ? stage : "upcoming",
        images,
      };
    });

  if (bookings.length === 0) throw new Error("No bookings found in this file.");
  return bookings;
}