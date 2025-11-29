import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";

export async function POST(
  _request: Request,
  context: any,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
    }
    const { id } = await context.params;
    const noteId = id;
    if (!mongoose.isValidObjectId(noteId)) {
      return NextResponse.json({ message: "Invalid note ID." }, { status: 400 });
    }

    await dbConnect();

    const note = await Note.findById(noteId).select("likes likedBy");
    if (!note) {
      return NextResponse.json({ message: "Note not found." }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const alreadyLiked = note.likedBy.some((id) => id.equals(userId));

    if (alreadyLiked) {
      note.likedBy.pull(userId);
      note.likes = Math.max(0, (note.likes ?? 0) - 1);
    } else {
      note.likedBy.addToSet(userId);
      note.likes = (note.likes ?? 0) + 1;
    }

    await note.save();

    return NextResponse.json(
      { liked: !alreadyLiked, likes: note.likes ?? 0 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
