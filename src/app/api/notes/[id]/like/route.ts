import "server-only";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import { createNotification, buildNoteAnchorTarget, formatNoteTitleSnippet } from "@/lib/utils/notifications";

interface LikeRouteContext {
  params: {
    id: string;
  };
}

export async function POST(
  _request: Request,
  context: LikeRouteContext,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
    }
    if (session.user.isBanned) {
      return NextResponse.json({ message: "Account is banned." }, { status: 403 });
    }
    const { id } = await context.params;
    const noteId = id;
    if (!mongoose.isValidObjectId(noteId)) {
      return NextResponse.json({ message: "Invalid note ID." }, { status: 400 });
    }

    await dbConnect();

    const note = await Note.findById(noteId).select("likes likedBy author isPublic title");
    if (!note) {
      return NextResponse.json({ message: "Note not found." }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const userIdStr = userId.toString();
    const alreadyLiked = note.likedBy.some((id) => id.equals(userId));

    if (alreadyLiked) {
      note.likedBy.pull(userId);
      note.likes = Math.max(0, (note.likes ?? 0) - 1);
    } else {
      note.likedBy.addToSet(userId);
      note.likes = (note.likes ?? 0) + 1;
    }

    await note.save();

    if (!alreadyLiked && note.isPublic && note.author) {
      const ownerId = note.author.toString();
      if (ownerId !== userIdStr) {
        const actorLabel = session.user.displayName ?? session.user.username ?? "Someone";
        const titleSuffix = formatNoteTitleSnippet(note.title ?? "");
        await createNotification({
          actorId: session.user.id,
          recipientId: ownerId,
          type: "like",
          noteId,
          targetUrl: buildNoteAnchorTarget(noteId),
          message: `${actorLabel} liked your note${titleSuffix || ""}`,
        });
      }
    }

    return NextResponse.json(
      { liked: !alreadyLiked, likes: note.likes ?? 0 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
