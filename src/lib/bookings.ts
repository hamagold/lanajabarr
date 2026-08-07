export const STAGES = [
  "upcoming",
  "shot",
  "editing",
  "gallery_sent",
  "paid",
  "completed",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  upcoming: "Upcoming",
  shot: "Photoshoot Completed",
  editing: "Editing",
  gallery_sent: "Gallery Sent",
  paid: "Paid",
  completed: "Completed",
};

export const SHOOT_TYPES = [
  "Wedding",
  "Family",
  "Portrait",
  "Newborn",
  "Branding",
  "Event",
  "Couple",
  "Other",
] as const;

export const PAYMENT_STATUSES = ["Unpaid", "Deposit paid", "Paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type ChecklistItem = { id: string; label: string; done: boolean };

export type Booking = {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  shootType: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  location: string;
  price: number;
  paymentStatus: PaymentStatus;
  deliveryDeadline: string; // yyyy-mm-dd
  notes: string;
  checklist: ChecklistItem[];
  stage: Stage;
  images: string[]; // base64 data URLs
};

export const DEFAULT_CHECKLIST = [
  "Contract signed",
  "Booking fee paid",
  "Memory cards formatted",
  "Batteries charged",
  "Gear packed",
  "Gallery delivered",
];

export function newChecklist(): ChecklistItem[] {
  return DEFAULT_CHECKLIST.map((label, i) => ({
    id: `c${i}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    done: false,
  }));
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(iso: string) {
  if (!iso) return "No date";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function iso(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function seedBookings(): Booking[] {
  return [
    {
      id: "b1",
      clientName: "Jenny Andersson",
      phone: "070 123 45 67",
      email: "jenny@email.com",
      shootType: "Family",
      date: iso(3),
      time: "16:00",
      location: "Seaside, Kalmar",
      price: 350,
      paymentStatus: "Deposit paid",
      deliveryDeadline: iso(17),
      notes: "All together — kids, parents, grandparents. Golden hour preferred.",
      checklist: newChecklist(),
      stage: "upcoming",
    },
    {
      id: "b2",
      clientName: "Erik & Sofia",
      phone: "070 987 65 43",
      email: "sofia@email.com",
      shootType: "Couple",
      date: iso(-2),
      time: "18:00",
      location: "Old Town, Kalmar",
      price: 420,
      paymentStatus: "Deposit paid",
      deliveryDeadline: iso(12),
      notes: "Engagement announcement — wants 3 teasers early.",
      checklist: newChecklist(),
      stage: "editing",
    },
    {
      id: "b3",
      clientName: "Lina Johansson",
      phone: "070 456 78 90",
      email: "lina@email.com",
      shootType: "Branding",
      date: iso(-9),
      time: "10:00",
      location: "Studio, Kalmar",
      price: 780,
      paymentStatus: "Paid",
      deliveryDeadline: iso(-1),
      notes: "Delivered 60 images. Invoice settled.",
      checklist: newChecklist().map((c) => ({ ...c, done: true })),
      stage: "completed",
    },
  ];
}