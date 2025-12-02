import "server-only";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all"; // all, notes, users
    const scope = searchParams.get("scope") || "public"; // public, yours

    if (!query || query.length < 2) {
      return NextResponse.json(
        { message: "Query must be at least 2 characters." },
        { status: 400 },
      );
    }

    await dbConnect();

    const results: {
      notes?: any[];
      users?: any[];
    } = {};

    // Search for your own notes
    if (scope === "yours") {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { message: "Not authenticated." },
          { status: 401 },
        );
      }
      if (session.user.isBanned) {
        return NextResponse.json(
          { message: "Account is banned." },
          { status: 403 },
        );
      }

      const visibility = searchParams.get("visibility");
      const isPublic = visibility === "public";

      const noteFilter: any = {
        author: session.user.id,
        isPublic,
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
        ],
      };

      results.notes = await Note.find(noteFilter)
        .populate("author", "username displayName image")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      return NextResponse.json(results, { status: 200 });
    }

    // Search public notes
    if (type === "all" || type === "notes") {
      const noteFilter = {
        isPublic: true,
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
        ],
      };

      results.notes = await Note.find(noteFilter)
        .populate("author", "username displayName image")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }

    // Search users
    if (type === "all" || type === "users") {
      const userFilter = {
        $or: [
          { username: { $regex: query, $options: "i" } },
          { displayName: { $regex: query, $options: "i" } },
        ],
        isOnboarded: true,
      };

      results.users = await User.find(userFilter)
        .select("username displayName image bio")
        .limit(10)
        .lean();
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
