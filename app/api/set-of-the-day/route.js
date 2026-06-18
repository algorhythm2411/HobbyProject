import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DilrSet from "@/models/DilrSet";

export async function GET(req) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Clear previous set of the day
  await DilrSet.updateMany({ isSetOfTheDay: true }, { isSetOfTheDay: false, setOfTheDayDate: null });

  // Pick a random active set (exclude recently featured ones — last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const candidates = await DilrSet.find({
    status: "active",
    $or: [{ setOfTheDayDate: null }, { setOfTheDayDate: { $lt: sevenDaysAgo } }],
  }).select("_id");

  if (!candidates.length) {
    return NextResponse.json({ error: "No eligible sets" }, { status: 404 });
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  await DilrSet.updateOne(
    { _id: chosen._id },
    { isSetOfTheDay: true, setOfTheDayDate: new Date() }
  );

  return NextResponse.json({ ok: true, setId: chosen._id.toString() });
}