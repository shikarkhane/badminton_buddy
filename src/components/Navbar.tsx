"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import ShuttleLabLogo from "./ShuttleLabLogo";
import { useState } from "react";

export default function Navbar() {
  const t = useTranslations();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <nav className="bg-emerald-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <ShuttleLabLogo className="h-7 w-7 text-white" />
            {t("common.appName")}
          </Link>

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
            <Link
              href="/org"
              className="hover:text-emerald-200 transition"
            >
              {t("nav.organization")}
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
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
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
            <Link
              href="/org"
              className="block py-2 hover:text-emerald-200"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.organization")}
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
