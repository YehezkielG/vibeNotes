import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/adminAuth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.response;
  }

  try {
    await dbConnect();

    const users = await User.find({})
      .select("_id username displayName email image createdAt isOnboarded isBanned")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();

    return NextResponse.json(
      {
        users: users.map((user) => ({
          _id: String(user._id),
          username: user.username ?? "",
          displayName: user.displayName ?? "",
          email: user.email ?? "",
          image: user.image ?? "",
          createdAt: user.createdAt,
          isOnboarded: user.isOnboarded ?? false,
          isBanned: user.isBanned ?? false,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch users for admin:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
