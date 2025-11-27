import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import { canEditNote } from "@/lib/utils/notesLib";
import { analyzeEmotion } from "@/lib/analyzeEmotion";

// GET single note by ID
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const note = await Note.findById(id)
      .populate("author", "username displayName image")
      .lean();

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch note:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update note (only within 10 minutes and by owner)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    // Check ownership
    if (note.author.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "You can only edit your own notes" },
        { status: 403 }
      );
    }

    // Check if within 10-minute edit window
    if (!canEditNote(note.createdAt)) {
      return NextResponse.json(
        { message: "Edit window has expired (10 minutes)" },
        { status: 403 }
      );
    }

    // Analyze emotion for updated content
    const emotion = await analyzeEmotion(content.trim());

    note.title = title.trim();
    note.content = content.trim();
    note.emotion = emotion.raw ?? "";
    await note.save();

    const updatedNote = await Note.findById(id)
      .populate("author", "username displayName image")
      .lean();

    return NextResponse.json({ note: updatedNote }, { status: 200 });
  } catch (error) {
    console.error("Failed to update note:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove note (only by owner)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    // Check ownership
    if (note.author.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "You can only delete your own notes" },
        { status: 403 }
      );
    }

    await Note.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Note deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete note:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
