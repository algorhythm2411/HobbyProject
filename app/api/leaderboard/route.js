import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getLevelFromXP } from "@/lib/levels";

/**
 * GET /api/leaderboard
 * Returns the all-time top 50 by XP, plus the current user's global rank
 * (even if they're outside the top 50).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const [topDocs, me] = await Promise.all([
      User.find({}).sort({ xp: -1 }).limit(50).select("name image xp currentStreak").lean(),
      User.findById(session.user.id).select("name image xp currentStreak").lean(),
    ]);

    const shape = (u, rank) => {
      const lvl = getLevelFromXP(u.xp);
      return {
        id: u._id.toString(),
        rank,
        name: u.name,
        image: u.image ?? null,
        xp: u.xp,
        streak: u.currentStreak,
        levelName: lvl.name,
        levelEmoji: lvl.emoji,
        levelColor: lvl.color,
      };
    };

    const topUsers = topDocs.map((u, i) => shape(u, i + 1));

    let currentUser = null;
    if (me) {
      const isInTop = topUsers.find((u) => u.id === session.user.id);
      if (isInTop) {
        currentUser = isInTop;
      } else {
        const higherCount = await User.countDocuments({ xp: { $gt: me.xp } });
        currentUser = shape(me, higherCount + 1);
      }
    }

    return NextResponse.json({ topUsers, currentUser });
  } catch (err) {
    console.error("[GET /api/leaderboard]", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
