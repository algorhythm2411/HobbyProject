"use client";

import { useEffect, useState } from "react";
import { BADGE_LABELS } from "@/lib/badges";

function Card({ title, icon, className = "", children }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 ${className}`}>
      {title && (
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function AccuracyMeter({ percent }) {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);
  const color = clamped >= 75 ? "#22c55e" : clamped >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{clamped}%</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">accuracy</span>
      </div>
    </div>
  );
}

function XPTrendChart({ trend }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (trend.length < 2) {
    return (
      <p className="text-sm text-slate-500 py-10 text-center">
        Solve a few more sets to see your XP trend here.
      </p>
    );
  }

  const W = 600;
  const H = 140;
  const PAD = 10;

  const xs = trend.map((_, i) => PAD + (i * (W - PAD * 2)) / (trend.length - 1));
  const xpValues = trend.map((t) => t.xp);
  const min = Math.min(0, ...xpValues);
  const max = Math.max(0, ...xpValues, 1);
  const range = max - min || 1;
  const ys = xpValues.map((v) => H - PAD - ((v - min) / range) * (H - PAD * 2));
  const zeroY = H - PAD - ((0 - min) / range) * (H - PAD * 2);

  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${zeroY} L ${xs[0]} ${zeroY} Z`;
  const hovered = hoverIdx != null ? trend[hoverIdx] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36" preserveAspectRatio="none">
        {min < 0 && (
          <line
            x1={PAD}
            x2={W - PAD}
            y1={zeroY}
            y2={zeroY}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        )}
        <defs>
          <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#xpFill)" stroke="none" />
        <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="2" />
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={hoverIdx === i ? 5 : 3}
            fill={trend[i].xp < 0 ? "#ef4444" : "#818cf8"}
            stroke="#0f172a"
            strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}
      </svg>
      {hovered && (
        <div className="absolute top-0 right-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
          <p className={`font-semibold ${hovered.xp < 0 ? "text-red-400" : "text-indigo-300"}`}>
            {hovered.xp > 0 ? "+" : ""}
            {hovered.xp} XP
          </p>
          <p className="text-slate-500">{new Date(hovered.date).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}

function CategoryBars({ data }) {
  const maxAttempted = Math.max(1, ...data.map((d) => d.attempted));
  const CATEGORY_LABEL = { DI: "📊 Data Interpretation", LR: "🧩 Logical Reasoning" };

  return (
    <div className="space-y-4">
      {data.map((d) => (
        <div key={d.category}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-slate-200">{CATEGORY_LABEL[d.category]}</span>
            <span className="text-slate-500 tabular-nums">
              {d.attempted > 0 ? `${d.accuracy}% acc` : "—"}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all"
              style={{ width: `${d.attempted ? (d.attempted / maxAttempted) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {d.sets} {d.sets === 1 ? "set" : "sets"} · {d.attempted} questions
          </p>
        </div>
      ))}
    </div>
  );
}

function BadgeRow({ earned }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(BADGE_LABELS).map(([key, meta]) => {
        const has = earned.includes(key);
        return (
          <div
            key={key}
            title={meta.desc}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
              has ? "bg-slate-800/80 border-slate-700" : "bg-slate-900/50 border-slate-800/50 opacity-40"
            }`}
          >
            <span className="text-xl" aria-hidden="true">
              {meta.emoji}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-100">{meta.label}</p>
              <p className="text-[11px] text-slate-500">{meta.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
      ))}
    </div>
  );
}

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Couldn't load your stats.");
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-red-400 text-center py-10">{error}</p>;
  }

  if (!stats) return <SkeletonGrid />;

  const percentile =
    stats.totalUsers > 1
      ? Math.max(1, Math.round(((stats.totalUsers - stats.rank) / (stats.totalUsers - 1)) * 100))
      : 100;

  return (
    <div className="space-y-4">
      {/* Headline row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2" title="Level progress" icon={stats.level.emoji}>
          <div className="flex items-end justify-between mb-3 gap-3">
            <div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: stats.level.color }}>
                {stats.xp.toLocaleString()} <span className="text-base text-slate-500">XP</span>
              </p>
              <p className="text-sm text-slate-400 mt-0.5">
                {stats.level.emoji} {stats.level.name}
              </p>
            </div>
            <p className="text-xs text-slate-500 text-right shrink-0">
              {stats.xpToNextLevel > 0 ? (
                <>{stats.xpToNextLevel.toLocaleString()} XP to next level</>
              ) : (
                "Max level reached"
              )}
            </p>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(0, Math.min(100, stats.progressPercent))}%`,
                backgroundColor: stats.level.color,
              }}
            />
          </div>
        </Card>

        <Card title="Leaderboard rank" icon="🏆">
          <p className="text-3xl font-bold tabular-nums">#{stats.rank}</p>
          <p className="text-xs text-slate-500 mt-1">
            of {stats.totalUsers} {stats.totalUsers === 1 ? "climber" : "climbers"}
            {stats.totalUsers > 1 && <> · top {percentile}%</>}
          </p>
        </Card>

        <Card title="Streak" icon="🔥">
          <p className="text-3xl font-bold tabular-nums">{stats.currentStreak}</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.currentStreak === 1 ? "day" : "days"} · best {stats.longestStreak}
          </p>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Accuracy">
          <AccuracyMeter percent={stats.accuracyPercent} />
        </Card>

        <Card title="Practice volume" icon="📝">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.totalSetsSolved}</p>
              <p className="text-xs text-slate-500 mt-0.5">sets solved</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.totalAttempted}</p>
              <p className="text-xs text-slate-500 mt-0.5">questions attempted</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <p className="text-lg font-semibold text-emerald-400 tabular-nums">{stats.totalCorrect}</p>
            <p className="text-xs text-slate-500">correct answers, lifetime</p>
          </div>
        </Card>

        <Card title="DI vs LR" icon="⚖️">
          <CategoryBars data={stats.categoryBreakdown} />
        </Card>
      </div>

      {/* Trend */}
      <Card title="XP trend · last 10 sets">
        <XPTrendChart trend={stats.trend} />
      </Card>

      {/* Badges */}
      <Card title="Badges">
        <BadgeRow earned={stats.badges} />
      </Card>
    </div>
  );
}
