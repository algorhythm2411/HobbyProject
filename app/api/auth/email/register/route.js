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
    const { email, password, name } = await req.json();

    const normalizedEmail = normalizeEmail(email);
    const trimmedName = String(name || "").trim() || deriveNameFromEmail(normalizedEmail);

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: process.env.NEXTAUTH_URL || "http://localhost:3000",
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "Account already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    if (existing) {
      existing.name = existing.name || trimmedName;
      existing.passwordHash = passwordHash;
      existing.authProvider = "email";
      existing.emailVerifiedAt = null;
      await existing.save();
    } else {
      await User.create({
        name: trimmedName,
        email: normalizedEmail,
        passwordHash,
        authProvider: "email",
        emailVerifiedAt: null,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Account created. Verification email sent.",
    });
  } catch (err) {
    console.error("[POST /api/auth/email/register]", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
