import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/adminAuth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.response;
  }

  try {
    await dbConnect();
    const { id } = await params;
    const { isBanned } = await request.json();

    const user = await User.findByIdAndUpdate(
      id,
      { isBanned },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `User ${isBanned ? "banned" : "unbanned"} successfully`, user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to ban/unban user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
