import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/use-session";
import {
  adminDeleteUserFn,
  adminListUsersFn,
  adminSetUserActiveFn,
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
  const deleteUser = useServerFn(adminDeleteUserFn);

  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: () => listUsers({}) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });
  const activeMutation = useMutation({
    mutationFn: (v: { userId: string; isActive: boolean; months?: number }) =>
      setActive({ data: v }),
    onSuccess: invalidate,
  });
  const roleMutation = useMutation({
    mutationFn: (v: { userId: string; isAdmin: boolean }) => setRole({ data: v }),
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
        <p className="text-sm text-muted-foreground">
          This account is not an administrator.
        </p>
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
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-16 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[27px] leading-tight">Admin panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} accounts · {activeCount} active
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-border px-4 py-2 text-xs"
        >
          Sign out
        </button>
      </header>

      <ul className="mt-6 space-y-3">
        {users.map((u) => (
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
                {u.expiresAt ? (
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
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                  u.isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {u.isActive ? "Active" : u.expired ? "Expired" : "Pending"}
              </span>
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
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  activeMutation.mutate({ userId: u.id, isActive: !u.isActive })
                }
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
      </ul>
    </div>
  );
}
