import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function deriveNameFromEmail(email) {
  const local = normalizeEmail(email).split("@")[0] || "user";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Missing Supabase access token" }, { status: 401 });
    }

    const { password, name } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase env vars are missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user?.email) {
      return NextResponse.json({ error: "Invalid or expired OTP session" }, { status: 401 });
    }

    const email = normalizeEmail(data.user.email);
    const displayName = String(name || "").trim() || deriveNameFromEmail(email);

    await dbConnect();

    const existing = await User.findOne({ email }).select("+passwordHash +authProvider");

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "Account already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    if (existing) {
      existing.name = existing.name || displayName;
      existing.passwordHash = hashPassword(password);
      existing.emailVerifiedAt = existing.emailVerifiedAt || new Date();
      existing.authProvider = "email";
      await existing.save();

      return NextResponse.json({ ok: true, created: false });
    }

    await User.create({
      name: displayName,
      email,
      passwordHash: hashPassword(password),
      emailVerifiedAt: new Date(),
      authProvider: "email",
      image: data.user.user_metadata?.avatar_url || null,
    });

    return NextResponse.json({ ok: true, created: true });
  } catch (err) {
    console.error("[POST /api/auth/email/register]", err);
    return NextResponse.json({ error: "Failed to register account" }, { status: 500 });
  }
}
