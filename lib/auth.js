import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    /**
     * Runs on every sign-in. Creates user in MongoDB if they don't exist yet.
     */
    async signIn({ user }) {
      try {
        await dbConnect();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
          });
        } else {
          // Keep name/avatar in sync with Google
          await User.updateOne(
            { email: user.email },
            { $set: { name: user.name, image: user.image } }
          );
        }
        return true;
      } catch (err) {
        console.error("[NextAuth] signIn error:", err);
        return false;
      }
    },

    /**
     * Called once on sign-in (when `user` arg is present).
     * We embed the MongoDB _id into the JWT so every server component
     * can identify the user without a DB query.
     */
    async jwt({ token, user }) {
      if (user) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: user.email })
            .select("_id")
            .lean();
          if (dbUser) token.userId = dbUser._id.toString();
        } catch (err) {
          console.error("[NextAuth] jwt error:", err);
        }
      }
      return token;
    },

    /**
     * Shapes the session object that client components see via useSession().
     * No DB query here — we read from the already-computed JWT token.
     */
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      return session;
    },
  },

  pages: {
    signIn: "/", // redirect unauthenticated users to landing page
  },

  secret: process.env.NEXTAUTH_SECRET,
};
