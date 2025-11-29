import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import { analyzeEmotion } from "@/lib/analyzeEmotion";
import { extractDominantEmotion } from "@/lib/utils/emotionMapping";
import { getCounselorAdvice } from "@/lib/ai-counselor";
import sanitizeHtml from "sanitize-html";
import mongoose from "mongoose";
import User from "@/models/User";

// Helper: sanitize strings and nested note structures before sending to client
const sanitizeString = (value: any) => (typeof value === "string" ? sanitizeHtml(value) : value);

function sanitizeReplies(replies: any) {
  if (!Array.isArray(replies)) return replies;
  return replies.map((r: any) => ({ ...r, content: sanitizeString(r?.content) }));
}

function sanitizeResponses(responses: any) {
  if (!Array.isArray(responses)) return responses;
  return responses.map((resp: any) => ({
    ...resp,
    content: sanitizeString(resp?.content),
    replies: sanitizeReplies(resp?.replies),
  }));
}

function sanitizeNoteObject(note: any) {
  if (!note || typeof note !== "object") return note;
  const sanitized: any = { ...note };
  if (sanitized.title) sanitized.title = sanitizeString(sanitized.title);
  if (sanitized.content) sanitized.content = sanitizeString(sanitized.content);
  if (sanitized.responses) sanitized.responses = sanitizeResponses(sanitized.responses);
  if (sanitized.author && typeof sanitized.author === "object") {
    if (sanitized.author.displayName) sanitized.author.displayName = sanitizeString(sanitized.author.displayName);
    if (sanitized.author.username) sanitized.author.username = sanitizeString(sanitized.author.username);
  }
  return sanitized;
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        // FIX: ensure user.id exists (requires callback in auth.config)
        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Not authenticated." },
                { status: 401 }
            );
        }

        const { title, content, isPublic, includeCounselor } = await request.json();

        if (!title?.trim()) {
            return NextResponse.json(
                { message: "Title is required." },
                { status: 400 }
            );
        }

        if (!content?.trim()) {
            return NextResponse.json(
                { message: "Note content is required." },
                { status: 400 }
            );
        }

        await dbConnect();

        // FIX: Sanitize HTML → prevent XSS
        const safeTitle = sanitizeHtml(title.trim());
        const safeContent = sanitizeHtml(content.trim());

        // Emotion analysis (safe fail)
        let emotionResult = null;
        try {
            emotionResult = await analyzeEmotion(safeContent);
        } catch (err) {
            console.error("Emotion analysis error:", err);
            emotionResult = null;
        }

        // Optional: AI counselor advice (if requested)
        let counselorAdvice: string | null = null;
        if (includeCounselor) {
          try {
            const dominant = extractDominantEmotion(emotionResult?.raw ?? null);
            const label = dominant?.label ?? "neutral";
            counselorAdvice = await getCounselorAdvice(safeContent, label);
          } catch (err) {
            console.error("Counselor generation failed:", err);
            counselorAdvice = null;
          }
        }

        const newNote = new Note({
            author: session.user.id,
            title: safeTitle,
            content: safeContent,
            isPublic: !!isPublic,
          emotion: emotionResult?.raw ?? null,
          counselorAdvice: counselorAdvice ?? null,
        });

        await newNote.save();

        return NextResponse.json(
            { message: "Note created successfully!", note: newNote },
            { status: 201 }
        );

    } catch (error) {
        console.error("Failed to create note:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 }
        );
    }
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("author");
    const noteId = searchParams.get("id");
    const scope = (searchParams.get("scope") || "all").toLowerCase();
    const sortParam = (searchParams.get("sort") || "newest").toLowerCase();

    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");

    const limit =
      limitParam !== null && !Number.isNaN(Number(limitParam))
        ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50)
        : undefined;
    const skip =
      skipParam !== null && !Number.isNaN(Number(skipParam))
        ? Math.max(parseInt(skipParam, 10), 0)
        : 0;

    const sortQuery =
      sortParam === "popular"
        ? { likes: -1, createdAt: -1 }
        : { createdAt: -1 };

    // Helper: build aggregation pipeline to compute a popularity score
    const buildPopularityPipeline = (matchFilter: any) => {
      // popularity = note.likes + (responses.length * 2) + sum(response.likes) + sum(reply.likes)
      return [
        { $match: matchFilter },
        {
          $addFields: {
            responseCount: { $size: { $ifNull: ["$responses", []] } },
            responseLikesSum: {
              $reduce: {
                input: { $ifNull: ["$responses", []] },
                initialValue: 0,
                in: { $add: ["$$value", { $ifNull: ["$$this.likes", 0] }] },
              },
            },
            replyLikesSum: {
              $reduce: {
                input: { $ifNull: ["$responses", []] },
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $reduce: {
                        input: { $ifNull: ["$$this.replies", []] },
                        initialValue: 0,
                        in: { $add: ["$$value", { $ifNull: ["$$this.likes", 0] }] },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            popularity: {
              $add: [
                { $ifNull: ["$likes", 0] },
                { $multiply: ["$responseCount", 2] },
                { $ifNull: ["$responseLikesSum", 0] },
                { $ifNull: ["$replyLikesSum", 0] },
              ],
            },
          },
        },
        { $sort: { popularity: -1, createdAt: -1 } },
      ];
    };

    await dbConnect();
    await User;

    let notes;
    let hasMore = false;

    // Validate authorId when provided to avoid invalid DB queries
    if (authorId && !mongoose.isValidObjectId(authorId)) {
      return NextResponse.json(
        { message: "Invalid author ID." },
        { status: 400 },
      );
    }

    if (scope === "following") {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { message: "Not authenticated." },
          { status: 401 },
        );
      }

      const viewer = await User.findById(session.user.id)
        .select("following")
        .lean();
      const followingIds = viewer?.following?.map((id: mongoose.Types.ObjectId) =>
        id.toString(),
      );

      if (!followingIds?.length) {
        return NextResponse.json({ notes: [], hasMore: false }, { status: 200 });
      }

      const filter = { author: { $in: followingIds }, isPublic: true };
      if (sortParam === 'popular') {
        const pipeline = buildPopularityPipeline(filter);
        if (typeof skip === 'number' && skip > 0) pipeline.push({ $skip: skip });
        if (typeof limit === 'number') pipeline.push({ $limit: limit });
        pipeline.push({
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        });
        pipeline.push({ $unwind: { path: '$author', preserveNullAndEmptyArrays: true } });
        pipeline.push({
          $project: {
            responseCount: 1,
            popularity: 1,
            title: 1,
            content: 1,
            emotion: 1,
            isPublic: 1,
            likes: 1,
            likedBy: 1,
            responses: 1,
            createdAt: 1,
            updatedAt: 1,
            'author._id': 1,
            'author.username': 1,
            'author.displayName': 1,
            'author.image': 1,
          },
        });

        notes = await Note.aggregate(pipeline);
      } else {
        let query = Note.find(filter).sort(sortQuery).populate(
          "author",
          "username displayName image",
        );

        if (typeof limit === "number") {
          query = query.skip(skip).limit(limit);
        }

        notes = await query.lean();
      }

      if (typeof limit === "number") {
        const total = await Note.countDocuments(filter);
        hasMore = skip + notes.length < total;
      }

      // Sanitize notes before returning to client
      notes = Array.isArray(notes) ? notes.map(sanitizeNoteObject) : sanitizeNoteObject(notes);

      return NextResponse.json({ notes, hasMore }, { status: 200 });
    }

    if (authorId) {
      const filter = { author: authorId, isPublic: true };
      if (sortParam === 'popular') {
        const pipeline = buildPopularityPipeline(filter);
        if (typeof skip === 'number' && skip > 0) pipeline.push({ $skip: skip });
        if (typeof limit === 'number') pipeline.push({ $limit: limit });
        pipeline.push({
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        });
        pipeline.push({ $unwind: { path: '$author', preserveNullAndEmptyArrays: true } });
        pipeline.push({
          $project: {
            responseCount: 1,
            popularity: 1,
            title: 1,
            content: 1,
            isPublic: 1,
            likes: 1,
            likedBy: 1,
            responses: 1,
            createdAt: 1,
            updatedAt: 1,
            'author._id': 1,
            'author.username': 1,
            'author.displayName': 1,
            'author.image': 1,
          },
        });

        notes = await Note.aggregate(pipeline);
      } else {
        let query = Note.find(filter)
          .sort(sortQuery)
          .populate("author", "username displayName image");

        if (typeof limit === "number") {
          query = query.skip(skip).limit(limit);
        }

        notes = await query.lean();
      }

      if (typeof limit === "number") {
        const total = await Note.countDocuments(filter);
        hasMore = skip + notes.length < total;
      }

      // Sanitize notes before returning to client
      notes = Array.isArray(notes) ? notes.map(sanitizeNoteObject) : sanitizeNoteObject(notes);

      return NextResponse.json({ notes, hasMore }, { status: 200 });
    }

    if (noteId) {
      if (!mongoose.isValidObjectId(noteId)) {
        return NextResponse.json(
          { message: "Invalid note ID." },
          { status: 400 },
        );
      }

      const note = await Note.findById(noteId)
        .populate("author", "username displayName image")
        .lean();

      if (!note) {
        return NextResponse.json(
          { message: "Note not found." },
          { status: 404 },
        );
      }

      // Sanitize single note before returning
      const safeNote = sanitizeNoteObject(note);
      return NextResponse.json({ notes: safeNote }, { status: 200 });
    }

    const filter = { isPublic: true };
    if (sortParam === 'popular') {
      const pipeline = buildPopularityPipeline(filter);
      if (typeof skip === 'number' && skip > 0) pipeline.push({ $skip: skip });
      if (typeof limit === 'number') pipeline.push({ $limit: limit });
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      });
      pipeline.push({ $unwind: { path: '$author', preserveNullAndEmptyArrays: true } });
      pipeline.push({
        $project: {
          responseCount: 1,
          popularity: 1,
          title: 1,
          content: 1,
          emotion: 1,
          emotion: 1,
          isPublic: 1,
          likes: 1,
          likedBy: 1,
          responses: 1,
          createdAt: 1,
          updatedAt: 1,
          'author._id': 1,
          'author.username': 1,
          'author.displayName': 1,
          'author.image': 1,
        },
      });

      notes = await Note.aggregate(pipeline);
    } else {
      let query = Note.find(filter)
        .sort(sortQuery)
        .populate("author", "username displayName image");

      if (typeof limit === "number") {
        query = query.skip(skip).limit(limit);
      }

      notes = await query.lean();
    }

    if (typeof limit === "number") {
      const total = await Note.countDocuments(filter);
      hasMore = skip + notes.length < total;
    }

    // Sanitize notes before returning to client
    notes = Array.isArray(notes) ? notes.map(sanitizeNoteObject) : sanitizeNoteObject(notes);

    return NextResponse.json({ notes, hasMore }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
