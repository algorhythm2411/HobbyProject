import mongoose from "mongoose";

// ── Sub-schema: per-question answer record ────────────────────────────────────
const AnswerSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    // null means the user skipped this question
    selectedOption: { type: String, enum: ["A", "B", "C", "D", null], default: null },
    isCorrect: { type: Boolean, required: true },
    timeTakenSeconds: { type: Number, default: 0 }, // time spent on this question
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────
const SolveSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    setId: { type: mongoose.Schema.Types.ObjectId, ref: "DilrSet", required: true },

    // ── Timing ────────────────────────────────────────────────────────────────
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null }, // null if timed out
    timeTakenSeconds: { type: Number, required: true },
    timedOut: { type: Boolean, default: false },

    // ── Answers ───────────────────────────────────────────────────────────────
    answers: { type: [AnswerSchema], required: true },

    // ── Score breakdown (mirrors lib/scoring.js output) ───────────────────────
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    rawScore: { type: Number, default: 0 },   // (correct*3) - (wrong*1)

    // ── XP breakdown ─────────────────────────────────────────────────────────
    baseXP: { type: Number, default: 0 },
    speedBonus: { type: Number, default: 0 },
    perfectBonus: { type: Number, default: 0 },
    streakMultiplier: { type: Number, default: 1 },
    totalXP: { type: Number, default: 0 },

    // ── Context ───────────────────────────────────────────────────────────────
    isSetOfTheDay: { type: Boolean, default: false },
    livesLost: { type: Number, default: 0 }, // wrong answers consume lives
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// "Has this user already solved this set?" — needed to prevent duplicate XP
SolveSessionSchema.index({ userId: 1, setId: 1 });

// Leaderboard: sort all sessions by totalXP descending
SolveSessionSchema.index({ totalXP: -1 });

// Daily leaderboard: all sessions for today's set of the day
SolveSessionSchema.index({ isSetOfTheDay: 1, createdAt: -1 });

// User history feed
SolveSessionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SolveSession ||
  mongoose.model("SolveSession", SolveSessionSchema);
