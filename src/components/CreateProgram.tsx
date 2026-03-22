"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  generateProgram,
  parseCustomProgram,
  createProgram as saveProgram,
} from "@/lib/api";
import { TrainingLevel, TrainingExercise } from "@/lib/types";

const defaultExercise: TrainingExercise = {
  name: "",
  description: "",
  duration: "10 minutes",
  reps: "",
  tips: "",
};

const defaultLevel = (num: number): TrainingLevel => ({
  level: num,
  title: `Level ${num}`,
  description: "",
  exercises: [{ ...defaultExercise }],
});

export default function CreateProgram() {
  const t = useTranslations();
  const router = useRouter();
  const { user, publicCreditsRemaining, refreshUser } = useAuth();
  const [tab, setTab] = useState<"ai" | "text" | "custom">("text");

  // AI form state
  const [theme, setTheme] = useState("");
  const [intensity, setIntensity] = useState<string>("medium");
  const [levelCount, setLevelCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Text form state
  const [freeText, setFreeText] = useState("");
  const [converting, setConverting] = useState(false);

  // Custom form state
  const [customTitle, setCustomTitle] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [customIntensity, setCustomIntensity] = useState<string>("medium");
  const [customLevels, setCustomLevels] = useState<TrainingLevel[]>([
    defaultLevel(1),
    defaultLevel(2),
    defaultLevel(3),
  ]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const { program: generated } = await generateProgram({
        theme,
        intensity,
        levelCount,
      });
      await saveProgram({
        title: generated.title,
        theme,
        intensity: intensity as "low" | "medium" | "high" | "extreme",
        levels: generated.levels,
        isCustom: false,
        isAIGenerated: true,
      });
      refreshUser(); // update credits count
      router.push("/programs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCustom = async () => {
    setError("");
    try {
      await saveProgram({
        title: customTitle,
        theme: customTheme,
        intensity: customIntensity as "low" | "medium" | "high" | "extreme",
        levels: customLevels,
        isCustom: true,
        isAIGenerated: false,
      });
      router.push("/programs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleConvertText = async () => {
    setConverting(true);
    setError("");
    try {
      const { program: parsed } = await parseCustomProgram(freeText);
      await saveProgram({
        title: parsed.title,
        theme: parsed.theme,
        intensity: (parsed.intensity as "low" | "medium" | "high" | "extreme") || "medium",
        levels: parsed.levels,
        isCustom: true,
        isAIGenerated: false,
      });
      refreshUser(); // update credits count
      router.push("/programs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  const addLevel = () => {
    setCustomLevels([...customLevels, defaultLevel(customLevels.length + 1)]);
  };

  const removeLevel = (idx: number) => {
    if (customLevels.length <= 1) return;
    const updated = customLevels.filter((_, i) => i !== idx).map((l, i) => ({ ...l, level: i + 1 }));
    setCustomLevels(updated);
  };

  const updateLevel = (idx: number, field: string, value: string) => {
    const updated = [...customLevels];
    updated[idx] = { ...updated[idx], [field]: value };
    setCustomLevels(updated);
  };

  const addExercise = (levelIdx: number) => {
    const updated = [...customLevels];
    updated[levelIdx] = {
      ...updated[levelIdx],
      exercises: [...updated[levelIdx].exercises, { ...defaultExercise }],
    };
    setCustomLevels(updated);
  };

  const removeExercise = (levelIdx: number, exIdx: number) => {
    const updated = [...customLevels];
    if (updated[levelIdx].exercises.length <= 1) return;
    updated[levelIdx] = {
      ...updated[levelIdx],
      exercises: updated[levelIdx].exercises.filter((_, i) => i !== exIdx),
    };
    setCustomLevels(updated);
  };

  const updateExercise = (
    levelIdx: number,
    exIdx: number,
    field: string,
    value: string
  ) => {
    const updated = [...customLevels];
    updated[levelIdx] = {
      ...updated[levelIdx],
      exercises: updated[levelIdx].exercises.map((ex, i) =>
        i === exIdx ? { ...ex, [field]: value } : ex
      ),
    };
    setCustomLevels(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-800 mb-6">
        {t("create.title")}
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setTab("text")}
          className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
            tab === "text"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t("create.textTab")}
        </button>
        <button
          onClick={() => setTab("ai")}
          className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
            tab === "ai"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t("create.aiTab")}
        </button>
        <button
          onClick={() => setTab("custom")}
          className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
            tab === "custom"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t("create.customTab")}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Credits info for AI tabs */}
      {(tab === "ai" || tab === "text") && !user?.openaiApiKey && publicCreditsRemaining !== null && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
          publicCreditsRemaining > 0
            ? "bg-blue-50 border border-blue-200 text-blue-700"
            : "bg-amber-50 border border-amber-200 text-amber-700"
        }`}>
          {publicCreditsRemaining > 0
            ? t("create.publicCreditsInfo", { count: publicCreditsRemaining })
            : t("create.noCreditsLeft")}
        </div>
      )}

      {/* AI Tab */}
      {tab === "ai" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("create.themeLabel")}
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder={t("create.themePlaceholder")}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("create.intensityLabel")}
              </label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low">{t("intensity.low")}</option>
                <option value="medium">{t("intensity.medium")}</option>
                <option value="high">{t("intensity.high")}</option>
                <option value="extreme">{t("intensity.extreme")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("create.levelsLabel")}
              </label>
              <input
                type="number"
                min={3}
                max={10}
                value={levelCount}
                onChange={(e) => setLevelCount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-sm text-gray-400 mt-1">
                {t("create.levelsHelp")}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !theme}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {generating ? t("create.generating") : t("create.generateBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Text Tab */}
      {tab === "text" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("create.textLabel")}
              </label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder={t("create.textPlaceholder")}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[200px]"
                rows={8}
              />
              <p className="text-sm text-gray-400 mt-1">
                {t("create.textHelp")}
              </p>
            </div>

            <button
              onClick={handleConvertText}
              disabled={converting || freeText.trim().length < 10}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {converting ? t("create.converting") : t("create.convertBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Custom Tab */}
      {tab === "custom" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("create.programTitle")}
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("create.themeLabel")}
                </label>
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder={t("create.themePlaceholder")}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("create.intensityLabel")}
              </label>
              <select
                value={customIntensity}
                onChange={(e) => setCustomIntensity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low">{t("intensity.low")}</option>
                <option value="medium">{t("intensity.medium")}</option>
                <option value="high">{t("intensity.high")}</option>
                <option value="extreme">{t("intensity.extreme")}</option>
              </select>
            </div>

            {/* Levels */}
            {customLevels.map((level, levelIdx) => (
              <div
                key={levelIdx}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">
                    Level {level.level}
                  </h3>
                  <button
                    onClick={() => removeLevel(levelIdx)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    {t("create.removeLevel")}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <input
                    type="text"
                    placeholder={t("create.levelTitle")}
                    value={level.title}
                    onChange={(e) =>
                      updateLevel(levelIdx, "title", e.target.value)
                    }
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder={t("create.levelDescription")}
                    value={level.description}
                    onChange={(e) =>
                      updateLevel(levelIdx, "description", e.target.value)
                    }
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                {/* Exercises */}
                {level.exercises.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="bg-gray-50 rounded p-3 mb-2 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Exercise {exIdx + 1}
                      </span>
                      <button
                        onClick={() => removeExercise(levelIdx, exIdx)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        {t("create.removeExercise")}
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input
                        placeholder={t("create.exerciseName")}
                        value={ex.name}
                        onChange={(e) =>
                          updateExercise(
                            levelIdx,
                            exIdx,
                            "name",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                      <input
                        placeholder={t("create.exerciseDuration")}
                        value={ex.duration}
                        onChange={(e) =>
                          updateExercise(
                            levelIdx,
                            exIdx,
                            "duration",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <textarea
                      placeholder={t("create.exerciseDesc")}
                      value={ex.description}
                      onChange={(e) =>
                        updateExercise(
                          levelIdx,
                          exIdx,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      rows={2}
                    />
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input
                        placeholder={t("create.exerciseReps")}
                        value={ex.reps || ""}
                        onChange={(e) =>
                          updateExercise(
                            levelIdx,
                            exIdx,
                            "reps",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                      <input
                        placeholder={t("create.exerciseTips")}
                        value={ex.tips}
                        onChange={(e) =>
                          updateExercise(
                            levelIdx,
                            exIdx,
                            "tips",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addExercise(levelIdx)}
                  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium mt-2"
                >
                  + {t("create.addExercise")}
                </button>
              </div>
            ))}

            <button
              onClick={addLevel}
              className="text-emerald-600 hover:text-emerald-800 font-medium"
            >
              + {t("create.addLevel")}
            </button>

            <button
              onClick={handleSaveCustom}
              disabled={!customTitle || !customTheme}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {t("create.saveProgram")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
