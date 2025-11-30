/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import User from "@/models/User";
import { createNotification, buildNoteAnchorTarget, formatNoteTitleSnippet } from "@/lib/utils/notifications";

interface RouteContext {
  params: {
    id: string;
  };
}

async function serializeNoteResponses(note: any) {
  const noteObj: any = typeof note.toObject === "function" ? note.toObject() : note;
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

  const map = new Map<string, any>();
  if (userIds.size > 0) {
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select(
      "username displayName image"
    ).lean();
    users.forEach((u: any) => map.set(u._id.toString(), u));
  }

  noteObj.responses = Array.isArray(noteObj.responses)
    ? noteObj.responses.map((r: any, responseIndex: number) => ({
        ...r,
        likedBy: Array.isArray(r.likedBy)
          ? r.likedBy.map((id: any) => id?.toString?.() ?? "")
          : [],
        author: map.get(r.author?.toString?.()) || r.author,
        serverIndex: responseIndex,
        replies: Array.isArray(r.replies)
          ? r.replies.map((rep: any, replyIndex: number) => ({
              ...rep,
              likedBy: Array.isArray(rep.likedBy)
                ? rep.likedBy.map((id: any) => id?.toString?.() ?? "")
                : [],
              author: map.get(rep.author?.toString?.()) || rep.author,
              serverResponseIndex: responseIndex,
              serverReplyIndex: replyIndex,
            }))
          : [],
      }))
    : [];

  return noteObj;
}

// POST: Add new response
export async function POST(
  req: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Response text is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // For private notes, only owner can add reflections
    const userId = session.user?.id ?? (session.user as Record<string, unknown>)?._id?.toString();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }
    if (!note.isPublic && note.author.toString() !== userId) {
      return NextResponse.json(
        { error: "Cannot add reflection to someone else's private note" },
        { status: 403 }
      );
    }

    const newResponse = {
      text: text.trim(),
      author: userId,
      likes: 0,
      likedBy: [],
      createdAt: new Date(),
      replies: [],
    };

    note.responses.push(newResponse);
    await note.save();

    const responseIndex = note.responses.length - 1;
    const noteIdStr = note._id.toString();
    const actorLabel = session.user.displayName ?? session.user.username ?? "Someone";
    if (note.isPublic) {
      const ownerId = note.author?.toString?.();
      if (ownerId && ownerId !== userId) {
        const titleSuffix = formatNoteTitleSnippet(note.title ?? "");
        await createNotification({
          actorId: userId,
          recipientId: ownerId,
          type: "response",
          noteId: noteIdStr,
          responseIndex,
          targetUrl: buildNoteAnchorTarget(noteIdStr, responseIndex),
          message: `${actorLabel} responded to your note${titleSuffix || ""}`,
        });
      }
    }

    const noteObj = await serializeNoteResponses(note);

    return NextResponse.json(
      { message: "Response added", note: noteObj },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Like response/reply or add reply to response
export async function PATCH(
  req: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const body = await req.json();
    const { action, responseIndex, replyIndex, replyText } = body;

    await dbConnect();

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const userId = session.user.id ?? (session.user as Record<string, unknown>)?._id?.toString();
    const actorLabel = session.user.displayName ?? session.user.username ?? "Someone";

    // Only public notes support likes
    if ((action === "like-response" || action === "like-reply") && !note.isPublic) {
      return NextResponse.json(
        { error: "Cannot like responses on private notes" },
        { status: 403 }
      );
    }

    switch (action) {
      case "like-response": {
        if (
          typeof responseIndex !== "number" ||
          !note.responses[responseIndex]
        ) {
          return NextResponse.json(
            { error: "Invalid response index" },
            { status: 400 }
          );
        }

        const response = note.responses[responseIndex];
        // ensure likedBy exists and is an array
        response.likedBy = Array.isArray(response.likedBy) ? response.likedBy : [];

        // prevent invalid userId usage
        if (!mongoose.Types.ObjectId.isValid(userId as string)) {
          return NextResponse.json({ error: "Invalid user" }, { status: 400 });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId as string);

        // Check if user already liked this response -> toggle like
        const alreadyLiked = response.likedBy.some(
          (id: mongoose.Types.ObjectId) => id.toString() === userId
        );

        if (alreadyLiked) {
          // remove like
          response.likedBy = response.likedBy.filter(
            (id: mongoose.Types.ObjectId) => id.toString() !== userId
          );
          response.likes = Math.max(0, (response.likes || 1) - 1);
        } else {
          response.likes = (response.likes || 0) + 1;
          response.likedBy.push(userIdObj);
        }

        await note.save();

        const noteObj = await serializeNoteResponses(note);

        return NextResponse.json({
          message: alreadyLiked ? "Response unliked" : "Response liked",
          response: noteObj.responses[responseIndex],
        });
      }

      case "like-reply": {
        if (
          typeof responseIndex !== "number" ||
          typeof replyIndex !== "number" ||
          !note.responses[responseIndex] ||
          !note.responses[responseIndex].replies[replyIndex]
        ) {
          return NextResponse.json(
            { error: "Invalid response or reply index" },
            { status: 400 }
          );
        }

        const reply = note.responses[responseIndex].replies[replyIndex];
        // ensure likedBy exists and is an array
        reply.likedBy = Array.isArray(reply.likedBy) ? reply.likedBy : [];

        if (!mongoose.Types.ObjectId.isValid(userId as string)) {
          return NextResponse.json({ error: "Invalid user" }, { status: 400 });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId as string);

        // Check if user already liked this reply -> toggle like
        const alreadyLiked = reply.likedBy.some(
          (id: mongoose.Types.ObjectId) => id.toString() === userId
        );

        if (alreadyLiked) {
          // remove like
          reply.likedBy = reply.likedBy.filter(
            (id: mongoose.Types.ObjectId) => id.toString() !== userId
          );
          reply.likes = Math.max(0, (reply.likes || 1) - 1);
        } else {
          reply.likes = (reply.likes || 0) + 1;
          reply.likedBy.push(userIdObj);
        }

        await note.save();

        const noteObj = await serializeNoteResponses(note);

        return NextResponse.json({
          message: alreadyLiked ? "Reply unliked" : "Reply liked",
          reply: noteObj.responses[responseIndex].replies[replyIndex],
        });
      }

      case "add-reply": {
        if (
          typeof responseIndex !== "number" ||
          !note.responses[responseIndex]
        ) {
          return NextResponse.json(
            { error: "Invalid response index" },
            { status: 400 }
          );
        }

        if (
          !replyText ||
          typeof replyText !== "string" ||
          replyText.trim().length === 0
        ) {
          return NextResponse.json(
            { error: "Reply text is required" },
            { status: 400 }
          );
        }

        // Only public notes support replies
        if (!note.isPublic) {
          return NextResponse.json(
            { error: "Cannot add replies to private note reflections" },
            { status: 403 }
          );
        }

        if (!mongoose.isValidObjectId(userId)) {
          return NextResponse.json({ error: "Invalid user" }, { status: 400 });
        }

        const newReply = {
          text: replyText.trim(),
          author: userId,
          likes: 0,
          likedBy: [],
          createdAt: new Date(),
        };

        note.responses[responseIndex].replies.push(newReply);
        await note.save();

        const replyPosition = note.responses[responseIndex].replies.length - 1;
        const responseOwnerId = note.responses[responseIndex].author?.toString?.();
        const noteIdStr = note._id.toString();
        const actorLabel = session.user.displayName ?? session.user.username ?? "Seseorang";
        if (responseOwnerId && responseOwnerId !== userId) {
          const titleSuffix = formatNoteTitleSnippet(note.title ?? "");
          await createNotification({
            actorId: userId,
            recipientId: responseOwnerId,
            type: "reply",
            noteId: noteIdStr,
            responseIndex,
            replyIndex: replyPosition,
            targetUrl: buildNoteAnchorTarget(noteIdStr, responseIndex, replyPosition),
            message: `${actorLabel} replied to your response${titleSuffix || ""}`,
          });
        }

        const noteObj = await serializeNoteResponses(note);

        return NextResponse.json({
          message: "Reply added",
          response: noteObj.responses[responseIndex],
        });
      }

      case "delete-response": {
        if (
          typeof responseIndex !== "number" ||
          !note.responses[responseIndex]
        ) {
          return NextResponse.json(
            { error: "Invalid response index" },
            { status: 400 }
          );
        }

        const response = note.responses[responseIndex];
        
        // Check if user is the author
        if (response.author.toString() !== userId) {
          return NextResponse.json(
            { error: "You can only delete your own responses" },
            { status: 403 }
          );
        }

        // Check 10-minute time limit
        const createdAt = response.createdAt || new Date(0);
        const now = new Date();
        const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        if (minutesElapsed > 10) {
          return NextResponse.json(
            { error: "Can only delete responses within 10 minutes of creation" },
            { status: 403 }
          );
        }

        // Remove the response
        note.responses.splice(responseIndex, 1);
        await note.save();

        const noteObjAfterDel = await serializeNoteResponses(note);

        return NextResponse.json({
          message: "Response deleted",
          note: noteObjAfterDel,
        });
      }

      case "delete-reply": {
        if (
          typeof responseIndex !== "number" ||
          typeof replyIndex !== "number" ||
          !note.responses[responseIndex] ||
          !note.responses[responseIndex].replies[replyIndex]
        ) {
          return NextResponse.json(
            { error: "Invalid response or reply index" },
            { status: 400 }
          );
        }

        const reply = note.responses[responseIndex].replies[replyIndex];
        
        // Check if user is the author
        if (reply.author.toString() !== userId) {
          return NextResponse.json(
            { error: "You can only delete your own replies" },
            { status: 403 }
          );
        }

        // Check 10-minute time limit
        const createdAt = reply.createdAt || new Date(0);
        const now = new Date();
        const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        if (minutesElapsed > 10) {
          return NextResponse.json(
            { error: "Can only delete replies within 10 minutes of creation" },
            { status: 403 }
          );
        }

        // Remove the reply
        note.responses[responseIndex].replies.splice(replyIndex, 1);
        await note.save();

        const noteObjAfterReplyDel = await serializeNoteResponses(note);

        return NextResponse.json({
          message: "Reply deleted",
          note: noteObjAfterReplyDel,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
