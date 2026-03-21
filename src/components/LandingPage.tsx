"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import ShuttleLabLogo from "./ShuttleLabLogo";

const features = [
  { key: "feature1", icon: "&#129302;" },
  { key: "feature2", icon: "&#128200;" },
  { key: "feature3", icon: "&#128161;" },
  { key: "feature4", icon: "&#9999;&#65039;" },
  { key: "feature5", icon: "&#127942;" },
  { key: "feature6", icon: "&#128202;" },
] as const;

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <ShuttleLabLogo className="h-20 w-20 text-white opacity-90" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t("heroTitle")}
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/create"
              className="bg-white text-emerald-700 font-semibold px-8 py-3 rounded-lg hover:bg-emerald-50 transition text-lg"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/programs"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition text-lg"
            >
              {t("feature1Title")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ key, icon }) => (
              <div
                key={key}
                className="bg-emerald-50 rounded-xl p-6 hover:shadow-lg transition"
              >
                <div
                  className="text-4xl mb-4"
                  dangerouslySetInnerHTML={{ __html: icon }}
                />
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                  {t(`${key}Title`)}
                </h3>
                <p className="text-gray-600">{t(`${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-emerald-200 mb-8">
            {t("ctaDesc")}
          </p>
          <Link
            href="/create"
            className="inline-block bg-white text-emerald-800 font-semibold px-8 py-3 rounded-lg hover:bg-emerald-50 transition text-lg"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
