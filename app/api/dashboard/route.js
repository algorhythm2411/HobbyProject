import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import SolveSession from "@/models/SolveSession";
import { getLevelFromXP, getProgressPercent, getXPToNextLevel } from "@/lib/levels";

const TREND_LIMIT = 10;

/**
 * GET /api/dashboard
 * Aggregated personal stats for the dashboard: level/XP progress,
 * leaderboard rank, accuracy, streak, DI-vs-LR breakdown, and a
 * recent-session XP trend for the sparkline.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [higherCount, totalUsers, recentSessions, categoryRows] = await Promise.all([
      User.countDocuments({ xp: { $gt: user.xp } }),
      User.countDocuments({}),
      SolveSession.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(TREND_LIMIT)
        .select("totalXP correctCount wrongCount createdAt")
        .lean(),
      SolveSession.aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: "dilrsets",
            localField: "setId",
            foreignField: "_id",
            as: "set",
          },
        },
        { $unwind: "$set" },
        {
          $group: {
            _id: "$set.category",
            attempted: { $sum: { $add: ["$correctCount", "$wrongCount"] } },
            correct: { $sum: "$correctCount" },
            sets: { $sum: 1 },
          },
        },
      ]),
    ]);

    const rank = higherCount + 1;
    const level = getLevelFromXP(user.xp);

    const accuracyPercent = user.totalAttempted
      ? Math.round((user.totalCorrect / user.totalAttempted) * 100)
      : 0;

    // Always return both categories, even with zero attempts, so the UI
    // doesn't have to special-case a missing row.
    const categoryBreakdown = ["DI", "LR"].map((cat) => {
      const row = categoryRows.find((r) => r._id === cat);
      const attempted = row?.attempted ?? 0;
      const correct = row?.correct ?? 0;
      return {
        category: cat,
        sets: row?.sets ?? 0,
        attempted,
        correct,
        accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
      };
    });

    // Oldest → newest, for the trend chart.
    const trend = recentSessions
      .slice()
      .reverse()
      .map((s) => {
        const attempted = s.correctCount + s.wrongCount;
        return {
          date: s.createdAt,
          xp: s.totalXP,
          accuracy: attempted ? Math.round((s.correctCount / attempted) * 100) : 0,
        };
      });

    return NextResponse.json({
      xp: user.xp,
      level: { level: level.level, name: level.name, emoji: level.emoji, color: level.color },
      progressPercent: Math.max(0, getProgressPercent(user.xp)),
      xpToNextLevel: getXPToNextLevel(user.xp),
      rank,
      totalUsers,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalSetsSolved: user.totalSetsSolved,
      totalAttempted: user.totalAttempted,
      totalCorrect: user.totalCorrect,
      accuracyPercent,
      badges: user.badges,
      categoryBreakdown,
      trend,
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
