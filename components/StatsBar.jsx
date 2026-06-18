"use client";
import { useEffect, useState } from "react";

export default function StatsBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return null;

  const hearts = Array.from({ length: 5 }, (_, i) => i < stats.lives ? "❤️" : "🖤");

  return (
    <div className="flex items-center gap-3 text-sm">
      <span title="Lives" className="flex gap-0.5">{hearts.join("")}</span>
      <span title="Streak" className="text-orange-400 font-semibold">
        🔥 {stats.currentStreak}
      </span>
      <span title="XP" className="text-indigo-400 font-semibold">
        {stats.level.emoji} {stats.xp} XP
      </span>
    </div>
  );
}