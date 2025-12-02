import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/adminAuth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Note from "@/models/Note";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.response;
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Delete all notes by this user
    await Note.deleteMany({ author: id });

    // Delete the user account
    await User.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "User and all their notes deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
