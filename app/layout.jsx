import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";

export const metadata = {
  title: "DILR Arena",
  description:
    "Gamified CAT DILR practice — solve sets, earn XP, beat your rival, and climb the leaderboard.",
  icons: { icon: "/favicon.ico" },
};

export default async function RootLayout({ children }) {
  // Fetch session server-side so the client SessionProvider is pre-hydrated.
  // This avoids a loading flash on the client.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
