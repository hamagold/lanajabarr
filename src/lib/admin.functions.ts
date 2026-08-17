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
      supabaseAdmin.from("user_status").select("is_active").eq("user_id", userId).maybeSingle(),
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

    return {
      isActive: Boolean(status?.is_active) || Boolean(role),
      isAdmin: Boolean(role),
    };
  });

export const adminListUsersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context.userId);

    const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error("Could not load users");

    const [{ data: statuses }, { data: roles }] = await Promise.all([
      admin.from("user_status").select("user_id, is_active"),
      admin.from("user_roles").select("user_id, role"),
    ]);

    const activeMap = new Map((statuses ?? []).map((s) => [s.user_id, s.is_active]));
    const adminSet = new Set(
      (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
    );

    return list.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      isActive: adminSet.has(u.id) ? true : Boolean(activeMap.get(u.id)),
      isAdmin: adminSet.has(u.id),
    }));
  });

const setActiveSchema = z.object({ userId: z.string().uuid(), isActive: z.boolean() });

export const adminSetUserActiveFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setActiveSchema.parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId);
    const { error } = await admin
      .from("user_status")
      .upsert(
        { user_id: data.userId, is_active: data.isActive, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) throw new Error("Could not update account");
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
