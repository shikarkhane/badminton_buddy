"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrainingProgram } from "@/lib/types";
import { getProgram, logTrainingSession } from "@/lib/api";

export default function ProgramDetail({ programId }: { programId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [loading, setLoading] = useState(true);
  // All levels shown expanded by default
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

        {/* Levels — all expanded */}
        <div className="space-y-6">
          {program.levels.map((level) => (
            <div key={level.level} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-lg">
                  Level {level.level}: {level.title}
                </h3>
                {level.description && (
                  <p className="text-gray-600 text-sm mt-1">{level.description}</p>
                )}
              </div>
              <ul className="divide-y divide-gray-100">
                {level.exercises.map((ex, exIdx) => (
                  <li key={exIdx} className="p-4 flex gap-4">
                    <span className="text-emerald-600 font-bold text-lg mt-0.5">{exIdx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800">{ex.name}</h4>
                      <p className="text-gray-600 text-sm mt-0.5">{ex.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span>Duration: {ex.duration}</span>
                        {ex.reps && <span>Reps: {ex.reps}</span>}
                      </div>
                      {ex.tips && (
                        <p className="text-emerald-700 text-sm mt-1.5 italic">Tip: {ex.tips}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
