/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";

// POST: Add new response
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Return note with populated response/reply authors (manual populate)
    const noteObj: any = note.toObject();
    const userIds = new Set<string>();
    noteObj.responses.forEach((r: any) => {
      if (r?.author) userIds.add(r.author.toString());
      if (Array.isArray(r.replies)) {
        r.replies.forEach((rep: any) => {
          if (rep?.author) userIds.add(rep.author.toString());
        });
      }
    });

    if (userIds.size > 0) {
      const User = (await import("@/models/User")).default;
      const users = await User.find({ _id: { $in: Array.from(userIds) } }).select(
        "username displayName image"
      ).lean();
      const map = new Map(users.map((u: any) => [u._id.toString(), u]));

      noteObj.responses = noteObj.responses.map((r: any) => ({
        ...r,
        likedBy: Array.isArray(r.likedBy)
          ? r.likedBy.map((id: any) => id?.toString?.() ?? "")
          : [],
        author: map.get(r.author?.toString?.()) || r.author,
        replies: Array.isArray(r.replies)
          ? r.replies.map((rep: any) => ({
              ...rep,
              likedBy: Array.isArray(rep.likedBy)
                ? rep.likedBy.map((id: any) => id?.toString?.() ?? "")
                : [],
              author: map.get(rep.author?.toString?.()) || rep.author,
            }))
          : r.replies,
      }));
    }

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

        // Return the updated response as a plain object with normalized likedBy and populated authors when possible
        const noteObj: any = note.toObject();
        const userIds = new Set<string>();
        noteObj.responses.forEach((r: any) => {
          if (r?.author) userIds.add(r.author.toString());
          if (Array.isArray(r.replies)) {
            r.replies.forEach((rep: any) => {
              if (rep?.author) userIds.add(rep.author.toString());
            });
          }
        });

        if (userIds.size > 0) {
          const User = (await import("@/models/User")).default;
          const users = await User.find({ _id: { $in: Array.from(userIds) } }).select(
            "username displayName image"
          ).lean();
          const map = new Map(users.map((u: any) => [u._id.toString(), u]));

          noteObj.responses = noteObj.responses.map((r: any) => ({
            ...r,
            likedBy: Array.isArray(r.likedBy)
              ? r.likedBy.map((id: any) => id?.toString?.() ?? "")
              : [],
            author: map.get(r.author?.toString?.()) || r.author,
            replies: Array.isArray(r.replies)
              ? r.replies.map((rep: any) => ({
                  ...rep,
                  likedBy: Array.isArray(rep.likedBy)
                    ? rep.likedBy.map((id: any) => id?.toString?.() ?? "")
                    : [],
                  author: map.get(rep.author?.toString?.()) || rep.author,
                }))
              : r.replies,
          }));
        }

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

        // Return updated response/reply serialized
        const noteObj: any = note.toObject();
        const userIds = new Set<string>();
        noteObj.responses.forEach((r: any) => {
          if (r?.author) userIds.add(r.author.toString());
          if (Array.isArray(r.replies)) {
            r.replies.forEach((rep: any) => {
              if (rep?.author) userIds.add(rep.author.toString());
            });
          }
        });

        if (userIds.size > 0) {
          const User = (await import("@/models/User")).default;
          const users = await User.find({ _id: { $in: Array.from(userIds) } }).select(
            "username displayName image"
          ).lean();
          const map = new Map(users.map((u: any) => [u._id.toString(), u]));

          noteObj.responses = noteObj.responses.map((r: any) => ({
            ...r,
            likedBy: Array.isArray(r.likedBy)
              ? r.likedBy.map((id: any) => id?.toString?.() ?? "")
              : [],
            author: map.get(r.author?.toString?.()) || r.author,
            replies: Array.isArray(r.replies)
              ? r.replies.map((rep: any) => ({
                  ...rep,
                  likedBy: Array.isArray(rep.likedBy)
                    ? rep.likedBy.map((id: any) => id?.toString?.() ?? "")
                    : [],
                  author: map.get(rep.author?.toString?.()) || rep.author,
                }))
              : r.replies,
          }));
        }

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

        // Return updated response with populated author objects (manual)
        const noteObj: any = note.toObject();
        const userIds = new Set<string>();
        noteObj.responses.forEach((r: any) => {
          if (r?.author) userIds.add(r.author.toString());
          if (Array.isArray(r.replies)) {
            r.replies.forEach((rep: any) => {
              if (rep?.author) userIds.add(rep.author.toString());
            });
          }
        });

        if (userIds.size > 0) {
          const User = (await import("@/models/User")).default;
          const users = await User.find({ _id: { $in: Array.from(userIds) } }).select(
            "username displayName image"
          ).lean();
          const map = new Map(users.map((u: any) => [u._id.toString(), u]));

          noteObj.responses = noteObj.responses.map((r: any) => ({
              ...r,
              likedBy: Array.isArray(r.likedBy)
                ? r.likedBy.map((id: any) => id?.toString?.() ?? "")
                : [],
              author: map.get(r.author?.toString?.()) || r.author,
              replies: Array.isArray(r.replies)
                ? r.replies.map((rep: any) => ({
                    ...rep,
                    likedBy: Array.isArray(rep.likedBy)
                      ? rep.likedBy.map((id: any) => id?.toString?.() ?? "")
                      : [],
                    author: map.get(rep.author?.toString?.()) || rep.author,
                  }))
                : r.replies,
            }));
        }

        return NextResponse.json({
          message: "Reply added",
          response: noteObj.responses[responseIndex],
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
