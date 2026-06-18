import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignInButton from "@/components/SignInButton";

// ── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "⏱️",
    title: "Timed sets",
    desc: "Solve under real CAT pressure. Speed bonus for finishing early — every second counts.",
  },
  {
    icon: "⚔️",
    title: "Rival system",
    desc: "Auto-matched to someone 5–10% ahead of you. 'You're 47 XP behind Rahul.' Defeat them, get a tougher rival.",
  },
  {
    icon: "🔥",
    title: "Daily streaks",
    desc: "Solve once a day to keep your streak alive. A 7-day streak = 2× XP. Miss a day and it resets.",
  },
  {
    icon: "📅",
    title: "Set of the day",
    desc: "One featured set daily, expires at midnight. Everyone solves the same set. Global daily leaderboard.",
  },
  {
    icon: "👥",
    title: "Study clans",
    desc: "Group with 5–10 friends on a shared leaderboard. Clan-vs-clan weekly challenges.",
  },
  {
    icon: "📊",
    title: "Deep analytics",
    desc: "Time-per-question heatmap, percentile rank, DI vs LR split. Find exactly where you're bleeding marks.",
  },
];

// Sample data to show social proof on the landing page
const SAMPLE_LEADERBOARD = [
  { rank: 1, name: "Arjun Sharma",  xp: 3240, level: "Challenger", streak: 14, medal: "🥇" },
  { rank: 2, name: "Priya Nair",    xp: 2980, level: "Challenger", streak: 9,  medal: "🥈" },
  { rank: 3, name: "Rohan Gupta",   xp: 2710, level: "Challenger", streak: 7,  medal: "🥉" },
  { rank: 4, name: "Sneha Patil",   xp: 2450, level: "Learner",    streak: 12, medal: null },
  { rank: 5, name: "Dev Mehta",     xp: 2190, level: "Learner",    streak: 5,  medal: null },
];

const LEVEL_BADGES = [
  "🌱 Rookie",
  "📚 Learner",
  "⚡ Challenger",
  "🎯 Expert",
  "⚔️ CAT Warrior",
  "👑 Mastermind",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" aria-hidden="true">🏆</span>
          <span className="text-lg font-bold tracking-tight">DILR Arena</span>
        </div>
        <SignInButton />
      </nav>

      {/* ── Hero ── */}
      <section className="text-center px-6 py-20 md:py-28 max-w-4xl mx-auto">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" aria-hidden="true" />
          <span className="text-indigo-300 text-sm font-medium">Live leaderboard · 100+ DILR sets</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-5">
          Crack DILR.<br />
          <span className="text-indigo-400">Dominate CAT.</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Solve DILR sets under timer pressure, earn XP, beat your rival, and climb the leaderboard.
          The most addictive way to prep for CAT&apos;s hardest section.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignInButton large />
          <span className="text-slate-500 text-sm">Free · No credit card</span>
        </div>

        {/* Level progression badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-12 opacity-50">
          {LEVEL_BADGES.map((badge) => (
            <span
              key={badge}
              className="text-xs px-3 py-1 rounded-full border border-slate-700 text-slate-400"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ── Leaderboard preview ── */}
      <section className="px-6 pb-20 max-w-lg mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
            <span className="text-sm font-semibold text-slate-200">🏆 This week</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              Live
            </span>
          </div>

          {SAMPLE_LEADERBOARD.map((u) => (
            <div
              key={u.rank}
              className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-0 ${
                u.rank === 1 ? "bg-amber-400/5" : ""
              }`}
            >
              <span className="w-8 text-center font-bold">
                {u.medal ? (
                  <span>{u.medal}</span>
                ) : (
                  <span className="text-slate-600 text-sm">#{u.rank}</span>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{u.name}</p>
                <p className="text-xs text-slate-500">
                  {u.level} · 🔥 {u.streak} day streak
                </p>
              </div>
              <span className="text-indigo-400 font-semibold text-sm tabular-nums">
                {u.xp.toLocaleString()} XP
              </span>
            </div>
          ))}

          <div className="px-5 py-3 text-center text-xs text-slate-500">
            Sign in to see your rank and compete →
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-slate-100">
          Built to make DILR prep actually stick
        </h2>
        <p className="text-slate-500 text-center mb-10">
          Every mechanic is designed to pull you back for one more set.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/30 transition-colors"
            >
              <span className="text-3xl mb-3 block" aria-hidden="true">{f.icon}</span>
              <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-slate-800 py-16 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Ready to start your DILR grind?
        </h2>
        <p className="text-slate-400 mb-8 text-lg">
          Join CAT aspirants competing daily.
        </p>
        <SignInButton large />
        <p className="text-slate-600 text-xs mt-4">
          DILR Arena is free. Built for CAT 2025 aspirants.
        </p>
      </section>

    </div>
  );
}
