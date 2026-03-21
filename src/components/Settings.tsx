"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { updateSettings } from "@/lib/api";

export default function Settings() {
  const t = useTranslations();
  const { user, refreshUser } = useAuth();
  const [apiKey, setApiKey] = useState(user?.openaiApiKey || "");
  const [locale, setLocale] = useState(user?.locale || "en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateSettings({
        openaiApiKey: apiKey,
        locale,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (locale !== user?.locale) {
        window.location.reload();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings. Please try logging in again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-800 mb-6">
        {t("settings.title")}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("settings.apiKeyLabel")}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t("settings.apiKeyPlaceholder")}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-sm text-gray-400 mt-1">
            {t("settings.apiKeyHelp")}
          </p>
          <Link
            href="/guide"
            className="inline-block text-sm text-emerald-600 hover:text-emerald-800 mt-2 underline"
          >
            {t("settings.apiKeyGuideLink")}
          </Link>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("settings.languageLabel")}
          </label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="en">English</option>
            <option value="es">Espa&ntilde;ol</option>
            <option value="zh">&#20013;&#25991;</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {saving ? t("common.loading") : t("common.save")}
        </button>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
            {t("settings.saved")}
          </div>
        )}
      </div>
    </div>
  );
}
