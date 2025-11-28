import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import { canEditNote } from "@/lib/utils/notesLib";
import { analyzeEmotion } from "@/lib/analyzeEmotion";
import { extractDominantEmotion } from "@/lib/utils/emotionMapping";
import { getCounselorAdvice } from "@/lib/ai-counselor";

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

    // Manually populate response and reply authors so client gets author objects (username/displayName/image)
    const noteObj: any = note;
    const userIds = new Set<string>();
    if (Array.isArray(noteObj.responses)) {
      noteObj.responses.forEach((r: any) => {
        if (r?.author) userIds.add(r.author.toString());
        if (Array.isArray(r.replies)) {
          r.replies.forEach((rep: any) => {
            if (rep?.author) userIds.add(rep.author.toString());
          });
        }
      });
    }

    if (userIds.size > 0) {
      const User = (await import("@/models/User")).default;
      const users = await User.find({ _id: { $in: Array.from(userIds) } }).select(
        "username displayName image"
      ).lean();
      const map = new Map(users.map((u: any) => [u._id.toString(), u]));

      noteObj.responses = Array.isArray(noteObj.responses)
        ? noteObj.responses.map((r: any) => ({
            ...r,
            likedBy: Array.isArray(r.likedBy) ? r.likedBy.map((id: any) => id?.toString?.() ?? "") : [],
            author: map.get(r.author?.toString?.()) || r.author,
            replies: Array.isArray(r.replies)
              ? r.replies.map((rep: any) => ({
                  ...rep,
                  likedBy: Array.isArray(rep.likedBy) ? rep.likedBy.map((id: any) => id?.toString?.() ?? "") : [],
                  author: map.get(rep.author?.toString?.()) || rep.author,
                }))
              : r.replies,
          }))
        : noteObj.responses;
    }

    return NextResponse.json({ note: noteObj }, { status: 200 });
    
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
    const { title, content, includeCounselor } = body;

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

    // Optional: generate counselor advice if requested
    if (includeCounselor) {
      try {
        const dominant = extractDominantEmotion(emotion.raw ?? null);
        const label = dominant?.label ?? "neutral";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // store short advice text
        // Note: ai-counselor may throw if not configured; we safely catch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // @ts-ignore
        note.counselorAdvice = await getCounselorAdvice(content.trim(), label);
      } catch (err) {
        console.error("Counselor generation failed during update:", err);
      }
    }

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
