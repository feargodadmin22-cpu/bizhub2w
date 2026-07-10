import { auth } from "@/lib/auth-config";
import { SessionUser, ForbiddenError, assertActive } from "@/lib/permissions";
import { redirect } from "next/navigation";

export async function getServerSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) throw new ForbiddenError("Not authenticated");

  const u = session.user as any;
  const sessionUser: SessionUser = {
    id: u.id,
    shopId: u.shopId,
    role: u.role,
    canSeeCostAndProfit: u.canSeeCostAndProfit,
    status: u.status,
  };

  assertActive(sessionUser);
  return sessionUser;
}

export async function requireSession(): Promise<SessionUser> {
  try {
    return await getServerSession();
  } catch {
    redirect("/login");
  }
}