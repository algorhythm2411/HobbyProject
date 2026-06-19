import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export const metadata = { title: "Dashboard · DILR Arena" };

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" aria-hidden="true">🏆</span>
          <span className="text-lg font-bold">DILR Arena</span>
        </div>
        <div className="flex items-center gap-4">
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name ?? ""}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-slate-300 hidden sm:block">{session.user.name}</span>
          <SignOutButton />
        </div>
      </nav>

      {/* Body */}
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-5xl mb-6" aria-hidden="true">🏗️</p>

        <h1 className="text-3xl font-bold mb-2">Welcome, {firstName}!</h1>
        <p className="text-slate-400 text-lg mb-8">
          Pick up where you left off, or jump into a fresh set.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <a
            href="/sets"
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors"
          >
            Browse sets →
          </a>
          <a
            href="/leaderboard"
            className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold transition-colors"
          >
            🏆 Leaderboard
          </a>
          {session.user.role === "admin" && (
            <a
              href="/admin"
              className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
            >
              ⚙️ Create DILR Set
            </a>
          )}
        </div>

        {/* Phase checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-left space-y-6">

          <div>
            <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
              Phase 1 — complete ✅
            </h2>
            <ul className="space-y-1.5 text-sm text-slate-300">
              {[
                "Google OAuth sign-in",
                "User created in MongoDB Atlas",
                "JWT session management",
                "XP + scoring engine (lib/scoring.js)",
                "6-tier level system (lib/levels.js)",
                "Mongoose schemas: User, DilrSet, SolveSession",
                "2 seed DILR sets in database",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
              Phase 2 — complete ✅
            </h2>
            <ul className="space-y-1.5 text-sm text-slate-300">
              {[
                "DILR set browser (filtered by category/difficulty)",
                "Set viewer with passage + data table renderer",
                "Countdown timer with auto-submit on expiry",
                "Score submission API + XP award",
                "Live global leaderboard",
                "Post-solve breakdown screen",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Debug info — useful during dev */}
        <details className="mt-8 text-left">
          <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">
            Session debug info
          </summary>
          <pre className="mt-3 text-xs text-slate-500 bg-slate-900 rounded-lg p-4 overflow-auto text-left">
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
      </main>

    </div>
  );
}
