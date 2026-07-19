import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { getSessionToken, clearSessionToken } from "@/api/client";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getSessionToken();
    setIsAuthenticated(Boolean(token));
    setIsLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await clearSessionToken();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, refresh, signOut }),
    [isAuthenticated, isLoading, refresh, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
