"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { TrainingSession, TrainingProgram, TrainingLogEntry } from "@/lib/types";
import {
  getUserSessions,
  createUserSession,
  getOrgSessions as fetchOrgSessions,
  createOrgSession,
  updateSessionApi,
  deleteSessionApi,
  getSessionLog,
} from "@/lib/api";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  orgId?: string;
  programs: TrainingProgram[];
}

export default function SessionManager({ orgId, programs }: Props) {
  const t = useTranslations();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("18:00");
  const [programId, setProgramId] = useState<string | null>(null);

  // Session history
  const [historySessionId, setHistorySessionId] = useState<string | null>(null);
  const [historyLog, setHistoryLog] = useState<TrainingLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = orgId
        ? await fetchOrgSessions(orgId)
        : await getUserSessions();
      setSessions(res.sessions);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const resetForm = () => {
    setName("");
    setDayOfWeek(1);
    setStartTime("18:00");
    setProgramId(null);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await updateSessionApi(editingId, {
          name: name.trim(),
          dayOfWeek,
          startTime,
          programId,
        });
      } else if (orgId) {
        await createOrgSession(orgId, {
          name: name.trim(),
          dayOfWeek,
          startTime,
          programId,
        });
      } else {
        await createUserSession({
          name: name.trim(),
          dayOfWeek,
          startTime,
          programId,
        });
      }
      resetForm();
      loadSessions();
    } catch {
      // ignore
    }
  };

  const handleEdit = (session: TrainingSession) => {
    setEditingId(session.id);
    setName(session.name);
    setDayOfWeek(session.dayOfWeek);
    setStartTime(session.startTime);
    setProgramId(session.programId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSessionApi(id);
      loadSessions();
    } catch {
      // ignore
    }
  };

  const handleViewHistory = async (sessionId: string) => {
    if (historySessionId === sessionId) {
      setHistorySessionId(null);
      return;
    }
    setHistorySessionId(sessionId);
    setHistoryLoading(true);
    try {
      const res = await getSessionLog(sessionId);
      setHistoryLog(res.log);
    } catch {
      setHistoryLog([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Group sessions by day
  const sessionsByDay = new Map<number, TrainingSession[]>();
  sessions.forEach((s) => {
    const list = sessionsByDay.get(s.dayOfWeek) || [];
    list.push(s);
    sessionsByDay.set(s.dayOfWeek, list);
  });

  if (loading) return <p className="text-gray-500 text-sm">{t("common.loading")}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">{t("sessions.title")}</h3>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
        >
          + {t("sessions.addSession")}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("sessions.sessionName")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("sessions.namePlaceholder")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("sessions.dayOfWeek")}</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {DAY_NAMES.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("sessions.startTime")}</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("sessions.assignProgram")}</label>
              <select
                value={programId || ""}
                onChange={(e) => setProgramId(e.target.value || null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{t("sessions.noProgram")}</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {editingId ? t("common.save") : t("sessions.addSession")}
            </button>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-1.5"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Weekly schedule */}
      {sessions.length === 0 ? (
        <p className="text-gray-500 text-sm">{t("sessions.empty")}</p>
      ) : (
        <div className="space-y-3">
          {DAY_NAMES.map((dayName, dayIdx) => {
            const daySessions = sessionsByDay.get(dayIdx);
            if (!daySessions || daySessions.length === 0) return null;
            return (
              <div key={dayIdx}>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">{dayName}</h4>
                <div className="space-y-2">
                  {daySessions.map((session) => (
                    <div key={session.id}>
                      <div className="bg-gray-50 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{session.name}</span>
                            <span className="text-xs text-gray-400">{session.startTime}</span>
                          </div>
                          {session.programTitle && (
                            <p className="text-sm text-emerald-600 mt-0.5">
                              {session.programTitle}
                            </p>
                          )}
                          {!session.programId && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{t("sessions.noProgramAssigned")}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleViewHistory(session.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            {historySessionId === session.id ? t("sessions.hideHistory") : t("sessions.viewHistory")}
                          </button>
                          <button
                            onClick={() => handleEdit(session)}
                            className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                          >
                            {t("common.edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            {t("common.delete")}
                          </button>
                        </div>
                      </div>

                      {/* Session history */}
                      {historySessionId === session.id && (
                        <div className="ml-4 mt-2 mb-2">
                          {historyLoading ? (
                            <p className="text-xs text-gray-400">{t("common.loading")}</p>
                          ) : historyLog.length === 0 ? (
                            <p className="text-xs text-gray-400">{t("sessions.noHistory")}</p>
                          ) : (
                            <div className="space-y-1">
                              {historyLog.map((entry) => (
                                <div key={entry.id} className="bg-white border border-gray-100 rounded p-2 text-xs">
                                  <div className="flex justify-between gap-2">
                                    <span className="font-medium text-gray-700">{entry.programTitle}</span>
                                    <span className="text-gray-400">{new Date(entry.date).toLocaleDateString()}</span>
                                  </div>
                                  <span className="text-gray-500">
                                    {entry.theme} &middot; Level {entry.levelUsed}
                                  </span>
                                  {entry.notes && (
                                    <p className="text-gray-500 mt-0.5">{entry.notes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
