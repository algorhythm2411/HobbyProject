import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateDilrSetForm from "@/components/CreateDilrSetForm";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Create, edit, and manage DILR sets.
          </p>
        </div>

        <CreateDilrSetForm />
      </div>
    </div>
  );
}