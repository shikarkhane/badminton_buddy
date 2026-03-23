"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import LoginScreen from "@/components/LoginScreen";
import SessionManager from "@/components/SessionManager";

export default function SessionsPage() {
  const t = useTranslations();
  const { user, loading, actingAs } = useAuth();

  if (loading) return null;
  if (!user) return <LoginScreen />;

  const orgId = actingAs.type === "org" ? actingAs.orgId : undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {actingAs.type === "org" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 text-sm text-blue-700">
          {t("actAs.actingAsOrg", { orgName: actingAs.orgName })}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6">
        {t("sessions.title")}
      </h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <SessionManager orgId={orgId} />
      </div>
    </div>
  );
}
