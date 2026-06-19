import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import DashboardStats from "@/components/dashboard/DashboardStats";

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
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {firstName} 👋</h1>
            <p className="text-slate-400 mt-1">Here&apos;s where you stand in the Arena.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/sets"
              className="px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-colors"
            >
              Browse sets →
            </a>
            <a
              href="/leaderboard"
              className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold text-sm transition-colors"
            >
              🏆 Leaderboard
            </a>
            {session.user.role === "admin" && (
              <a
                href="/admin"
                className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
              >
                ⚙️ Create set
              </a>
            )}
          </div>
        </div>

        <DashboardStats />
      </main>

    </div>
  );
}
