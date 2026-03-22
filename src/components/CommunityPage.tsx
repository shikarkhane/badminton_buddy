"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { Organization, CommunityThread, CommunityPost, ThreadCategory } from "@/lib/types";
import {
  getOrgs,
  getOrgThreads,
  createThread,
  getThreadPosts,
  createPostReply,
  deleteThread,
  moderateContent,
} from "@/lib/api";

const CATEGORIES: (ThreadCategory | "all")[] = ["all", "general", "feedback", "ideas"];

export default function CommunityPage() {
  const t = useTranslations();
  const { user } = useAuth();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [activeCategory, setActiveCategory] = useState<ThreadCategory | "all">("all");

  // Thread detail view
  const [viewingThread, setViewingThread] = useState<CommunityThread | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  // New thread form
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ThreadCategory>("general");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);

  // Reply form
  const [replyContent, setReplyContent] = useState("");
  const [posting, setPosting] = useState(false);

  const [error, setError] = useState("");
  const [moderating, setModerating] = useState(false);

  useEffect(() => {
    getOrgs().then(({ orgs }) => {
      setOrgs(orgs);
      if (orgs.length > 0) setSelectedOrg(orgs[0]);
    }).catch(() => {});
  }, []);

  const loadThreads = useCallback(async () => {
    if (!selectedOrg) return;
    try {
      const cat = activeCategory === "all" ? undefined : activeCategory;
      const { threads } = await getOrgThreads(selectedOrg.id, cat);
      setThreads(threads);
    } catch {
      // ignore
    }
  }, [selectedOrg, activeCategory]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const openThread = async (thread: CommunityThread) => {
    if (!selectedOrg) return;
    setViewingThread(thread);
    try {
      const { posts } = await getThreadPosts(selectedOrg.id, thread.id);
      setPosts(posts);
    } catch {
      // ignore
    }
  };

  const handleCreateThread = async () => {
    if (!selectedOrg || !newTitle.trim() || !newContent.trim()) return;
    setError("");
    setModerating(true);

    try {
      // Moderate title and content
      const titleCheck = await moderateContent(newTitle);
      if (!titleCheck.approved) {
        setError(t("community.moderationFailed") + (titleCheck.reason || ""));
        return;
      }
      const contentCheck = await moderateContent(newContent);
      if (!contentCheck.approved) {
        setError(t("community.moderationFailed") + (contentCheck.reason || ""));
        return;
      }
    } catch {
      // If moderation fails, proceed anyway
    } finally {
      setModerating(false);
    }

    setCreating(true);
    try {
      await createThread(selectedOrg.id, {
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim(),
      });
      setNewTitle("");
      setNewContent("");
      setShowNewThread(false);
      loadThreads();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
    } finally {
      setCreating(false);
    }
  };

  const handlePostReply = async () => {
    if (!selectedOrg || !viewingThread || !replyContent.trim()) return;
    setError("");
    setModerating(true);

    try {
      const check = await moderateContent(replyContent);
      if (!check.approved) {
        setError(t("community.moderationFailed") + (check.reason || ""));
        setModerating(false);
        return;
      }
    } catch {
      // If moderation fails, proceed
    } finally {
      setModerating(false);
    }

    setPosting(true);
    try {
      const { post } = await createPostReply(selectedOrg.id, viewingThread.id, replyContent.trim());
      setPosts([...posts, post]);
      setReplyContent("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedOrg || !viewingThread) return;
    if (!confirm(t("community.deleteThread") + "?")) return;
    try {
      await deleteThread(selectedOrg.id, viewingThread.id);
      setViewingThread(null);
      loadThreads();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (user?.isGuest || orgs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-800 mb-6">{t("community.title")}</h1>
        <p className="text-gray-500">{t("community.noOrg")}</p>
      </div>
    );
  }

  // Thread detail view
  if (viewingThread) {
    const isAuthor = viewingThread.authorId === user?.id;
    const isOrgOwner = selectedOrg?.ownerId === user?.id;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => { setViewingThread(null); setPosts([]); }}
          className="text-emerald-600 hover:text-emerald-800 mb-4 inline-block"
        >
          &larr; {t("community.backToThreads")}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={() => setError("")} className="ml-2 text-red-500 underline text-sm">{t("common.close")}</button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${categoryColor(viewingThread.category)}`}>
                {t(`community.${viewingThread.category}`)}
              </span>
              {viewingThread.pinned && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 mr-2">
                  {t("community.pinned")}
                </span>
              )}
            </div>
            {(isAuthor || isOrgOwner) && (
              <button onClick={handleDeleteThread} className="text-red-400 hover:text-red-600 text-sm">
                {t("community.deleteThread")}
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{viewingThread.title}</h1>
          <p className="text-sm text-gray-400">
            {t("community.by")} {viewingThread.authorName} &middot; {new Date(viewingThread.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Posts */}
        <div className="space-y-4 mb-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">{post.authorName}</span>
                <span className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>

        {/* Reply form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={t("community.replyPlaceholder")}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
            rows={3}
          />
          <button
            onClick={handlePostReply}
            disabled={posting || moderating || !replyContent.trim()}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {moderating ? t("community.moderating") : posting ? t("community.posting") : t("community.postReply")}
          </button>
        </div>
      </div>
    );
  }

  // Thread list view
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-800">{t("community.title")}</h1>
        <button
          onClick={() => setShowNewThread(!showNewThread)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
        >
          {showNewThread ? t("common.cancel") : t("community.newThread")}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-500 underline text-sm">{t("common.close")}</button>
        </div>
      )}

      {/* Org selector (if multiple orgs) */}
      {orgs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => { setSelectedOrg(org); setViewingThread(null); }}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                selectedOrg?.id === org.id
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>
      )}

      {/* New thread form */}
      {showNewThread && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("community.threadTitle")}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t("community.threadTitlePlaceholder")}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("community.category")}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ThreadCategory)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="general">{t("community.general")}</option>
                  <option value="feedback">{t("community.feedback")}</option>
                  <option value="ideas">{t("community.ideas")}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("community.firstPost")}
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={t("community.firstPostPlaceholder")}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={4}
              />
            </div>
            <button
              onClick={handleCreateThread}
              disabled={creating || moderating || !newTitle.trim() || !newContent.trim()}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {moderating ? t("community.moderating") : creating ? t("community.creating") : t("community.createThread")}
            </button>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeCategory === cat
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {t(`community.${cat === "all" ? "allThreads" : cat}`)}
          </button>
        ))}
      </div>

      {/* Thread list */}
      {threads.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t("community.noThreads")}</p>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => openThread(thread)}
              className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.pinned && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {t("community.pinned")}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor(thread.category)}`}>
                      {t(`community.${thread.category}`)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 truncate">{thread.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {t("community.by")} {thread.authorName} &middot; {new Date(thread.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className="text-sm text-gray-500">
                    {thread.postCount} {t("community.posts")}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function categoryColor(category: ThreadCategory): string {
  switch (category) {
    case "general": return "bg-blue-100 text-blue-700";
    case "feedback": return "bg-purple-100 text-purple-700";
    case "ideas": return "bg-yellow-100 text-yellow-700";
    default: return "bg-gray-100 text-gray-600";
  }
}
