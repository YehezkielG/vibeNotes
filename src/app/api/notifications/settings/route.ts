import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select("notificationsEnabled").lean();
  return NextResponse.json({ notificationsEnabled: user?.notificationsEnabled !== false });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { enabled } = body ?? {};

  if (typeof enabled !== "boolean") {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  await dbConnect();
  const updated = await User.findByIdAndUpdate(
    session.user.id,
    { $set: { notificationsEnabled: enabled } },
    { new: true, select: "notificationsEnabled" },
  ).lean();

  if (!updated) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ notificationsEnabled: updated.notificationsEnabled !== false });
}
