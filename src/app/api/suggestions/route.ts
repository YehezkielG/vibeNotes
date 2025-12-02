import "server-only";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Note from "@/models/Note";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Try to get viewer to compute isFollowing flags (optional)
    let viewerId: string | null = null;
    try {
      const session = await auth();
      viewerId = session?.user?.id ?? null;
    } catch (e) {
      viewerId = null;
    }

    // Newest users — fetch a few candidates then filter out viewer
    const newest = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select("_id username displayName image createdAt")
      .lean()
      .exec();

    // Recent public notes → collect unique authors in order
    const recentNotes = await Note.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "_id username displayName image")
      .lean()
      .exec();

    const seen = new Set<string>();
    const recentAuthors: any[] = [];
    for (const n of recentNotes) {
      const a = (n as any).author;
      if (a && a._id) {
        const id = String(a._id);
        if (!seen.has(id)) {
          seen.add(id);
          recentAuthors.push({
            _id: id,
            username: a.username ?? "",
            displayName: a.displayName ?? a.username ?? "",
            image: a.image ?? "/default-profile.png",
            lastPostAt: n.createdAt,
          });
        }
      }
      if (recentAuthors.length >= 10) break;
    }

    // Annotate isFollowing for both lists
    let followingIds = new Set<string>();
    if (viewerId) {
      const viewer = await User.findById(viewerId).select("following").lean().exec();
      if (viewer && Array.isArray((viewer as any).following)) {
        for (const id of (viewer as any).following) followingIds.add(String(id));
      }
    }

    // Exclude the viewer themselves from suggestions
    const filterOutViewer = (arr: any[]) => arr.filter((u) => String(u._id) !== String(viewerId));

    const newestAnnotated = filterOutViewer(newest)
      .map((u: any) => ({
        _id: String(u._id),
        username: u.username ?? "",
        displayName: u.displayName ?? u.username ?? "",
        image: u.image ?? "/default-profile.png",
        createdAt: u.createdAt,
        isFollowing: followingIds.has(String(u._id)),
      }))
      .slice(0, 5);

    const recentAnnotated = filterOutViewer(recentAuthors)
      .map((u) => ({
        ...u,
        isFollowing: followingIds.has(String(u._id)),
      }))
      .slice(0, 5);

    return NextResponse.json({ newest: newestAnnotated, recent: recentAnnotated }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch suggestions:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
