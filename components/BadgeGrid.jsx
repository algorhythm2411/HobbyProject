"use client";

const BADGE_META = {
  "first-blood":   { emoji: "🩸", label: "First Blood",    desc: "Completed your first set" },
  "perfectionist": { emoji: "💯", label: "Perfectionist",  desc: "Solved a set with 100% accuracy" },
  "week-warrior":  { emoji: "🗓️",  label: "Week Warrior",   desc: "Maintained a 7-day streak" },
  "month-master":  { emoji: "📅", label: "Month Master",   desc: "Maintained a 30-day streak" },
};

export default function BadgeGrid({ badges = [] }) {
  if (!badges.length) {
    return <p className="text-slate-500 text-sm">No badges yet — start solving!</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((b) => {
        const meta = BADGE_META[b] ?? { emoji: "🏅", label: b, desc: "" };
        return (
          <div
            key={b}
            title={meta.desc}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <span className="text-xl">{meta.emoji}</span>
            <span className="font-medium text-slate-200">{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}