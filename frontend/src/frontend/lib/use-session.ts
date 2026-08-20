import { useEffect, useState, useCallback } from "react";
import { getAccessToken } from "./api-client";
import { useAuth, type AuthUser } from "./auth-context";

/**
 * Session hook that reads auth state from the AuthProvider context.
 *
 * The returned `session` and `user` shapes are kept compatible with
 * previous types so existing callers don't break immediately.
 */

interface SessionLike {
  access_token: string;
  user: AuthUser | null;
}

export function useSession() {
  const { user, token, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) setLoading(false);
  }, [authLoading]);

  const session: SessionLike | null = token ? { access_token: token, user } : null;

  return { session, user, loading };
}

/**
 * Lightweight version that doesn't depend on AuthProvider — useful in
 * utility files or outside the React tree.  Reads localStorage directly.
 */
export function useSessionLite() {
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  useEffect(() => {
    const onChange = () => setToken(getAccessToken());
    window.addEventListener("auth-change", onChange);
    window.addEventListener("auth-logout", onChange);
    return () => {
      window.removeEventListener("auth-change", onChange);
      window.removeEventListener("auth-logout", onChange);
    };
  }, []);

  return { token, isLoggedIn: !!token };
}
