import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Only admins can access this page.
        </p>

        <div className="mt-8 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">DILR Set Management</h2>
          <p className="mt-2 text-gray-600">
            Create, edit, and publish DILR sets from here.
          </p>

          <Link
            href="/admin/new-set"
            className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-white"
          >
            Add New DILR Set
          </Link>
        </div>
      </div>
    </main>
  );
}