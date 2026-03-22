"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { TrainingProgram, TrainingLevel, Organization } from "@/lib/types";
import { getProgram, logTrainingSession, updateProgramApi, getOrgs } from "@/lib/api";

export default function ProgramDetail({ programId }: { programId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [logLevel, setLogLevel] = useState(1);
  const [logNotes, setLogNotes] = useState("");
  const [userOrgs, setUserOrgs] = useState<Organization[]>([]);
  const [editingLevels, setEditingLevels] = useState<TrainingLevel[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !user.isGuest) {
      getOrgs().then(({ orgs }) => setUserOrgs(orgs)).catch(() => {});
    }
  }, [user]);

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

  const isOwner = user && program?.userId === user.id;
  const isEditing = editingLevels !== null;

  const startEditing = () => {
    if (program) setEditingLevels(JSON.parse(JSON.stringify(program.levels)));
  };

  const cancelEditing = () => setEditingLevels(null);

  const updateExerciseField = (
    levelIdx: number,
    exIdx: number,
    field: string,
    value: string
  ) => {
    if (!editingLevels) return;
    const updated = [...editingLevels];
    updated[levelIdx] = {
      ...updated[levelIdx],
      exercises: updated[levelIdx].exercises.map((ex, i) =>
        i === exIdx ? { ...ex, [field]: value } : ex
      ),
    };
    setEditingLevels(updated);
  };

  const handleSaveEdits = async () => {
    if (!program || !editingLevels) return;
    setSaving(true);
    try {
      const { program: updated } = await updateProgramApi(program.id, { levels: editingLevels });
      setProgram(updated);
      setEditingLevels(null);
    } catch {
      // ignore
    } finally {
      setSaving(false);
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{program.title}</h1>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-sm">
            <span className="text-gray-500">{t("programs.theme")}: {program.theme}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${intensityColors[program.intensity]}`}>
              {t(`intensity.${program.intensity}`)}
            </span>
            <span className="text-gray-500">{program.levels.length} {t("programs.levels")}</span>
          </div>
        </div>

        {/* Share with org */}
        {user && program.userId === user.id && userOrgs.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{t("org.shareWithOrg")}:</span>
            {program.sharedWithOrg ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-700 font-medium">
                  {userOrgs.find((o) => o.id === program.sharedWithOrg)?.name || t("org.sharedBadge")}
                </span>
                <button
                  onClick={async () => {
                    const updated = await updateProgramApi(program.id, { sharedWithOrg: null });
                    setProgram(updated.program);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  {t("org.unshare")}
                </button>
              </div>
            ) : (
              <select
                defaultValue=""
                onChange={async (e) => {
                  if (!e.target.value) return;
                  const updated = await updateProgramApi(program.id, { sharedWithOrg: e.target.value });
                  setProgram(updated.program);
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="">--</option>
                {userOrgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Shared badge for non-owners */}
        {user && program.userId !== user.id && program.sharedWithOrg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-2 rounded-lg mb-4">
            {t("org.sharedBadge")}
          </div>
        )}

        {/* Use Today section */}
        <div className="bg-emerald-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-emerald-800 mb-3">{t("common.useToday")}</h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-sm text-gray-600 mb-1">{t("timeline.selectLevel")}</label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(Number(e.target.value))}
                className="w-full sm:w-auto border border-gray-300 rounded px-3 py-2"
              >
                {program.levels.map((level) => (
                  <option key={level.level} value={level.level}>
                    Level {level.level}: {level.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-0">
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
              className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {logging ? t("common.loading") : t("common.useToday")}
            </button>
          </div>
        </div>

        {/* Edit / Save controls */}
        {isOwner && (
          <div className="flex gap-3 mb-4">
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
              >
                {t("programs.editProgram")}
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveEdits}
                  disabled={saving}
                  className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? t("common.loading") : t("programs.saveChanges")}
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  {t("common.cancel")}
                </button>
              </>
            )}
          </div>
        )}

        {/* Levels — all expanded */}
        <div className="space-y-6">
          {(isEditing ? editingLevels! : program.levels).map((level, levelIdx) => (
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
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={ex.name}
                            onChange={(e) => updateExerciseField(levelIdx, exIdx, "name", e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-semibold"
                            placeholder="Exercise name"
                          />
                          <textarea
                            value={ex.description}
                            onChange={(e) => updateExerciseField(levelIdx, exIdx, "description", e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            rows={4}
                            placeholder="Setup: ... Instructions: ... Coaching Point: ..."
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={ex.duration}
                              onChange={(e) => updateExerciseField(levelIdx, exIdx, "duration", e.target.value)}
                              className="border border-gray-300 rounded px-3 py-1.5 text-xs"
                              placeholder="Duration"
                            />
                            <input
                              value={ex.reps || ""}
                              onChange={(e) => updateExerciseField(levelIdx, exIdx, "reps", e.target.value)}
                              className="border border-gray-300 rounded px-3 py-1.5 text-xs"
                              placeholder="Reps"
                            />
                          </div>
                          <input
                            value={ex.tips}
                            onChange={(e) => updateExerciseField(levelIdx, exIdx, "tips", e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm italic text-emerald-700"
                            placeholder="Coaching tip"
                          />
                        </div>
                      ) : (
                        <>
                          <h4 className="font-semibold text-gray-800">{ex.name}</h4>
                          <p className="text-gray-600 text-sm mt-0.5 whitespace-pre-wrap">{ex.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span>Duration: {ex.duration}</span>
                            {ex.reps && <span>Reps: {ex.reps}</span>}
                          </div>
                          {ex.tips && (
                            <p className="text-emerald-700 text-sm mt-1.5 italic">Tip: {ex.tips}</p>
                          )}
                        </>
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
