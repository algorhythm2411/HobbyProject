import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: String,

    // Email/password auth
    passwordHash: { type: String, default: null, select: false },
    emailVerifiedAt: { type: Date, default: null },
    authProvider: { type: String, enum: ["google", "email"], default: "google" },

    // ── Game stats ────────────────────────────────────────────────────────────
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1, min: 1, max: 6 },

    // ── Streaks ───────────────────────────────────────────────────────────────
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSolvedDate: { type: Date, default: null },

    // ── Aggregate accuracy stats ──────────────────────────────────────────────
    totalSetsSolved: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalAttempted: { type: Number, default: 0 },

    // ── Badges ────────────────────────────────────────────────────────────────
    badges: { type: [String], default: [] },

    // ── Social ────────────────────────────────────────────────────────────────
    rivalId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    clanId: { type: mongoose.Schema.Types.ObjectId, ref: "Clan", default: null },

    // ── Role ──────────────────────────────────────────────────────────────────
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
UserSchema.index({ xp: -1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
UserSchema.virtual("accuracyPercent").get(function () {
  if (!this.totalAttempted) return 0;
  return Math.round((this.totalCorrect / this.totalAttempted) * 100);
});

// Prevent model-overwrite error on Next.js hot reload
export default mongoose.models.User || mongoose.model("User", UserSchema);
