import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User, { IUser } from "@/models/User";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> | { username: string } },
) {
  try {
    const { username } = await context.params;
    
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
    .select("followers")
    .lean<IUser>()
    .exec();

    if (!userDoc) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 },
      );
    }

    const followerIds = Array.isArray(userDoc.followers) ? userDoc.followers : [];
    
    const followers = (await User.find({
      _id: { $in: followerIds },
    })
    .select("_id username displayName image")
    .lean()
    .exec()) as Array<{ _id: unknown; username?: string; displayName?: string; image?: string }>;

    return NextResponse.json(
      {
        followers: followers.map((f) => ({
          _id: String(f._id),
          username: f.username ?? "",
          displayName: f.displayName ?? f.username ?? "",
          image: f.image ?? "",
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch followers:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
