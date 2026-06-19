"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BADGE_LABELS } from "@/lib/badges";

function StatBox({ label, value, accent }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
      <p className={`text-2xl font-bold ${accent ?? "text-slate-100"}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export default function ResultPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const leveledUp = searchParams.get("leveledUp") === "1";
  const newBadges = (searchParams.get("badges") ?? "").split(",").filter(Boolean);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session id.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/solve?sessionId=${sessionId}`);
        if (!res.ok) throw new Error("Couldn't load this result.");
        setResult(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-500">Loading result…</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-slate-400 mb-4">{error ?? "Result not found."}</p>
          <Link href="/sets" className="text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to sets
          </Link>
        </div>
      </div>
    );
  }

  const accuracy = result.correctCount + result.wrongCount > 0
    ? Math.round((result.correctCount / (result.correctCount + result.wrongCount)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
          {result.category} · {result.setTitle}
        </p>
        <h1 className={`text-3xl font-bold mb-1 ${result.totalXP < 0 ? "text-red-400" : ""}`}>
          {result.totalXP > 0 ? "+" : ""}{result.totalXP} XP
        </h1>
        <p className="text-slate-400 mb-8">
          {result.timedOut ? "Time ran out — " : ""}
          {accuracy}% accuracy · {Math.round(result.timeTakenSeconds / 60)} min
        </p>

        {leveledUp && (
          <div className="mb-6 bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 text-center">
            <p className="text-amber-300 font-semibold">🎉 Level up!</p>
          </div>
        )}

        {newBadges.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            {newBadges.map((b) => {
              const meta = BADGE_LABELS[b];
              if (!meta) return null;
              return (
                <div
                  key={b}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2"
                >
                  <span className="text-xl">{meta.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{meta.label}</p>
                    <p className="text-xs text-slate-500">{meta.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatBox label="Correct" value={result.correctCount} accent="text-emerald-400" />
          <StatBox label="Wrong" value={result.wrongCount} accent="text-red-400" />
          <StatBox label="Skipped" value={result.skippedCount} accent="text-slate-400" />
        </div>

        {/* XP breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            XP breakdown
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Base ({result.rawScore} raw score)</span>
              <span>{result.baseXP}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Speed bonus</span>
              <span>+{result.speedBonus}</span>
            </div>
            {result.perfectBonus > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Perfect set bonus</span>
                <span>+{result.perfectBonus}</span>
              </div>
            )}
            <div className="flex justify-between text-indigo-400 pt-1.5 border-t border-slate-800">
              <span>Streak multiplier</span>
              <span>×{result.streakMultiplier.toFixed(1)}</span>
            </div>
          </div>
        </div>

      {result.totalXP < 0 && (
          <p className="text-sm text-red-400 mb-6">
            ⚠️ Net negative XP this attempt — wrong answers cost more than correct
            ones earned. Negative marking applies here just like the real CAT.
          </p>
        )}

        {/* Per-question breakdown */}
        <div className="space-y-3 mb-8">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Question review
          </h2>
          {result.breakdown.map((q) => (
            <div key={q.questionNumber} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm text-slate-200">
                  Q{q.questionNumber}. {q.text}
                </p>
                <span
                  className={`text-xs font-semibold shrink-0 ${
                    q.isCorrect
                      ? "text-emerald-400"
                      : q.selectedOption == null
                      ? "text-slate-500"
                      : "text-red-400"
                  }`}
                >
                  {q.isCorrect ? "✓ Correct" : q.selectedOption == null ? "Skipped" : "✗ Wrong"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Correct answer: <span className="text-slate-300">{q.correctAnswer}</span>
                {q.selectedOption && q.selectedOption !== q.correctAnswer && (
                  <> · Your answer: <span className="text-red-400">{q.selectedOption}</span></>
                )}
              </p>
              {q.explanation && (
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/sets"
            className="flex-1 text-center bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg py-3 transition-colors"
          >
            Next set →
          </Link>
          <Link
            href="/leaderboard"
            className="flex-1 text-center border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold rounded-lg py-3 transition-colors"
          >
            View leaderboard
          </Link>
        </div>
      </main>
    </div>
  );
}
