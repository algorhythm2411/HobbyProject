"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DataTable({ table }) {
  if (!table || table.length === 0) return null;
  const [header, ...rows] = table;
  return (
    <div className="overflow-x-auto mb-4 rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-800/60">
          <tr>
            {header.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-slate-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-slate-800/70">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SolvePage({ params }) {
  const { setId } = params;
  const router = useRouter();

  const [set, setSet] = useState(null);
  const [answers, setAnswers] = useState({}); // questionNumber -> "A"|"B"|"C"|"D"
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [outOfLives, setOutOfLives] = useState(null); // { livesRefillsAt } | null

  const startedAtRef = useRef(null);
  const submittedRef = useRef(false);

  // ── Load the set ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sets/${setId}`);
        if (res.status === 404) throw new Error("This set doesn't exist or was removed.");
        if (!res.ok) throw new Error("Failed to load set");
        const data = await res.json();
        if (cancelled) return;
        setSet(data);
        setSecondsLeft(data.timeLimit);
        startedAtRef.current = Date.now();
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setId]);

  const submit = useCallback(
    async (timedOut) => {
      if (submittedRef.current || !set) return;
      submittedRef.current = true;
      setSubmitting(true);

      const timeTakenSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      const payloadAnswers = Object.entries(answers).map(([questionNumber, selectedOption]) => ({
        questionNumber: Number(questionNumber),
        selectedOption,
      }));

      try {
        const res = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setId, answers: payloadAnswers, timeTakenSeconds, timedOut }),
        });

        if (res.status === 403) {
          const data = await res.json();
          setOutOfLives({ livesRefillsAt: data.livesRefillsAt });
          submittedRef.current = false;
          setSubmitting(false);
          return;
        }
        if (!res.ok) throw new Error("Submission failed");

        const data = await res.json();
        const extra = new URLSearchParams({ session: data.sessionId });
        if (data.leveledUp) extra.set("leveledUp", "1");
        if (data.newBadges?.length) extra.set("badges", data.newBadges.join(","));
        router.push(`/solve/${setId}/result?${extra.toString()}`);
      } catch (err) {
        submittedRef.current = false;
        setSubmitting(false);
        setError(err.message);
      }
    },
    [answers, router, set, setId]
  );

  // ── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (secondsLeft == null) return;
    if (secondsLeft <= 0) {
      submit(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, submit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-500">Loading set…</p>
      </div>
    );
  }

  if (outOfLives) {
    const refillsAt = outOfLives.livesRefillsAt ? new Date(outOfLives.livesRefillsAt) : null;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">💔</p>
          <h1 className="text-xl font-bold mb-2">Out of lives</h1>
          <p className="text-slate-400 mb-6">
            {refillsAt
              ? `Your lives refill at ${refillsAt.toLocaleTimeString()}.`
              : "Your lives are refilling — check back shortly."}
          </p>
          <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-slate-400 mb-4">{error ?? "Something went wrong."}</p>
          <Link href="/sets" className="text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to sets
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isLowTime = secondsLeft <= 60;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sticky timer bar */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-sm text-slate-400">
            {answeredCount}/{set.questions.length} answered
          </span>
          <span
            className={`font-mono text-lg font-bold tabular-nums ${
              isLowTime ? "text-red-400 animate-pulse" : "text-slate-100"
            }`}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {set.alreadySolved && (
          <div className="mb-6 text-xs text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
            You&apos;ve already solved this set — repeat attempts earn reduced XP.
          </div>
        )}

        <h1 className="text-xl font-bold mb-1">{set.title}</h1>
        <p className="text-xs text-slate-500 mb-5">
          {set.category} · {set.type} · Difficulty {set.difficulty}/5
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">{set.passage}</p>
          <DataTable table={set.dataTable} />
        </div>

        <div className="space-y-6">
          {set.questions.map((q) => (
            <div key={q.questionNumber} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="font-medium text-slate-100 mb-4">
                Q{q.questionNumber}. {q.text}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(q.options).map(([key, label]) => {
                  const selected = answers[q.questionNumber] === key;
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.questionNumber]: key }))
                      }
                      className={`text-left text-sm px-3.5 py-2.5 rounded-lg border transition-colors ${
                        selected
                          ? "bg-indigo-500/15 border-indigo-500 text-indigo-200"
                          : "border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <span className="font-semibold mr-2">{key}.</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => submit(false)}
          disabled={submitting}
          className="w-full mt-8 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-semibold rounded-lg py-3.5 transition-colors"
        >
          {submitting ? "Submitting…" : "Submit set"}
        </button>
      </main>
    </div>
  );
}
