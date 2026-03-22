"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User, Organization, ActingAs } from "@/lib/types";
import { getMe, loginGuest, loginGoogle, logout as apiLogout, getOrgs } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  publicCreditsRemaining: number | null;
  pendingInvitations: number;
  actingAs: ActingAs;
  userOrgs: Organization[];
  setActingAs: (context: ActingAs) => void;
  loginAsGuest: () => Promise<void>;
  loginWithGoogle: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  publicCreditsRemaining: null,
  pendingInvitations: 0,
  actingAs: { type: "personal" },
  userOrgs: [],
  setActingAs: () => {},
  loginAsGuest: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

function loadActingAs(): ActingAs {
  if (typeof window === "undefined") return { type: "personal" };
  try {
    const stored = localStorage.getItem("actingAs");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { type: "personal" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicCreditsRemaining, setPublicCreditsRemaining] = useState<number | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [actingAs, setActingAsState] = useState<ActingAs>({ type: "personal" });
  const [userOrgs, setUserOrgs] = useState<Organization[]>([]);

  const setActingAs = useCallback((context: ActingAs) => {
    setActingAsState(context);
    try {
      localStorage.setItem("actingAs", JSON.stringify(context));
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const [data, orgsData] = await Promise.all([getMe(), getOrgs().catch(() => ({ orgs: [] }))]);
      setUser(data.user);
      setPublicCreditsRemaining(data.publicCreditsRemaining ?? null);
      setPendingInvitations(data.pendingInvitations ?? 0);
      setUserOrgs(orgsData.orgs);

      // Validate actingAs - if org was removed, reset to personal
      const saved = loadActingAs();
      if (saved.type === "org") {
        const stillMember = orgsData.orgs.some((o: Organization) => o.id === saved.orgId);
        if (stillMember) {
          setActingAsState(saved);
        } else {
          setActingAsState({ type: "personal" });
          localStorage.removeItem("actingAs");
        }
      } else {
        setActingAsState(saved);
      }
    } catch {
      setUser(null);
      setPublicCreditsRemaining(null);
      setPendingInvitations(0);
      setUserOrgs([]);
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
    await refreshUser();
  };

  const loginWithGoogleHandler = async (email: string, password: string, name: string) => {
    const data = await loginGoogle(email, password, name);
    setUser(data.user);
    await refreshUser();
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setPublicCreditsRemaining(null);
    setPendingInvitations(0);
    setUserOrgs([]);
    setActingAsState({ type: "personal" });
    localStorage.removeItem("actingAs");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        publicCreditsRemaining,
        pendingInvitations,
        actingAs,
        userOrgs,
        setActingAs,
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
