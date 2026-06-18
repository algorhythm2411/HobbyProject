/**
 * Calculates the score and XP earned for a completed DILR set.
 *
 * CAT scoring rules:
 *   +3 for each correct answer
 *   -1 for each wrong answer
 *    0 for each skipped question
 *
 * XP bonuses on top:
 *   Speed bonus  — up to +20 XP for finishing early (only if rawScore > 0)
 *   Perfect bonus — +50 XP for 100% accuracy with no wrong attempts
 *   Streak mult  — 1.0× to 2.0× based on daily streak (caps at 10 days)
 *
 * @param {object} params
 * @param {Array<{questionNumber: number, selectedOption: string|null, isCorrect: boolean}>} params.answers
 * @param {number} params.timeTakenSeconds
 * @param {number} params.timeLimit          - Set's time limit in seconds
 * @param {number} [params.currentStreak=0]  - User's active daily streak
 * @param {number} [params.difficulty=3]     - Set difficulty 1–5
 * @returns {{
 *   correct: number, wrong: number, skipped: number,
 *   rawScore: number,
 *   baseXP: number, speedBonus: number, perfectBonus: number,
 *   streakMultiplier: number, totalXP: number
 * }}
 */
export function calculateScore({
  answers,
  timeTakenSeconds,
  timeLimit,
  currentStreak = 0,
  difficulty = 3,
}) {
  const correct = answers.filter((a) => a.isCorrect).length;
  const wrong = answers.filter(
    (a) => a.selectedOption != null && !a.isCorrect
  ).length;
  const skipped = answers.filter((a) => a.selectedOption == null).length;
  const total = answers.length;

  // Raw CAT score
  const rawScore = correct * 3 - wrong * 1;

  // XP scales with difficulty
  const DIFF_MULT = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.5, 5: 2.0 };
  const diffMult = DIFF_MULT[difficulty] ?? 1.0;
  const baseXP = Math.max(0, Math.round(rawScore * 10 * diffMult));

  // Speed bonus — proportional to time left, only if you scored positively
  const timeRatio = Math.max(0, 1 - timeTakenSeconds / timeLimit);
  const speedBonus = rawScore > 0 ? Math.round(timeRatio * 20) : 0;

  // Perfect bonus — no wrong attempts and all questions correct
  const perfectBonus = correct === total && wrong === 0 ? 50 : 0;

  // Streak multiplier — 1.0× at day 0, 2.0× at day 10+
  const streakMultiplier = Math.min(1 + currentStreak * 0.1, 2.0);

  const totalXP = Math.round(
    (baseXP + speedBonus + perfectBonus) * streakMultiplier
  );

  return {
    correct,
    wrong,
    skipped,
    rawScore,
    baseXP,
    speedBonus,
    perfectBonus,
    streakMultiplier,
    totalXP,
  };
}
