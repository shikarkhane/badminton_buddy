"use client";

import { useState } from "react";

interface UserEntry {
  id: string;
  email: string | null;
  name: string;
  isGuest: boolean;
  createdAt: string;
  lastLogin: string | null;
  programCount: number;
  sharedProgramCount: number;
  loginCountLast7Days: number;
}

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = () => ({
    "Content-Type": "application/json",
    "x-admin-password": adminPassword,
  });

  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin", { headers: headers() });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid admin password");
        return;
      }
      const data = await res.json();
      setUsers(data.users);
      setAuthenticated(true);
    } catch {
      setError("Failed to connect");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin", { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Operation failed");
        return;
      }
      setSuccess(`User ${data.action}: ${email}`);
      setEmail("");
      setPassword("");
      setName("");
      loadUsers();
    } catch {
      setError("Failed to create/update user");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Access</h1>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <input
            type="password"
            placeholder="Admin password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Panel</h1>

      {/* Create/Update User Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add / Update User</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={handleCreateOrUpdate}
          disabled={loading}
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create / Update User"}
        </button>
        <p className="text-sm text-gray-400 mt-2">
          If the email already exists, the password will be updated.
        </p>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Users ({users.length})
          </h2>
          <button
            onClick={loadUsers}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
        {users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 font-medium text-gray-600">Email</th>
                  <th className="pb-2 font-medium text-gray-600">Name</th>
                  <th className="pb-2 font-medium text-gray-600">Type</th>
                  <th className="pb-2 font-medium text-gray-600">Programs</th>
                  <th className="pb-2 font-medium text-gray-600">Shared</th>
                  <th className="pb-2 font-medium text-gray-600">Last Login</th>
                  <th className="pb-2 font-medium text-gray-600">Logins (7d)</th>
                  <th className="pb-2 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800">{u.email || "—"}</td>
                    <td className="py-2 text-gray-800">{u.name}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.isGuest ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {u.isGuest ? "Guest" : "User"}
                      </span>
                    </td>
                    <td className="py-2 text-gray-800 text-center">{u.programCount}</td>
                    <td className="py-2 text-gray-800 text-center">{u.sharedProgramCount}</td>
                    <td className="py-2 text-gray-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-2 text-gray-800 text-center">{u.loginCountLast7Days}</td>
                    <td className="py-2 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
