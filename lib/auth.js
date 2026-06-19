import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
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

function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = parts[1];
  const expected = Buffer.from(parts[2], "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          const email = normalizeEmail(credentials?.email);
          const password = credentials?.password;

          if (!email || !password) return null;

          await dbConnect();

          const user = await User.findOne({ email })
            .select("+passwordHash name email image role")
            .lean();

          if (!user?.passwordHash) return null;
          if (!verifyPassword(password, user.passwordHash)) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image ?? null,
            role: user.role ?? "user",
          };
        } catch (err) {
          console.error("[NextAuth] credentials authorize error:", err);
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      try {
        await dbConnect();

        // Google sign-in: create or update profile in MongoDB
        if (account?.provider === "google") {
          const email = normalizeEmail(user?.email);
          if (!email) return false;

          const existing = await User.findOne({ email });

          if (!existing) {
            await User.create({
              name: user.name || deriveNameFromEmail(email),
              email,
              image: user.image || null,
              authProvider: "google",
              emailVerifiedAt: new Date(),
            });
          } else {
            await User.updateOne(
              { email },
              {
                $set: {
                  name: user.name || existing.name,
                  image: user.image || existing.image || null,
                },
              }
            );
          }
        }

        // Credentials sign-in: user already exists, authorize() handled the password check
        return true;
      } catch (err) {
        console.error("[NextAuth] signIn error:", err);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        try {
          if (account?.provider === "credentials") {
            token.userId = user.id;
            token.role = user.role || "user";
          } else {
            await dbConnect();
            const dbUser = await User.findOne({ email: normalizeEmail(user.email) })
              .select("_id role")
              .lean();

            if (dbUser) {
              token.userId = dbUser._id.toString();
              token.role = dbUser.role;
            }
          }
        } catch (err) {
          console.error("[NextAuth] jwt error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
