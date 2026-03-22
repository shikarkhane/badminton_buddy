"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import SessionManager from "./SessionManager";
import { Organization, OrgMember, OrgInvitation, TrainingProgram } from "@/lib/types";
import {
  getOrgs,
  createOrg,
  deleteOrg,
  getOrgMembers,
  removeOrgMember,
  inviteToOrg,
  getOrgInvitations,
  cancelInvitation,
  getMyInvitations,
  respondToInvitation,
  getOrgPrograms,
} from "@/lib/api";

export default function OrgPage() {
  const t = useTranslations();
  const { user } = useAuth();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [sharedPrograms, setSharedPrograms] = useState<TrainingProgram[]>([]);
  const [myInvitations, setMyInvitations] = useState<OrgInvitation[]>([]);

  const [newOrgName, setNewOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "invitations" | "programs" | "sessions">("members");

  const loadOrgs = useCallback(async () => {
    try {
      const { orgs } = await getOrgs();
      setOrgs(orgs);
      if (orgs.length > 0 && !selectedOrg) {
        setSelectedOrg(orgs[0]);
      }
    } catch {
      // ignore
    }
  }, [selectedOrg]);

  const loadMyInvitations = useCallback(async () => {
    if (!user?.email) return;
    try {
      const { invitations } = await getMyInvitations();
      setMyInvitations(invitations);
    } catch {
      // ignore
    }
  }, [user?.email]);

  const loadOrgDetails = useCallback(async (orgId: string) => {
    try {
      const [membersRes, invitationsRes, programsRes] = await Promise.all([
        getOrgMembers(orgId),
        getOrgInvitations(orgId),
        getOrgPrograms(orgId),
      ]);
      setMembers(membersRes.members);
      setInvitations(invitationsRes.invitations);
      setSharedPrograms(programsRes.programs);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadOrgs();
    loadMyInvitations();
  }, [loadOrgs, loadMyInvitations]);

  useEffect(() => {
    if (selectedOrg) {
      loadOrgDetails(selectedOrg.id);
    }
  }, [selectedOrg, loadOrgDetails]);

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const { org } = await createOrg(newOrgName.trim());
      setOrgs([...orgs, org]);
      setSelectedOrg(org);
      setNewOrgName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return;
    if (!confirm(t("org.deleteOrgConfirm"))) return;
    try {
      await deleteOrg(selectedOrg.id);
      setSelectedOrg(null);
      setOrgs(orgs.filter((o) => o.id !== selectedOrg.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleInvite = async () => {
    if (!selectedOrg || !inviteEmail.trim()) return;
    setError("");
    setInviteSuccess("");
    try {
      await inviteToOrg(selectedOrg.id, inviteEmail.trim());
      setInviteSuccess(inviteEmail.trim());
      setInviteEmail("");
      setLinkCopied(false);
      loadOrgDetails(selectedOrg.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to invite");
    }
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/org`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrg) return;
    try {
      await removeOrgMember(selectedOrg.id, userId);
      loadOrgDetails(selectedOrg.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!selectedOrg) return;
    try {
      await cancelInvitation(selectedOrg.id, invitationId);
      loadOrgDetails(selectedOrg.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  };

  const handleRespondInvitation = async (id: string, action: "accept" | "decline") => {
    try {
      await respondToInvitation(id, action);
      loadMyInvitations();
      if (action === "accept") loadOrgs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to respond");
    }
  };

  const handleLeaveOrg = async () => {
    if (!selectedOrg || !user) return;
    try {
      await removeOrgMember(selectedOrg.id, user.id);
      setSelectedOrg(null);
      loadOrgs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to leave");
    }
  };

  const isOwner = selectedOrg?.ownerId === user?.id;

  if (user?.isGuest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-800 mb-6">{t("org.title")}</h1>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          {t("org.guestOrgWarning")}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-800 mb-6">{t("org.title")}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Pending invitations for current user */}
      {myInvitations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-3">{t("org.myInvitations")}</h2>
          {myInvitations.map((inv) => (
            <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-2">
              <span className="text-blue-700">
                {t("org.invitedToOrg")} <strong>{inv.orgName}</strong>
              </span>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleRespondInvitation(inv.id, "accept")}
                  className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700"
                >
                  {t("org.acceptInvite")}
                </button>
                <button
                  onClick={() => handleRespondInvitation(inv.id, "decline")}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
                >
                  {t("org.declineInvite")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create or select org */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        {orgs.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedOrg?.id === org.id
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder={t("org.orgNamePlaceholder")}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => e.key === "Enter" && handleCreateOrg()}
          />
          <button
            onClick={handleCreateOrg}
            disabled={creating || !newOrgName.trim()}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 sm:flex-shrink-0"
          >
            {t("org.createOrg")}
          </button>
        </div>
      </div>

      {/* Selected org details */}
      {selectedOrg && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{selectedOrg.name}</h2>
            {isOwner ? (
              <button
                onClick={handleDeleteOrg}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                {t("org.deleteOrg")}
              </button>
            ) : (
              <button
                onClick={handleLeaveOrg}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                {t("org.leaveOrg")}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 border-b border-gray-200 pb-2">
            {(["members", "sessions", "invitations", "programs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg font-medium transition text-sm ${
                  activeTab === tab
                    ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t(`org.${tab === "programs" ? "sharedPrograms" : tab === "sessions" ? "sessions" : tab}`)}
              </button>
            ))}
          </div>

          {/* Members tab */}
          {activeTab === "members" && (
            <div>
              {/* Invite form */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t("org.inviteEmailPlaceholder")}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 sm:flex-shrink-0"
                >
                  {t("org.sendInvite")}
                </button>
              </div>

              {inviteSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                  <p className="text-emerald-700 text-sm mb-2">
                    {t("org.inviteSentTo", { email: inviteSuccess })}
                  </p>
                  <p className="text-gray-500 text-xs mb-2">
                    {t("org.inviteLinkHint")}
                  </p>
                  <button
                    onClick={handleCopyInviteLink}
                    className="text-sm bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition"
                  >
                    {linkCopied ? t("org.linkCopied") : t("org.copyInviteLink")}
                  </button>
                </div>
              )}

              {members.length === 0 ? (
                <p className="text-gray-500 text-sm">{t("org.noMembers")}</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-3 bg-gray-50 rounded-lg gap-1 sm:gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-gray-800">
                          {member.userName}
                        </span>
                        {member.userEmail && (
                          <span className="text-gray-400 text-sm ml-2 break-all">
                            {member.userEmail}
                          </span>
                        )}
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            member.role === "owner"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {t(`org.${member.role}`)}
                        </span>
                      </div>
                      {isOwner && member.userId !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-400 hover:text-red-600 text-sm flex-shrink-0"
                        >
                          {t("org.removeMember")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invitations tab */}
          {activeTab === "invitations" && (
            <div>
              {invitations.length === 0 ? (
                <p className="text-gray-500 text-sm">{t("org.noInvitations")}</p>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="text-gray-800">{inv.email}</span>
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            inv.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : inv.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      {inv.status === "pending" && (
                        <button
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="text-red-400 hover:text-red-600 text-sm"
                        >
                          {t("org.cancelInvite")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sessions tab */}
          {activeTab === "sessions" && selectedOrg && (
            <SessionManager
              orgId={selectedOrg.id}
              programs={sharedPrograms}
            />
          )}

          {/* Shared programs tab */}
          {activeTab === "programs" && (
            <div>
              {sharedPrograms.length === 0 ? (
                <p className="text-gray-500 text-sm">{t("org.noSharedPrograms")}</p>
              ) : (
                <div className="space-y-3">
                  {sharedPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800">
                            {program.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1">
                            <span>{program.theme}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {t(`intensity.${program.intensity}`)}
                            </span>
                            <span>
                              {program.levels.length} {t("programs.levels")}
                            </span>
                            {program.authorName && (
                              <span className="text-xs text-gray-400">
                                {t("programs.sharedBy", { name: program.authorName })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/programs/${program.id}`}
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex-shrink-0"
                        >
                          {t("common.viewDetails")}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {orgs.length === 0 && !creating && (
        <p className="text-gray-500 text-center mt-4">{t("org.noOrg")}</p>
      )}
    </div>
  );
}
