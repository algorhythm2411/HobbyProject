import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth App Router handler — handles both GET (session check) and POST (sign-in/out)
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
