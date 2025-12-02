import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/adminAuth";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";

type PopulatedAuthor = {
  _id: unknown;
  username?: string;
  displayName?: string;
  email?: string;
  image?: string;
};

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.response;
  }

  try {
    await dbConnect();

    const notes = await Note.find({ isPublic: true })
      .populate("author", "username displayName email image")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();

    return NextResponse.json(
      {
        notes: notes.map((note) => {
          const author = note.author as PopulatedAuthor | null;
          return {
            _id: String(note._id),
            title: note.title ?? "",
            content: note.content ?? "",
            emotion: note.emotion ?? "",
            isPublic: note.isPublic ?? false,
            createdAt: note.createdAt,
            author: author
              ? {
                  _id: String(author._id),
                  username: author.username ?? "",
                  displayName: author.displayName ?? "",
                  email: author.email ?? "",
                  image: author.image ?? "",
                }
              : null,
          };
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch notes for admin:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
