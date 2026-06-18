"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Thin wrapper so the server-side root layout can pass the session
 * to NextAuth's client-side context without making the layout itself
 * a client component.
 */
export default function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
