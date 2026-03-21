"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrainingProgram } from "@/lib/types";
import { getProgram, logTrainingSession, getPrograms } from "@/lib/api";

export default function ProgramDetail({ programId }: { programId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(0);
  const [logging, setLogging] = useState(false);
  const [logLevel, setLogLevel] = useState(1);
  const [logNotes, setLogNotes] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { program } = await getProgram(programId);
        setProgram(program);
      } catch {
        router.push("/programs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [programId, router]);

  const handleUseToday = async () => {
    if (!program) return;
    setLogging(true);
    try {
      await logTrainingSession({
        programId: program.id,
        programTitle: program.title,
        theme: program.theme,
        levelUsed: logLevel,
        notes: logNotes,
        date: new Date().toISOString().split("T")[0],
      });
      router.push("/timeline");
    } catch {
      // ignore
    } finally {
      setLogging(false);
    }
  };

  if (loading) return <p className="p-8 text-gray-500">{t("common.loading")}</p>;
  if (!program) return null;

  const intensityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    extreme: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/programs")}
        className="text-emerald-600 hover:text-emerald-800 mb-4 inline-block"
      >
        &larr; {t("common.back")}
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{program.title}</h1>
            <div className="flex gap-3 mt-2 text-sm">
              <span className="text-gray-500">{t("programs.theme")}: {program.theme}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${intensityColors[program.intensity]}`}>
                {t(`intensity.${program.intensity}`)}
              </span>
              <span className="text-gray-500">{program.levels.length} {t("programs.levels")}</span>
            </div>
          </div>
        </div>

        {/* Use Today section */}
        <div className="bg-emerald-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-emerald-800 mb-3">{t("common.useToday")}</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("timeline.selectLevel")}</label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {program.levels.map((level) => (
                  <option key={level.level} value={level.level}>
                    Level {level.level}: {level.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-600 mb-1">{t("timeline.notes")}</label>
              <input
                type="text"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder={t("timeline.notesPlaceholder")}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <button
              onClick={handleUseToday}
              disabled={logging}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {logging ? t("common.loading") : t("common.useToday")}
            </button>
          </div>
        </div>

        {/* Levels */}
        <div className="space-y-4">
          {program.levels.map((level, idx) => (
            <div key={level.level} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedLevel(expandedLevel === idx ? null : idx)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition"
              >
                <span className="font-semibold text-gray-800">
                  Level {level.level}: {level.title}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedLevel === idx ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedLevel === idx && (
                <div className="p-4">
                  <p className="text-gray-600 mb-4">{level.description}</p>
                  <div className="space-y-3">
                    {level.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800">{ex.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{ex.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>Duration: {ex.duration}</span>
                          {ex.reps && <span>Reps: {ex.reps}</span>}
                        </div>
                        <p className="text-emerald-700 text-sm mt-2 italic">Tip: {ex.tips}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
