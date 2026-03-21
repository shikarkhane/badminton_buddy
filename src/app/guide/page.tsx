"use client";

import { useAuth } from "@/components/AuthProvider";
import LoginScreen from "@/components/LoginScreen";
import OpenAIGuide from "@/components/OpenAIGuide";

export default function GuidePage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LoginScreen />;
  return <OpenAIGuide />;
}
