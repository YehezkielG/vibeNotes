import "server-only";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Note from "@/models/Note";
import { IUser } from "@/models/User";

export async function GET(
  _request: Request,
  context: any,
) {
  try {
    // `context.params` may be a Promise in some Next.js versions/environments;
    const { username, id } = await context.params;
    console.log(id);
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { message: "Username is required." },
        { status: 400 },
      );
    }

    await dbConnect();
    
      const userDoc = await User.findOne({
        username: { $regex: `^${username}$`, $options: "i" },
      })
      .select("_id username displayName bio image followers following")
      .lean<IUser>() // typed lean projection
      .exec();

    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    if (!userDoc) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 },
      );
    }

    const update: Record<string, unknown> = {};
    const hasFollowers = Array.isArray(userDoc.followers);
    const hasFollowing = Array.isArray(userDoc.following);

    if (!hasFollowers) update.followers = [];
    if (!hasFollowing) update.following = [];

    if (Object.keys(update).length > 0) {
      await User.updateOne({ _id: userDoc._id }, { $set: update });
    }

    const followersIds = hasFollowers
      ? userDoc.followers!.map((id) => id.toString())
      : [];
    const followingIds = hasFollowing
      ? userDoc.following!.map((id) => id.toString())
      : [];

    const ownerId = userDoc._id.toString();
    const isOwnProfile = viewerId === ownerId;
    const isFollowing =
      !isOwnProfile && viewerId ? followersIds.includes(viewerId) : false;

    const publicNotesCount = await Note.countDocuments({
      author: ownerId,
      isPublic: true,
    });

    return NextResponse.json(
      {
        user: {
          _id: ownerId,
          username: userDoc.username ?? "",
          displayName: userDoc.displayName ?? userDoc.username ?? "",
          bio: userDoc.bio ?? "",
          image: userDoc.image ?? "",
        },
        stats: {
          followers: followersIds.length,
          following: followingIds.length,
          publicNotes: publicNotesCount,
        },
        isFollowing,
        isOwnProfile,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
