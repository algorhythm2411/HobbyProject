import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DilrSet from "@/models/DilrSet";

/**
 * GET /api/sets
 *
 * Query params (all optional):
 *   category    "DI" | "LR"
 *   type        e.g. "table" | "seating" | ...
 *   difficulty  1-5
 *   page        default 1
 *   limit       default 12 (max 50)
 *
 * Returns lightweight metadata only — no `questions` payload at all,
 * just a `questionCount`, so the answer key can never leak from the list view.
 */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const difficulty = searchParams.get("difficulty");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));

  const filter = { status: "active" };
  if (category && ["DI", "LR"].includes(category)) filter.category = category;
  if (type) filter.type = type;
  if (difficulty && !Number.isNaN(Number(difficulty))) {
    filter.difficulty = Number(difficulty);
  }

  try {
    await dbConnect();

    const [total, docs] = await Promise.all([
      DilrSet.countDocuments(filter),
      DilrSet.find(filter)
        .sort({ isSetOfTheDay: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "title category type source year slot difficulty timeLimit communityRating ratingCount timesAttempted isSetOfTheDay tags questions createdAt images"
        )
        .lean(),
    ]);

    const sets = docs.map((d) => ({
      id: d._id.toString(),
      title: d.title,
      category: d.category,
      type: d.type,
      source: d.source,
      year: d.year ?? null,
      slot: d.slot ?? null,
      difficulty: d.difficulty,
      timeLimit: d.timeLimit,
      communityRating: d.communityRating,
      ratingCount: d.ratingCount,
      timesAttempted: d.timesAttempted,
      isSetOfTheDay: d.isSetOfTheDay,
      tags: d.tags,
      images: d.images ?? [],
      questionCount: d.questions?.length ?? 0,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({
      sets,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (err) {
    console.error("[GET /api/sets]", err);
    return NextResponse.json({ error: "Failed to load sets" }, { status: 500 });
  }
}
