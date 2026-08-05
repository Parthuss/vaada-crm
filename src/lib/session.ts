import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session.user : null;
}

export async function requireUserId() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user.id;
}
