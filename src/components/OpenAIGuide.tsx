"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function OpenAIGuide() {
  const t = useTranslations("guide");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/settings"
        className="text-emerald-600 hover:text-emerald-800 mb-4 inline-block"
      >
        &larr; Back to Settings
      </Link>

      <h1 className="text-3xl font-bold text-emerald-800 mb-2">
        {t("title")}
      </h1>
      <p className="text-gray-500 mb-8">{t("subtitle")}</p>

      {/* What is an API key */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          {t("whatTitle")}
        </h2>
        <p className="text-gray-600 leading-relaxed">{t("whatDesc")}</p>
      </section>

      {/* Why do you need it */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          {t("whyTitle")}
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">{t("whyDesc")}</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>{t("whyPoint1")}</li>
          <li>{t("whyPoint2")}</li>
          <li>{t("whyPoint3")}</li>
        </ul>
      </section>

      {/* Cost info */}
      <section className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-emerald-800 mb-3">
          {t("costTitle")}
        </h2>
        <p className="text-emerald-700 leading-relaxed mb-3">
          {t("costDesc")}
        </p>
        <p className="text-emerald-600 text-sm">{t("costNote")}</p>
      </section>

      {/* Step by step */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {t("stepsTitle")}
        </h2>
        <ol className="space-y-4">
          <li className="flex gap-3 sm:gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
              1
            </span>
            <div>
              <p className="font-medium text-gray-800">{t("step1Title")}</p>
              <p className="text-gray-600 text-sm mt-1">{t("step1Desc")}</p>
            </div>
          </li>
          <li className="flex gap-3 sm:gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
              2
            </span>
            <div>
              <p className="font-medium text-gray-800">{t("step2Title")}</p>
              <p className="text-gray-600 text-sm mt-1">{t("step2Desc")}</p>
            </div>
          </li>
          <li className="flex gap-3 sm:gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
              3
            </span>
            <div>
              <p className="font-medium text-gray-800">{t("step3Title")}</p>
              <p className="text-gray-600 text-sm mt-1">{t("step3Desc")}</p>
            </div>
          </li>
          <li className="flex gap-3 sm:gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
              4
            </span>
            <div>
              <p className="font-medium text-gray-800">{t("step4Title")}</p>
              <p className="text-gray-600 text-sm mt-1">{t("step4Desc")}</p>
            </div>
          </li>
          <li className="flex gap-3 sm:gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
              5
            </span>
            <div>
              <p className="font-medium text-gray-800">{t("step5Title")}</p>
              <p className="text-gray-600 text-sm mt-1">{t("step5Desc")}</p>
            </div>
          </li>
        </ol>
      </section>

      {/* Safety */}
      <section className="bg-amber-50 rounded-xl border border-amber-200 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-amber-800 mb-3">
          {t("safetyTitle")}
        </h2>
        <ul className="list-disc list-inside text-amber-700 space-y-1">
          <li>{t("safetyPoint1")}</li>
          <li>{t("safetyPoint2")}</li>
          <li>{t("safetyPoint3")}</li>
        </ul>
      </section>

      <div className="text-center">
        <Link
          href="/settings"
          className="inline-block bg-emerald-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-emerald-700 transition"
        >
          {t("goToSettings")}
        </Link>
      </div>
    </div>
  );
}
