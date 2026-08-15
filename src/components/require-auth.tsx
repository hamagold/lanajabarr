import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/use-session";

/** Blocks rendering of protected content until a session is confirmed. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return null;
  return <>{children}</>;
}