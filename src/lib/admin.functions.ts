import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
  return supabaseAdmin;
}

/** Current account: is it activated, and is it an admin? */
export const getAccountStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const [{ data: status }, { data: role }] = await Promise.all([
      supabaseAdmin
        .from("user_status")
        .select("is_active, expires_at, is_banned, is_lifetime")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
    ]);

    if (!status) {
      await supabaseAdmin.from("user_status").insert({ user_id: userId, is_active: false });
    }

    const s = status as
      | { expires_at?: string | null; is_lifetime?: boolean; is_banned?: boolean }
      | null;
    const expiresAt = s?.is_lifetime ? null : (s?.expires_at ?? null);
    const expired = Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now());
    const banned = Boolean(s?.is_banned);

    return {
      isActive: !banned && (Boolean(role) || (Boolean(status?.is_active) && !expired)),
      isAdmin: Boolean(role),
      banned,
      lifetime: Boolean(s?.is_lifetime),
      expiresAt,
      expired,
    };
  });

export const adminListUsersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context.userId);

    const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error("Could not load users");

    const [{ data: statuses }, { data: roles }] = await Promise.all([
      admin
        .from("user_status")
        .select(
          "user_id, is_active, expires_at, is_banned, is_lifetime, is_paid, paid_amount, paid_note, paid_at",
        ),
      admin.from("user_roles").select("user_id, role"),
    ]);

    const statusMap = new Map(
      (statuses ?? []).map((s) => [
        s.user_id,
        s as {
          is_active: boolean;
          expires_at: string | null;
          is_banned: boolean;
          is_lifetime: boolean;
          is_paid: boolean;
          paid_amount: number | null;
          paid_note: string | null;
          paid_at: string | null;
        },
      ]),
    );
    const adminSet = new Set(
      (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
    );

    return list.users.map((u) => {
      const s = statusMap.get(u.id);
      const lifetime = Boolean(s?.is_lifetime);
      const banned = Boolean(s?.is_banned);
      const expiresAt = lifetime ? null : (s?.expires_at ?? null);
      const expired = Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now());
      const isAdmin = adminSet.has(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        isActive: banned ? false : isAdmin ? true : Boolean(s?.is_active) && !expired,
        isAdmin,
        banned,
        lifetime,
        isPaid: Boolean(s?.is_paid),
        paidAmount: s?.paid_amount ?? null,
        paidNote: s?.paid_note ?? null,
        paidAt: s?.paid_at ?? null,
        expiresAt,
        expired,
      };
    });
  });

const setActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
  /** Subscription length in months; 0 or omitted = no end date. */
  months: z.number().int().min(0).max(120).optional(),
  lifetime: z.boolean().optional(),
});

export const adminSetUserActiveFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setActiveSchema.parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId);
    let expiresAt: string | null = null;
    if (data.isActive && !data.lifetime && data.months && data.months > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + data.months);
      expiresAt = d.toISOString();
    }
    const { error } = await admin
      .from("user_status")
      .upsert(
        {
          user_id: data.userId,
          is_active: data.isActive,
          expires_at: expiresAt,
          is_lifetime: Boolean(data.lifetime && data.isActive),
          ...(data.isActive ? { is_banned: false } : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error("Could not update account");
    return { ok: true as const };
  });

const banSchema = z.object({ userId: z.string().uuid(), banned: z.boolean() });

export const adminSetUserBannedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => banSchema.parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("You cannot ban your own account");
    const { error } = await admin.from("user_status").upsert(
      {
        user_id: data.userId,
        is_banned: data.banned,
        ...(data.banned ? { is_active: false } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error("Could not update account");
    return { ok: true as const };
  });

const paymentSchema = z.object({
  userId: z.string().uuid(),
  isPaid: z.boolean(),
  amount: z.number().min(0).max(1000000).optional(),
  note: z.string().max(200).optional(),
});

export const adminSetUserPaymentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => paymentSchema.parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId);
    const { error } = await admin.from("user_status").upsert(
      {
        user_id: data.userId,
        is_paid: data.isPaid,
        paid_amount: data.isPaid ? (data.amount ?? null) : null,
        paid_note: data.isPaid ? (data.note ?? null) : null,
        paid_at: data.isPaid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error("Could not update payment");
    return { ok: true as const };
  });

const setAdminSchema = z.object({ userId: z.string().uuid(), isAdmin: z.boolean() });

export const adminSetUserRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setAdminSchema.parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId);
    if (data.userId === context.userId && !data.isAdmin) {
      throw new Error("You cannot remove your own admin access");
    }
    if (data.isAdmin) {
      await admin.from("user_roles").upsert(
        { user_id: data.userId, role: "admin" },
        { onConflict: "user_id,role" },
      );
    } else {
      await admin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    }
    return { ok: true as const };
  });

const deleteSchema = z.object({ userId: z.string().uuid() });

export const adminDeleteUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("Could not delete user");
    return { ok: true as const };
  });
