"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { updateSettings, updatePassword } from "@/lib/api";

export default function Settings() {
  const t = useTranslations();
  const { user, refreshUser, publicCreditsRemaining } = useAuth();
  const [apiKey, setApiKey] = useState(user?.openaiApiKey || "");
  const [locale, setLocale] = useState(user?.locale || "en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const handlePasswordChange = async () => {
    setPwError("");
    setPwSaved(false);
    if (!newPassword || newPassword.length < 4) {
      setPwError("New password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      await updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      });
      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPwSaving(false);
    }
  };

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-6">
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
          {/* Show public credits status */}
          {user?.openaiApiKey ? (
            <p className="text-sm text-emerald-600 mt-1">
              {t("create.ownKeyActive")}
            </p>
          ) : publicCreditsRemaining !== null ? (
            <p className={`text-sm mt-1 ${publicCreditsRemaining > 0 ? "text-blue-600" : "text-amber-600"}`}>
              {publicCreditsRemaining > 0
                ? t("create.publicCreditsInfo", { count: publicCreditsRemaining })
                : t("create.noCreditsLeft")}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">
              {t("settings.publicCreditsNote")}
            </p>
          )}
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

      {/* Password Change */}
      {!user?.isGuest && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4 mt-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("settings.changePassword")}
          </h2>

          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {pwError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("settings.currentPassword")}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("settings.currentPasswordPlaceholder")}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("settings.newPassword")}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("settings.newPasswordPlaceholder")}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("settings.confirmPassword")}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("settings.confirmPasswordPlaceholder")}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={pwSaving || !newPassword}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {pwSaving ? t("common.loading") : t("settings.updatePassword")}
          </button>

          {pwSaved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
              {t("settings.passwordUpdated")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
