"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import ShuttleLabLogo from "./ShuttleLabLogo";
import { useState } from "react";

export default function Navbar() {
  const t = useTranslations();
  const { user, logout, pendingInvitations, actingAs, setActingAs, userOrgs } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleActingAsChange = (value: string) => {
    if (value === "personal") {
      setActingAs({ type: "personal" });
    } else {
      const org = userOrgs.find((o) => o.id === value);
      if (org) {
        setActingAs({ type: "org", orgId: org.id, orgName: org.name });
      }
    }
  };

  const actingAsValue = actingAs.type === "personal" ? "personal" : actingAs.orgId;

  const contextSwitcher = userOrgs.length > 0 && (
    <select
      value={actingAsValue}
      onChange={(e) => handleActingAsChange(e.target.value)}
      className="bg-emerald-800 text-white text-sm border border-emerald-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300"
    >
      <option value="personal">{t("actAs.personal")}</option>
      {userOrgs.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );

  return (
    <nav className="bg-emerald-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <ShuttleLabLogo className="h-7 w-7 text-white" />
            {t("common.appName")}
          </Link>

          {user ? (
            <>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/programs"
                  className="hover:text-emerald-200 transition"
                >
                  {t("nav.programs")}
                </Link>
                <Link href="/create" className="hover:text-emerald-200 transition">
                  {t("nav.create")}
                </Link>
                <Link
                  href="/timeline"
                  className="hover:text-emerald-200 transition"
                >
                  {t("nav.timeline")}
                </Link>
                {actingAs.type === "org" && (
                  <Link
                    href="/sessions"
                    className="hover:text-emerald-200 transition"
                  >
                    {t("nav.sessions")}
                  </Link>
                )}
                <Link
                  href="/org"
                  className="hover:text-emerald-200 transition relative"
                >
                  {t("nav.organization")}
                  {pendingInvitations > 0 && (
                    <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                      {pendingInvitations}
                    </span>
                  )}
                </Link>
                <Link
                  href="/community"
                  className="hover:text-emerald-200 transition"
                >
                  {t("nav.community")}
                </Link>
                <Link
                  href="/settings"
                  className="hover:text-emerald-200 transition"
                >
                  {t("nav.settings")}
                </Link>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-emerald-500">
                  {contextSwitcher}
                  <span className="text-sm text-emerald-200">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm bg-emerald-800 hover:bg-emerald-900 px-3 py-1 rounded transition"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {menuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </>
          ) : (
            <Link
              href="/create"
              className="text-sm bg-white text-emerald-700 font-medium px-4 py-2 rounded-lg hover:bg-emerald-50 transition"
            >
              {t("common.login")}
            </Link>
          )}
        </div>

        {/* Mobile menu */}
        {user && menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {userOrgs.length > 0 && (
              <div className="py-2">
                <label className="text-xs text-emerald-300 block mb-1">{t("actAs.label")}</label>
                <select
                  value={actingAsValue}
                  onChange={(e) => handleActingAsChange(e.target.value)}
                  className="bg-emerald-800 text-white text-sm border border-emerald-500 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="personal">{t("actAs.personal")}</option>
                  {userOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Link
              href="/programs"
              className="block py-2 hover:text-emerald-200"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.programs")}
            </Link>
            <Link
              href="/create"
              className="block py-2 hover:text-emerald-200"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.create")}
            </Link>
            <Link
              href="/timeline"
              className="block py-2 hover:text-emerald-200"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.timeline")}
            </Link>
            {actingAs.type === "org" && (
              <Link
                href="/sessions"
                className="block py-2 hover:text-emerald-200"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.sessions")}
              </Link>
            )}
            <Link
              href="/org"
              className="block py-2 hover:text-emerald-200"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.organization")}
              {pendingInvitations > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {pendingInvitations}
                </span>
              )}
            </Link>
            <Link
              href="/community"
              className="block py-2 hover:text-emerald-200"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.community")}
            </Link>
            <Link
              href="/settings"
              className="block py-2 hover:text-emerald-200"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.settings")}
            </Link>
            <div className="pt-2 border-t border-emerald-500">
              <span className="text-sm text-emerald-200">{user.name}</span>
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="block mt-2 text-sm bg-emerald-800 hover:bg-emerald-900 px-3 py-1 rounded"
              >
                {t("common.logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
