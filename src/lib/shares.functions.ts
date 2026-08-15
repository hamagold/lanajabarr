import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const idSchema = z.object({ shareId: z.string().min(1).max(128) });

export const getPublicShareFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("get_public_share", {
      p_id: data.shareId,
    });
    if (error) return null;
    const row = Array.isArray(rows) ? rows[0] : null;
    return row ?? null;
  });

const respondSchema = z.object({
  shareId: z.string().min(1).max(128),
  locationId: z.string().min(1).max(128),
  comment: z.string().max(2000).default(""),
});

export const respondToShareFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => respondSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("respond_to_share", {
      p_id: data.shareId,
      p_location_id: data.locationId,
      p_comment: data.comment,
    });
    if (error) return null;
    return result ?? null;
  });
