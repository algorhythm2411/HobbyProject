import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DilrSet from "@/models/DilrSet";
import { requireAdmin } from "@/lib/admin";

export async function POST(req) {
  const auth = await requireAdmin();

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.message },
      { status: auth.status }
    );
  }

  try {
    await dbConnect();

    const body = await req.json();

    const set = await DilrSet.create({
      ...body,
      createdBy: auth.session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        set,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
