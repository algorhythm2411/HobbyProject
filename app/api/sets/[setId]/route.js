import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DilrSet from "@/models/DilrSet";
import SolveSession from "@/models/SolveSession";
import mongoose from "mongoose";

/**
 * GET /api/sets/[setId]
 *
 * Returns everything needed to render the solve screen EXCEPT
 * `correctAnswer` / `explanation` on each question — those only
 * come back from /api/solve, after the attempt is submitted.
 *
 * Also returns `alreadySolved` so the UI can show a
 * "practice mode, reduced XP" notice before the user starts the timer.
 */
export async function GET(_req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { setId } = params;
  if (!mongoose.Types.ObjectId.isValid(setId)) {
    return NextResponse.json({ error: "Invalid set id" }, { status: 400 });
  }

  try {
    await dbConnect();

    const set = await DilrSet.findOne({ _id: setId, status: "active" }).lean();
    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    const alreadySolved = await SolveSession.exists({
      userId: session.user.id,
      setId,
    });

    const sanitizedQuestions = set.questions.map((q) => ({
      questionNumber: q.questionNumber,
      text: q.text,
      options: q.options,
    }));

    return NextResponse.json({
      id: set._id.toString(),
      title: set.title,
      category: set.category,
      type: set.type,
      difficulty: set.difficulty,
      timeLimit: set.timeLimit,
      passage: set.passage,
      dataTable: set.dataTable ?? null,
      questions: sanitizedQuestions,
      isSetOfTheDay: set.isSetOfTheDay,
      alreadySolved: Boolean(alreadySolved),
    });
  } catch (err) {
    console.error("[GET /api/sets/:setId]", err);
    return NextResponse.json({ error: "Failed to load set" }, { status: 500 });
  }
}
