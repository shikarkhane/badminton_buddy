"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/programs");
    }
  }, [user, loading, router]);

  if (loading || user) return null;
  return <LandingPage />;
}
