import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getLevelFromXP, getProgressPercent, getXPToNextLevel } from "@/lib/levels";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const levelInfo = getLevelFromXP(user.xp);
  const now = new Date();

  // Live lives refill check
  let lives = user.lives;
  let livesRefillsAt = user.livesRefillsAt;
  if (lives < 5 && livesRefillsAt && now >= new Date(livesRefillsAt)) {
    lives = 5;
    livesRefillsAt = null;
    await User.updateOne({ _id: user._id }, { lives: 5, livesRefillsAt: null });
  }

  return NextResponse.json({
    name: user.name,
    image: user.image,
    xp: user.xp,
    level: levelInfo,
    progressPercent: getProgressPercent(user.xp),
    xpToNext: getXPToNextLevel(user.xp),
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lives,
    livesRefillsAt,
    totalSetsSolved: user.totalSetsSolved,
    badges: user.badges,
    accuracyPercent: user.totalAttempted
      ? Math.round((user.totalCorrect / user.totalAttempted) * 100)
      : 0,
  });
}