"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../auth-context";
import { fetchProfile, Profile } from "../../../lib/api";

export default function ProfilePage() {
  const { userAddress, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userAddress) return;
      try {
        setLoading(true);
        const data = await fetchProfile(userAddress);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userAddress]);

  return (
    <main className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Profile</p>
        <h1 className="text-2xl font-semibold text-slate-900">Your account</h1>
        <p className="text-xs text-slate-500">
          Address: <span className="font-mono">{userAddress}</span>
        </p>
      </header>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
          Loading profile...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && profile && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Budget</p>
            <p className="text-sm text-slate-600">{profile.budget} SUI (placeholder)</p>
            <p className="mt-1 text-xs text-slate-500">Actual on-chain balance will be shown later.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Joined tournaments</p>
            <div className="mt-2 space-y-2">
              {profile.joinedTournaments.length === 0 ? (
                <p className="text-sm text-slate-600">You have not joined any tournaments yet.</p>
              ) : (
                profile.joinedTournaments.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm text-slate-700">
                    <span>Tournament #{t.id}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{t.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={logout}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
      >
        Log out
      </button>
    </main>
  );
}
