"use client";

import { useAuth } from "@/components/AuthProvider";
import LoginScreen from "@/components/LoginScreen";
import CommunityPage from "@/components/CommunityPage";

export default function Community() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LoginScreen />;
  return <CommunityPage />;
}
