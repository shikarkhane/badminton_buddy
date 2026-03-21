"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { updateSettings } from "@/lib/api";

export default function Settings() {
  const t = useTranslations();
  const { user, refreshUser } = useAuth();
  const [apiKey, setApiKey] = useState(user?.openaiApiKey || "");
  const [locale, setLocale] = useState(user?.locale || "en");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
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
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-800 mb-6">
        {t("settings.title")}
      </h1>

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
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition"
        >
          {t("common.save")}
        </button>

        {saved && (
          <p className="text-emerald-600 font-medium">{t("settings.saved")}</p>
        )}
      </div>
    </div>
  );
}
