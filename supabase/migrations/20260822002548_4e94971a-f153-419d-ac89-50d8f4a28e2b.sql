ALTER TABLE public.user_status ADD COLUMN IF NOT EXISTS plan_months integer;

-- Backfill best-effort plan lengths for existing subscriptions based on remaining duration
UPDATE public.user_status
SET plan_months = CASE
  WHEN is_lifetime THEN NULL
  WHEN expires_at IS NULL THEN 0
  WHEN expires_at <= now() + interval '45 days' THEN 1
  WHEN expires_at <= now() + interval '135 days' THEN 3
  WHEN expires_at <= now() + interval '225 days' THEN 6
  ELSE 12
END
WHERE plan_months IS NULL;