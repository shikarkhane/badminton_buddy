"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { TrainingProgram } from "@/lib/types";
import { getPrograms, getOrgPrograms, deleteProgramApi } from "@/lib/api";

export default function ProgramList() {
  const t = useTranslations();
  const { user, actingAs } = useAuth();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [sharedPrograms, setSharedPrograms] = useState<TrainingProgram[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      if (actingAs.type === "org") {
        const data = await getOrgPrograms(actingAs.orgId);
        setPrograms(data.programs);
        setSharedPrograms([]);
      } else {
        const data = await getPrograms(search || undefined);
        setPrograms(data.programs);
        setSharedPrograms(data.sharedPrograms || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, actingAs]);

  useEffect(() => {
    const timer = setTimeout(loadPrograms, 300);
    return () => clearTimeout(timer);
  }, [loadPrograms]);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this program?")) {
      await deleteProgramApi(id);
      loadPrograms();
    }
  };

  const intensityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    extreme: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {actingAs.type === "org" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 text-sm text-blue-700">
          {t("actAs.actingAsOrg", { orgName: actingAs.orgName })}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-800">
          {actingAs.type === "org" ? actingAs.orgName : t("programs.title")}
        </h1>
        <Link
          href="/create"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("programs.createNew")}
        </Link>
      </div>

      {user?.isGuest && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
          {t("programs.guestWarning")}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder={t("programs.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">{t("common.loading")}</p>
      ) : programs.length === 0 && sharedPrograms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{t("programs.empty")}</p>
          <Link
            href="/create"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition"
          >
            {t("nav.create")}
          </Link>
        </div>
      ) : (
        <>
          {programs.length > 0 && (
            <div className="grid gap-4">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                          {program.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            program.isAIGenerated
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {program.isAIGenerated
                            ? t("programs.aiGenerated")
                            : t("programs.custom")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-gray-500">
                        <span>
                          {t("programs.theme")}: {program.theme}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            intensityColors[program.intensity]
                          }`}
                        >
                          {t(`intensity.${program.intensity}`)}
                        </span>
                        <span>
                          {program.levels.length} {t("programs.levels")}
                        </span>
                        <span>
                          {new Date(program.createdAt).toLocaleDateString()}
                        </span>
                        {program.authorName && (
                          <span>{t("common.createdBy", { name: program.authorName })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 sm:gap-2 sm:ml-4 sm:flex-shrink-0">
                      <Link
                        href={`/programs/${program.id}`}
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                      >
                        {t("common.viewDetails")}
                      </Link>
                      <button
                        onClick={() => handleDelete(program.id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sharedPrograms.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                {t("programs.sharedWithMe")}
              </h2>
              <div className="grid gap-4">
                {sharedPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                            {program.title}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {t("programs.shared")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-gray-500">
                          <span>
                            {t("programs.theme")}: {program.theme}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              intensityColors[program.intensity]
                            }`}
                          >
                            {t(`intensity.${program.intensity}`)}
                          </span>
                          <span>
                            {program.levels.length} {t("programs.levels")}
                          </span>
                          {program.authorName && (
                            <span>
                              {t("programs.sharedBy", { name: program.authorName })}
                            </span>
                          )}
                          {program.orgName && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {program.orgName}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/programs/${program.id}`}
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-medium sm:ml-4 sm:flex-shrink-0"
                      >
                        {t("common.viewDetails")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
