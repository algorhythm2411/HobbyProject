"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const REFRESH_MS = 30000;

function Row({ u, highlight }) {
  const medal = u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : null;
  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-0 ${
        highlight ? "bg-indigo-500/10" : u.rank === 1 ? "bg-amber-400/5" : ""
      }`}
    >
      <span className="w-8 text-center font-bold">
        {medal ?? <span className="text-slate-600 text-sm">#{u.rank}</span>}
      </span>
      {u.image ? (
        <img src={u.image} alt="" className="w-8 h-8 rounded-full" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">
          {u.name?.[0] ?? "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{u.name}</p>
        <p className="text-xs text-slate-500">
          {u.levelEmoji} {u.levelName} {u.streak > 0 && <>· 🔥 {u.streak} day streak</>}
        </p>
      </div>
      <span className="text-indigo-400 font-semibold text-sm tabular-nums">
        {u.xp.toLocaleString()} XP
      </span>
    </div>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState({ topUsers: [], currentUser: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to load leaderboard");
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  const currentUserInTop = data.currentUser && data.currentUser.rank <= data.topUsers.length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 max-w-6xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="text-2xl" aria-hidden="true">🏆</span>
          <span className="text-lg font-bold">DILR Arena</span>
        </Link>
        <Link href="/sets" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Browse sets
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-900 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {data.topUsers.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">
                No one&apos;s on the board yet — be the first to solve a set!
              </p>
            ) : (
              data.topUsers.map((u) => (
                <Row key={u.id} u={u} highlight={u.id === data.currentUser?.id} />
              ))
            )}

            {data.currentUser && !currentUserInTop && (
              <>
                <div className="px-5 py-2 text-center text-xs text-slate-600 bg-slate-950/50">⋯</div>
                <Row u={data.currentUser} highlight />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
