import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";

export async function GET(
  _request: Request,
  context: any,
) {
  try {
    const { visibility } = await context.params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
    }
    if (session.user.isBanned) {
      return NextResponse.json({ message: "Account is banned." }, { status: 403 });
    }

    const validVisibilities = ["public", "private"];
    if (!(validVisibilities.includes(visibility))) {
      return NextResponse.json(
        { message: "Invalid visibility parameter." },
        { status: 400 },
      );
    }

    await dbConnect();

    const filter = {
      author: session.user.id,
      isPublic: visibility === "public",
    };

    const notes = await Note.find(filter)
      .sort({ createdAt: -1 }).populate("author", "username displayName image")
      .lean()
      .exec();

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}