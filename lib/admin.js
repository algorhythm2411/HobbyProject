import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Checks whether the current logged-in user is an admin.
 * Returns:
 *  - { ok: true, session } if admin
 *  - { ok: false, status, message } otherwise
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized",
    };
  }

  if (session.user.role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "Forbidden",
    };
  }

  return {
    ok: true,
    session,
  };
}
