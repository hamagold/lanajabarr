import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Ban, Infinity, Loader2, Search, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/use-session";
import {
  adminDeleteUserFn,
  adminListUsersFn,
  adminSetUserActiveFn,
  adminSetUserBannedFn,
  adminSetUserPaymentFn,
  adminSetUserRoleFn,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Shootflow" },
      { name: "description", content: "Manage Shootflow accounts: activate, promote or remove users." },
      { property: "og:title", content: "Admin panel — Shootflow" },
      { property: "og:description", content: "Manage Shootflow accounts: activate, promote or remove users." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const credentials = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

const PLANS = [
  { label: "1 month", months: 1 },
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "1 year", months: 12 },
] as const;

type Filter =
  | "all"
  | "pending"
  | "active"
  | "lifetime"
  | "monthly"
  | "yearly"
  | "expired"
  | "banned"
  | "unpaid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Requested" },
  { key: "active", label: "Active" },
  { key: "lifetime", label: "Lifetime" },
  { key: "monthly", label: "Monthly plan" },
  { key: "yearly", label: "Yearly plan" },
  { key: "expired", label: "Expired" },
  { key: "banned", label: "Banned" },
  { key: "unpaid", label: "Unpaid" },
];

type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  isActive: boolean;
  isAdmin: boolean;
  banned: boolean;
  lifetime: boolean;
  planMonths: number | null;
  isPaid: boolean;
  paidAmount: number | null;
  paidNote: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  expired: boolean;
};

function planLabel(u: AdminUser): string | null {
  if (u.lifetime) return "Lifetime";
  if (u.planMonths === 12) return "Yearly";
  if (u.planMonths === 6) return "6 months";
  if (u.planMonths === 3) return "3 months";
  if (u.planMonths === 1) return "Monthly";
  if (u.isActive && u.planMonths === 0) return "No end date";
  return null;
}

function matchesFilter(u: AdminUser, filter: Filter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "pending":
      return !u.isActive && !u.banned && !u.expired && !u.isAdmin;
    case "active":
      return u.isActive;
    case "lifetime":
      return u.lifetime && u.isActive;
    case "monthly":
      return (
        !u.lifetime && u.isActive && u.planMonths != null && u.planMonths > 0 && u.planMonths < 12
      );
    case "yearly":
      return !u.lifetime && u.isActive && u.planMonths === 12;
    case "expired":
      return u.expired;
    case "banned":
      return u.banned;
    case "unpaid":
      return !u.isPaid && !u.isAdmin;
  }
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-medium ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${tone}`}>{children}</span>
  );
}

function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function AdminPage() {
  const { user, loading } = useSession();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return user ? <AdminConsole /> : <AdminLogin />;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      setError("Enter a valid email and password.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (err) setError("Sign in failed. Check your details.");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-primary" strokeWidth={1.6} />
        <h1 className="mt-3 text-2xl">Admin panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with your admin account.</p>
      </div>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <Input
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-2xl"
        />
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-2xl"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>
      </form>
      {error ? <p className="mt-3 text-center text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function AdminConsole() {
  const qc = useQueryClient();
  const listUsers = useServerFn(adminListUsersFn);
  const setActive = useServerFn(adminSetUserActiveFn);
  const setRole = useServerFn(adminSetUserRoleFn);
  const setBanned = useServerFn(adminSetUserBannedFn);
  const setPayment = useServerFn(adminSetUserPaymentFn);
  const deleteUser = useServerFn(adminDeleteUserFn);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: () => listUsers({}) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });
  const activeMutation = useMutation({
    mutationFn: (v: { userId: string; isActive: boolean; months?: number; lifetime?: boolean }) =>
      setActive({ data: v }),
    onSuccess: invalidate,
  });
  const roleMutation = useMutation({
    mutationFn: (v: { userId: string; isAdmin: boolean }) => setRole({ data: v }),
    onSuccess: invalidate,
  });
  const banMutation = useMutation({
    mutationFn: (v: { userId: string; banned: boolean }) => setBanned({ data: v }),
    onSuccess: invalidate,
  });
  const payMutation = useMutation({
    mutationFn: (v: { userId: string; isPaid: boolean; amount?: number; note?: string }) =>
      setPayment({ data: v }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (v: { userId: string }) => deleteUser({ data: v }),
    onSuccess: invalidate,
  });

  if (usersQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (usersQuery.isError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl">No admin access</h1>
        <p className="text-sm text-muted-foreground">This account is not an administrator.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-border px-5 py-2.5 text-sm"
        >
          Sign out
        </button>
      </div>
    );
  }

  const users = usersQuery.data ?? [];
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    pending: users.filter((u) => !u.isActive && !u.banned && !u.expired).length,
    expired: users.filter((u) => u.expired).length,
    banned: users.filter((u) => u.banned).length,
    paid: users.filter((u) => u.isPaid).length,
    unpaid: users.filter((u) => !u.isPaid && !u.isAdmin).length,
    revenue: users.reduce((sum, u) => sum + (u.isPaid ? Number(u.paidAmount ?? 0) : 0), 0),
  };

  const q = search.trim().toLowerCase();
  const visible = users.filter((u) => {
    if (q && !u.email.toLowerCase().includes(q)) return false;
    if (filter === "active") return u.isActive;
    if (filter === "pending") return !u.isActive && !u.banned && !u.expired;
    if (filter === "expired") return u.expired;
    if (filter === "banned") return u.banned;
    if (filter === "unpaid") return !u.isPaid && !u.isAdmin;
    return true;
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-16 lg:max-w-5xl pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[27px] leading-tight">Admin panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.total} accounts · {stats.active} active
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-border px-4 py-2 text-xs"
        >
          Sign out
        </button>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Active" value={stats.active} tone="text-primary" />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Expired / banned" value={stats.expired + stats.banned} tone="text-destructive" />
        <Stat label="Paid" value={`${stats.paid} / ${stats.total}`} />
      </section>
      <div className="mt-2.5 rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-[11px] text-muted-foreground">Total collected</p>
        <p className="mt-0.5 text-xl font-medium">{stats.revenue.toLocaleString()}</p>
      </div>

      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email"
            className="h-11 rounded-2xl pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {visible.map((u) => (
          <li key={u.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.email || u.id}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Joined {new Date(u.createdAt).toLocaleDateString()}
                  {u.lastSignInAt
                    ? ` · Last sign in ${new Date(u.lastSignInAt).toLocaleDateString()}`
                    : ""}
                </p>
                {u.lifetime ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Lifetime access</p>
                ) : u.expiresAt ? (
                  <p
                    className={`mt-0.5 text-[11px] ${
                      u.expired ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {u.expired
                      ? `Subscription ended ${new Date(u.expiresAt).toLocaleDateString()}`
                      : `${daysLeft(u.expiresAt)} days left · until ${new Date(
                          u.expiresAt,
                        ).toLocaleDateString()}`}
                  </p>
                ) : u.isActive && !u.isAdmin ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">No end date</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Chip
                  tone={
                    u.banned
                      ? "bg-destructive/10 text-destructive"
                      : u.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }
                >
                  {u.banned ? "Banned" : u.isActive ? "Active" : u.expired ? "Expired" : "Pending"}
                </Chip>
                <Chip
                  tone={
                    u.isPaid
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  }
                >
                  {u.isPaid ? "Paid" : "Unpaid"}
                </Chip>
                {u.isAdmin ? <Chip tone="bg-secondary text-foreground">Admin</Chip> : null}
              </div>
            </div>

            {!u.isAdmin ? (
              <div className="mt-3">
                <p className="text-[11px] text-muted-foreground">Activate for</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {PLANS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() =>
                        activeMutation.mutate({
                          userId: u.id,
                          isActive: true,
                          months: p.months,
                        })
                      }
                      disabled={activeMutation.isPending}
                      className="rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-medium disabled:opacity-50"
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      activeMutation.mutate({ userId: u.id, isActive: true, lifetime: true })
                    }
                    disabled={activeMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary disabled:opacity-50"
                  >
                    <Infinity className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Lifetime
                  </button>
                </div>
              </div>
            ) : null}

            <PaymentRow
              user={u}
              busy={payMutation.isPending}
              onSave={(v) => payMutation.mutate({ userId: u.id, ...v })}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => activeMutation.mutate({ userId: u.id, isActive: !u.isActive })}
                disabled={u.isAdmin || activeMutation.isPending}
                className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {u.isActive ? "Deactivate" : "Activate (no limit)"}
              </button>
              <button
                onClick={() => roleMutation.mutate({ userId: u.id, isAdmin: !u.isAdmin })}
                disabled={roleMutation.isPending}
                className="rounded-full border border-border px-4 py-2 text-xs disabled:opacity-50"
              >
                {u.isAdmin ? "Remove admin" : "Make admin"}
              </button>
              <button
                onClick={() => banMutation.mutate({ userId: u.id, banned: !u.banned })}
                disabled={u.isAdmin || banMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" strokeWidth={1.8} />
                {u.banned ? "Unban" : "Ban"}
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
                    deleteMutation.mutate({ userId: u.id });
                  }
                }}
                disabled={deleteMutation.isPending}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-xs text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                Delete
              </button>
            </div>
          </li>
        ))}
        {visible.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No accounts match this view.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function PaymentRow({
  user,
  busy,
  onSave,
}: {
  user: { isPaid: boolean; paidAmount: number | null; paidNote: string | null; paidAt: string | null };
  busy: boolean;
  onSave: (v: { isPaid: boolean; amount?: number; note?: string }) => void;
}) {
  const [amount, setAmount] = useState(user.paidAmount != null ? String(user.paidAmount) : "");
  const [note, setNote] = useState(user.paidNote ?? "");

  return (
    <div className="mt-3 rounded-xl border border-border bg-secondary/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" strokeWidth={1.8} />
          Payment
          {user.isPaid && user.paidAt
            ? ` · ${new Date(user.paidAt).toLocaleDateString()}`
            : ""}
        </p>
        {user.isPaid ? (
          <button
            onClick={() => onSave({ isPaid: false })}
            disabled={busy}
            className="rounded-full border border-border px-3 py-1.5 text-[11px] disabled:opacity-50"
          >
            Mark unpaid
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Amount"
          className="h-9 w-28 rounded-xl text-xs"
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (method, ref…)"
          className="h-9 flex-1 rounded-xl text-xs"
        />
        <button
          onClick={() =>
            onSave({
              isPaid: true,
              ...(amount ? { amount: Number(amount) } : {}),
              ...(note ? { note } : {}),
            })
          }
          disabled={busy}
          className="rounded-full bg-primary px-4 py-2 text-[11px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {user.isPaid ? "Update" : "Mark paid"}
        </button>
      </div>
    </div>
  );
}
