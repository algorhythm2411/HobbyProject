import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function NewSetPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/");
  if (session.user.role !== "admin") redirect("/");

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Create DILR Set</h1>
        <p className="mt-2 text-gray-600">
          Add a new set. Images will come later.
        </p>

        <form
          action="/api/admin/dilr-sets"
          method="POST"
          className="mt-8 grid gap-4 rounded-2xl border p-6 shadow-sm"
        >
          <input
            name="title"
            placeholder="Set Title"
            className="rounded-xl border px-4 py-3"
            required
          />

          <input
            name="slug"
            placeholder="unique-slug-for-url"
            className="rounded-xl border px-4 py-3"
            required
          />

          <input
            name="category"
            placeholder="Category"
            className="rounded-xl border px-4 py-3"
            required
          />

          <select name="difficulty" className="rounded-xl border px-4 py-3" required>
            <option value="">Select Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <textarea
            name="passage"
            placeholder="Main passage / case text"
            rows="8"
            className="rounded-xl border px-4 py-3"
            required
          />

          <textarea
            name="questions"
            placeholder='Questions as JSON array. Example: [{"question":"...","options":["A","B"],"answer":"A"}]'
            rows="8"
            className="rounded-xl border px-4 py-3 font-mono text-sm"
            required
          />

          <select name="status" className="rounded-xl border px-4 py-3" required>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-3 font-medium text-white"
          >
            Save Set
          </button>
        </form>
      </div>
    </main>
  );
}