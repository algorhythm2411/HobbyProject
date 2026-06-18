"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const CATEGORY_OPTIONS = [
  { value: "", label: "All" },
  { value: "DI", label: "DI" },
  { value: "LR", label: "LR" },
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "All" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
];

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-indigo-500 border-indigo-500 text-white"
          : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function DifficultyDots({ level }) {
  return (
    <div className="flex gap-0.5" aria-label={`Difficulty ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= level ? "bg-orange-400" : "bg-slate-700"}`}
        />
      ))}
    </div>
  );
}

function SetCard({ set }) {
  const minutes = Math.round(set.timeLimit / 60);
  return (
    <Link
      href={`/solve/${set.id}`}
      className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/40 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            set.category === "DI"
              ? "bg-sky-500/10 text-sky-300"
              : "bg-purple-500/10 text-purple-300"
          }`}
        >
          {set.category} · {set.type}
        </span>
        {set.isSetOfTheDay && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300">
            ⭐ Today
          </span>
        )}
      </div>

      <h3 className="font-semibold text-slate-100 mb-3 leading-snug">{set.title}</h3>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <DifficultyDots level={set.difficulty} />
        <span>⏱️ {minutes} min</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/70 text-xs text-slate-500">
        <span>{set.questionCount} questions</span>
        <span>
          {set.communityRating > 0 ? `★ ${set.communityRating.toFixed(1)}` : "Not yet rated"}
        </span>
      </div>
    </Link>
  );
}

export default function SetsPage() {
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ sets: [], totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (category) params.set("category", category);
      if (difficulty) params.set("difficulty", difficulty);

      const res = await fetch(`/api/sets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load sets");
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category, difficulty, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 max-w-6xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="text-2xl" aria-hidden="true">🏆</span>
          <span className="text-lg font-bold">DILR Arena</span>
        </Link>
        <Link href="/leaderboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          Leaderboard →
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Browse sets</h1>
        <p className="text-slate-500 mb-6">{data.total} sets available</p>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-slate-500 mr-1">Category</span>
          {CATEGORY_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              active={category === opt.value}
              onClick={() => {
                setCategory(opt.value);
                setPage(1);
              }}
            >
              {opt.label}
            </Pill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs text-slate-500 mr-1">Difficulty</span>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              active={difficulty === opt.value}
              onClick={() => {
                setDifficulty(opt.value);
                setPage(1);
              }}
            >
              {opt.label}
            </Pill>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-6">Couldn&apos;t load sets — try refreshing.</p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : data.sets.length === 0 ? (
          <p className="text-slate-500 text-center py-16">No sets match these filters yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.sets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        )}

        {data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-500"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {data.totalPages}
            </span>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-500"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
