import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DilrSet from "@/models/DilrSet";
import User from "@/models/User";
import SolveSession from "@/models/SolveSession";
import { calculateScore } from "@/lib/scoring";
import { getLevelFromXP } from "@/lib/levels";
import mongoose from "mongoose";

const LIVES_REFILL_MS = 60 * 60 * 1000; // 1 hour
const REPEAT_XP_FACTOR = 0.2; // re-solving an already-solved set earns 20% XP (anti-farming)

function utcDateOnly(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function badgeCheck(user, { score, newStreak }) {
  const earned = [];
  const has = (b) => user.badges.includes(b);

  if (user.totalSetsSolved === 0 && !has("first-blood")) earned.push("first-blood");
  if (score.perfectBonus > 0 && !has("perfectionist")) earned.push("perfectionist");
  if (newStreak >= 7 && !has("week-warrior")) earned.push("week-warrior");
  if (newStreak >= 30 && !has("month-master")) earned.push("month-master");

  return earned;
}

/**
 * POST /api/solve
 * body: { setId, answers: [{questionNumber, selectedOption}], timeTakenSeconds, timedOut }
 */
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { setId, answers, timeTakenSeconds, timedOut = false } = body ?? {};

  if (!setId || !mongoose.Types.ObjectId.isValid(setId) || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  try {
    await dbConnect();

    const [dilrSet, user] = await Promise.all([
      DilrSet.findOne({ _id: setId, status: "active" }),
      User.findById(session.user.id),
    ]);

    if (!dilrSet) return NextResponse.json({ error: "Set not found" }, { status: 404 });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ── Lives gate ──────────────────────────────────────────────────────────
    const now = new Date();
    if (user.lives <= 0) {
      if (user.livesRefillsAt && now >= user.livesRefillsAt) {
        user.lives = 5;
        user.livesRefillsAt = null;
      } else {
        return NextResponse.json(
          {
            error: "OUT_OF_LIVES",
            livesRefillsAt: user.livesRefillsAt,
          },
          { status: 403 }
        );
      }
    }

    // ── Was this set already solved by this user before? ──────────────────
    const isRepeat = Boolean(
      await SolveSession.exists({ userId: user._id, setId: dilrSet._id })
    );

    // ── Align submitted answers to every question in the set ──────────────
    const answerMap = new Map(answers.map((a) => [a.questionNumber, a.selectedOption ?? null]));
    const gradedAnswers = dilrSet.questions.map((q) => {
      const selectedOption = answerMap.has(q.questionNumber)
        ? answerMap.get(q.questionNumber)
        : null;
      return {
        questionNumber: q.questionNumber,
        selectedOption,
        isCorrect: selectedOption != null && selectedOption === q.correctAnswer,
        timeTakenSeconds: 0, // per-question timing not tracked client-side yet
      };
    });

    // ── Daily streak (independent of which set, only "did they solve today") ─
    let newStreak = user.currentStreak;
    const today = utcDateOnly(now);
    const last = user.lastSolvedDate ? utcDateOnly(user.lastSolvedDate) : null;

    if (!last || last.getTime() !== today.getTime()) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const isYesterday = last && today.getTime() - last.getTime() === oneDayMs;
      newStreak = isYesterday ? user.currentStreak + 1 : 1;
      user.lastSolvedDate = now;
      user.currentStreak = newStreak;
      user.longestStreak = Math.max(user.longestStreak, newStreak);
    }

    // ── Score + XP ──────────────────────────────────────────────────────────
    const score = calculateScore({
      answers: gradedAnswers,
      timeTakenSeconds: Math.max(0, Number(timeTakenSeconds) || 0),
      timeLimit: dilrSet.timeLimit,
      currentStreak: newStreak,
      difficulty: dilrSet.difficulty,
    });

    const awardedXP = isRepeat ? Math.round(score.totalXP * REPEAT_XP_FACTOR) : score.totalXP;

    // ── Lives cost ──────────────────────────────────────────────────────────
    const livesLost = Math.min(user.lives, score.wrong);
    user.lives -= livesLost;
    if (user.lives === 0 && !user.livesRefillsAt) {
      user.livesRefillsAt = new Date(now.getTime() + LIVES_REFILL_MS);
    }

    // ── User aggregate stats ──────────────────────────────────────────────
    const prevXP = user.xp;
    user.xp += awardedXP;
    user.level = getLevelFromXP(user.xp).level;
    user.totalAttempted += score.correct + score.wrong;
    user.totalCorrect += score.correct;
    if (!isRepeat) user.totalSetsSolved += 1;

    const newBadges = badgeCheck(user, { score, newStreak });
    if (newBadges.length) user.badges.push(...newBadges);

    await user.save();

    // ── Set-level stats (running averages) ─────────────────────────────────
    const prevAttempts = dilrSet.timesAttempted;
    dilrSet.timesAttempted += 1;
    dilrSet.averageTimeSecs = Math.round(
      (dilrSet.averageTimeSecs * prevAttempts + timeTakenSeconds) / dilrSet.timesAttempted
    );
    dilrSet.averageRawScore =
      (dilrSet.averageRawScore * prevAttempts + score.rawScore) / dilrSet.timesAttempted;
    await dilrSet.save();

    // ── Persist the attempt ──────────────────────────────────────────────
    const solveSession = await SolveSession.create({
      userId: user._id,
      setId: dilrSet._id,
      startedAt: new Date(now.getTime() - (Number(timeTakenSeconds) || 0) * 1000),
      completedAt: timedOut ? null : now,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      timedOut,
      answers: gradedAnswers,
      correctCount: score.correct,
      wrongCount: score.wrong,
      skippedCount: score.skipped,
      rawScore: score.rawScore,
      baseXP: score.baseXP,
      speedBonus: score.speedBonus,
      perfectBonus: score.perfectBonus,
      streakMultiplier: score.streakMultiplier,
      totalXP: awardedXP,
      isSetOfTheDay: dilrSet.isSetOfTheDay,
      livesLost,
    });

    const newLevelInfo = getLevelFromXP(user.xp);
    const leveledUp = getLevelFromXP(prevXP).level !== newLevelInfo.level;

    return NextResponse.json({
      sessionId: solveSession._id.toString(),
      isRepeat,
      score: { ...score, totalXP: awardedXP },
      streak: newStreak,
      lives: user.lives,
      livesRefillsAt: user.livesRefillsAt,
      xp: user.xp,
      level: newLevelInfo,
      leveledUp,
      newBadges,
    });
  } catch (err) {
    console.error("[POST /api/solve]", err);
    return NextResponse.json({ error: "Failed to submit solve" }, { status: 500 });
  }
}

/**
 * GET /api/solve?sessionId=...
 * Fetches a completed session (with correct answers revealed) for the result screen.
 * Ownership-checked — a user can only fetch their own sessions.
 */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  try {
    await dbConnect();

    const solveSession = await SolveSession.findById(sessionId).lean();
    if (!solveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (solveSession.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dilrSet = await DilrSet.findById(solveSession.setId).lean();
    const answerKey = new Map(
      (dilrSet?.questions ?? []).map((q) => [
        q.questionNumber,
        { correctAnswer: q.correctAnswer, explanation: q.explanation, text: q.text, options: q.options },
      ])
    );

    const breakdown = solveSession.answers.map((a) => ({
      ...a,
      ...answerKey.get(a.questionNumber),
    }));

    return NextResponse.json({
      sessionId: solveSession._id.toString(),
      setTitle: dilrSet?.title ?? "Untitled set",
      setId: solveSession.setId.toString(),
      category: dilrSet?.category,
      difficulty: dilrSet?.difficulty,
      timeTakenSeconds: solveSession.timeTakenSeconds,
      timedOut: solveSession.timedOut,
      correctCount: solveSession.correctCount,
      wrongCount: solveSession.wrongCount,
      skippedCount: solveSession.skippedCount,
      rawScore: solveSession.rawScore,
      baseXP: solveSession.baseXP,
      speedBonus: solveSession.speedBonus,
      perfectBonus: solveSession.perfectBonus,
      streakMultiplier: solveSession.streakMultiplier,
      totalXP: solveSession.totalXP,
      livesLost: solveSession.livesLost,
      breakdown,
    });
  } catch (err) {
    console.error("[GET /api/solve]", err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
