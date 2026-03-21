"use client";

import { useAuth } from "@/components/AuthProvider";
import LoginScreen from "@/components/LoginScreen";
import OrgPage from "@/components/OrgPage";

export default function OrganizationPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LoginScreen />;
  return <OrgPage />;
}
