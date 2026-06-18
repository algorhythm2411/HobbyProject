/**
 * 6-tier level system. XP thresholds chosen so a serious aspirant
 * (3–4 sets/day) reaches Mastermind in ~3 months.
 */
export const LEVELS = [
  {
    level: 1,
    name: "Rookie",
    minXP: 0,
    maxXP: 499,
    emoji: "🌱",
    color: "#94a3b8",
    tailwind: "text-slate-400",
  },
  {
    level: 2,
    name: "Learner",
    minXP: 500,
    maxXP: 1999,
    emoji: "📚",
    color: "#22c55e",
    tailwind: "text-green-400",
  },
  {
    level: 3,
    name: "Challenger",
    minXP: 2000,
    maxXP: 4999,
    emoji: "⚡",
    color: "#818cf8",
    tailwind: "text-indigo-400",
  },
  {
    level: 4,
    name: "Expert",
    minXP: 5000,
    maxXP: 11999,
    emoji: "🎯",
    color: "#a855f7",
    tailwind: "text-purple-400",
  },
  {
    level: 5,
    name: "CAT Warrior",
    minXP: 12000,
    maxXP: 24999,
    emoji: "⚔️",
    color: "#f97316",
    tailwind: "text-orange-400",
  },
  {
    level: 6,
    name: "Mastermind",
    minXP: 25000,
    maxXP: Infinity,
    emoji: "👑",
    color: "#f59e0b",
    tailwind: "text-amber-400",
  },
];

/** Returns the level object for a given XP total. */
export function getLevelFromXP(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

/** Returns 0–100 progress percentage within the current level. */
export function getProgressPercent(xp) {
  const current = getLevelFromXP(xp);
  if (current.maxXP === Infinity) return 100;
  const range = current.maxXP - current.minXP + 1;
  const progress = xp - current.minXP;
  return Math.round((progress / range) * 100);
}

/** Returns XP needed to reach the next level (0 if already Mastermind). */
export function getXPToNextLevel(xp) {
  const current = getLevelFromXP(xp);
  if (current.maxXP === Infinity) return 0;
  return current.maxXP + 1 - xp;
}
