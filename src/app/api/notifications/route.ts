import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Notification, { INotification } from "@/models/Notification";
import User from "@/models/User";
import { markNotificationsRead } from "@/lib/utils/notifications";

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return 30;
  return Math.min(100, parsed);
}

function buildActorPayload(actor: unknown) {
  if (!actor || typeof actor !== "object") return null;
  const payload = actor as Record<string, unknown>;
  return {
    username: typeof payload.username === "string" ? payload.username : null,
    displayName: typeof payload.displayName === "string" ? payload.displayName : null,
    image: typeof payload.image === "string" ? payload.image : null,
  };
}

function normalizeId(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (value && typeof value === "object" && "toString" in value) {
    const fn = (value as { toString?: () => string }).toString;
    if (typeof fn === "function") return fn.call(value);
  }
  return "";
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.isBanned) {
    return NextResponse.json({ message: "Account is banned" }, { status: 403 });
  }

  await dbConnect();

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));

  const [notifications, unreadCount, user] = await Promise.all([
    Notification.find({ recipient: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actor", "username displayName image")
      .lean<Array<INotification & { actor?: Record<string, unknown> | null }>>(),
    Notification.countDocuments({ recipient: session.user.id, isRead: false }),
    User.findById(session.user.id).select("notificationsEnabled").lean<{ notificationsEnabled?: boolean }>(),
  ]);

  const payload = notifications.map((item) => ({
    id: normalizeId(item._id),
    type: item.type,
    message: item.message,
    targetUrl: item.targetUrl,
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
    actor: buildActorPayload(item.actor),
  }));

  return NextResponse.json({
    notifications: payload,
    unreadCount,
    notificationsEnabled: user?.notificationsEnabled !== false,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.isBanned) {
    return NextResponse.json({ message: "Account is banned" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { ids, all } = body ?? {};

  if (!all && (!Array.isArray(ids) || ids.length === 0)) {
    return NextResponse.json({ message: "No notifications selected" }, { status: 400 });
  }

  await dbConnect();

  if (all) {
    await markNotificationsRead(session.user.id);
  } else {
    const normalizedIds = ids
      .map((val: unknown) => (typeof val === "string" && mongoose.isValidObjectId(val) ? val : null))
      .filter((val: string | null): val is string => Boolean(val));
    if (!normalizedIds.length) {
      return NextResponse.json({ message: "Invalid notification ids" }, { status: 400 });
    }
    await markNotificationsRead(session.user.id, normalizedIds);
  }

  const unreadCount = await Notification.countDocuments({ recipient: session.user.id, isRead: false });

  return NextResponse.json({ success: true, unreadCount });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.isBanned) {
    return NextResponse.json({ message: "Account is banned" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { ids, all } = body ?? {};

  if (!all && (!Array.isArray(ids) || ids.length === 0)) {
    return NextResponse.json({ message: "No notifications selected" }, { status: 400 });
  }

  await dbConnect();

  if (all) {
    await Notification.deleteMany({ recipient: session.user.id });
  } else {
    const normalizedIds = ids
      .map((val: unknown) => (typeof val === "string" && mongoose.isValidObjectId(val) ? val : null))
      .filter((val: string | null): val is string => Boolean(val));
    if (!normalizedIds.length) {
      return NextResponse.json({ message: "Invalid notification ids" }, { status: 400 });
    }
    await Notification.deleteMany({ recipient: session.user.id, _id: { $in: normalizedIds } });
  }

  const unreadCount = await Notification.countDocuments({ recipient: session.user.id, isRead: false });

  return NextResponse.json({ success: true, unreadCount });
}
