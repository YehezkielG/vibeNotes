import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Notification from "@/models/Notification";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ unreadCount: 0 });
  }

  await dbConnect();
  const unreadCount = await Notification.countDocuments({ recipient: session.user.id, isRead: false });
  return NextResponse.json({ unreadCount });
}
