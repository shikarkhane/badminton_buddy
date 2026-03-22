"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User } from "@/lib/types";
import { getMe, loginGuest, loginGoogle, logout as apiLogout } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  publicCreditsRemaining: number | null;
  loginAsGuest: () => Promise<void>;
  loginWithGoogle: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  publicCreditsRemaining: null,
  loginAsGuest: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicCreditsRemaining, setPublicCreditsRemaining] = useState<number | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user);
      setPublicCreditsRemaining(data.publicCreditsRemaining ?? null);
    } catch {
      setUser(null);
      setPublicCreditsRemaining(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginAsGuest = async () => {
    const data = await loginGuest();
    setUser(data.user);
  };

  const loginWithGoogleHandler = async (email: string, password: string, name: string) => {
    const data = await loginGoogle(email, password, name);
    setUser(data.user);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setPublicCreditsRemaining(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        publicCreditsRemaining,
        loginAsGuest,
        loginWithGoogle: loginWithGoogleHandler,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
