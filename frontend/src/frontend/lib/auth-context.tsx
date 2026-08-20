import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getAccessToken,
  getRefreshToken,
  removeTokens,
  setAccessToken,
  setRefreshToken,
} from "./api-client";
import { get } from "./api-client";

/* ------------------------------------------------------------------ types */

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, refreshToken?: string, user?: AuthUser) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ hook */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/* ------------------------------------------------------------- provider */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setState({ user: null, token, loading: true });
    } else {
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const user = await get<AuthUser>("/auth/me", {
        skipAuth: false,
        retry: false,
      });
      setState((prev) => ({ ...prev, user, loading: false }));
    } catch {
      removeTokens();
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => {
    if (state.token) {
      fetchUser(state.token);
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.token, fetchUser]);

  useEffect(() => {
    const onChange = () => {
      const token = getAccessToken();
      if (token) {
        setState((prev) => ({ ...prev, token }));
        fetchUser(token);
      } else {
        setState({ user: null, token: null, loading: false });
      }
    };
    const onLogout = () => {
      setState({ user: null, token: null, loading: false });
    };
    window.addEventListener("auth-change", onChange);
    window.addEventListener("auth-logout", onLogout);
    return () => {
      window.removeEventListener("auth-change", onChange);
      window.removeEventListener("auth-logout", onLogout);
    };
  }, [fetchUser]);

  const setAuth = useCallback(
    (token: string, refreshToken?: string, user?: AuthUser) => {
      setAccessToken(token);
      if (refreshToken) setRefreshToken(refreshToken);
      setState((prev) => ({
        ...prev,
        token,
        user: user ?? prev.user,
        loading: false,
      }));
      if (user) {
        setState((prev) => ({ ...prev, user }));
      } else {
        fetchUser(token);
      }
    },
    [fetchUser],
  );

  const clearAuth = useCallback(() => {
    removeTokens();
    setState({ user: null, token: null, loading: false });
    window.dispatchEvent(new Event("auth-logout"));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, setAuth, clearAuth }}>{children}</AuthContext.Provider>
  );
}
