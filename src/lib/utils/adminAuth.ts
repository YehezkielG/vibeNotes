import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return {
      authorized: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    };
  }

  return { authorized: true, user: session.user };
}
