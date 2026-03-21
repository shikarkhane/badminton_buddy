"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { TrainingLogEntry, TrainingProgram } from "@/lib/types";
import {
  getTrainingLog,
  getPrograms,
  logTrainingSession,
  getSuggestion,
} from "@/lib/api";

export default function Timeline() {
  const t = useTranslations();
  const [log, setLog] = useState<TrainingLogEntry[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    suggestion: string | null;
    reasoning?: string;
  } | null>(null);

  // Form state
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sessionNotes, setSessionNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logRes, progRes, sugRes] = await Promise.all([
        getTrainingLog(),
        getPrograms(),
        getSuggestion(),
      ]);
      setLog(logRes.log);
      setPrograms(progRes.programs);
      setSuggestion(sugRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogSession = async () => {
    const program = programs.find((p) => p.id === selectedProgram);
    if (!program) return;

    await logTrainingSession({
      programId: program.id,
      programTitle: program.title,
      theme: program.theme,
      levelUsed: selectedLevel,
      notes: sessionNotes,
      date: sessionDate,
    });

    setShowForm(false);
    setSessionNotes("");
    loadData();
  };

  const selectedProg = programs.find((p) => p.id === selectedProgram);

  if (loading)
    return <p className="p-8 text-gray-500">{t("common.loading")}</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-800">
          {t("timeline.title")}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          + {t("timeline.logSession")}
        </button>
      </div>

      {/* AI Suggestion */}
      {suggestion?.suggestion && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-purple-800 mb-1">
            {t("timeline.suggestion")}
          </h3>
          <p className="text-purple-700 text-lg font-medium">
            {suggestion.suggestion}
          </p>
          {suggestion.reasoning && (
            <p className="text-purple-600 text-sm mt-1">
              {suggestion.reasoning}
            </p>
          )}
        </div>
      )}

      {!suggestion?.suggestion && log.length < 3 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-gray-500">{t("timeline.noSuggestion")}</p>
        </div>
      )}

      {/* Log Session Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            {t("timeline.logSession")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("timeline.selectProgram")}
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedLevel(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              >
                <option value="">-- Select --</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedProg && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("timeline.selectLevel")}
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                >
                  {selectedProg.levels.map((l) => (
                    <option key={l.level} value={l.level}>
                      Level {l.level}: {l.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("timeline.date")}
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("timeline.notes")}
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder={t("timeline.notesPlaceholder")}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLogSession}
                disabled={!selectedProgram}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 px-6 py-2"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {log.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t("timeline.empty")}</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-emerald-200"></div>
          <div className="space-y-6">
            {log.map((entry) => (
              <div key={entry.id} className="relative pl-14">
                <div className="absolute left-4 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow"></div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {entry.programTitle}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {entry.theme} &middot; Level {entry.levelUsed}
                      </p>
                      {entry.notes && (
                        <p className="text-gray-600 mt-2 text-sm">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
