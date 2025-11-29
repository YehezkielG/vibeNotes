import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import User, { IUser } from "@/models/User";
import { NextResponse } from "next/server";

async function findTarget(username: string) {
  return User.findOne({
    username: { $regex: `^${username}$`, $options: "i" },
  })
    .select("_id")
    .lean<IUser>()
    .exec();
}

function buildStats(doc: any) {
  return {
    followers: Array.isArray(doc.followers) ? doc.followers.length : 0,
    following: Array.isArray(doc.following) ? doc.following.length : 0,
  };
}

export async function POST(
  _request: Request,
  context: any,
) {
  const session = await auth();
  const { username } = await context.params;
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  await dbConnect();

  const viewerId = session.user.id;
  const target = await findTarget(username);
  console.log("Target user:", target);
  if (!target) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  if (target._id.toString() === viewerId) {
    return NextResponse.json(
      { message: "You cannot follow yourself." },
      { status: 400 },
    );
  }

   
    await User.findByIdAndUpdate(viewerId, {
      $addToSet: { following: target._id },
    });
    
    await User.findByIdAndUpdate(target._id, {
      $addToSet: { followers: viewerId },
    });

  const updatedTarget = await User.findById(target._id)
    .select("followers following")
    .lean()
    .exec();

  return NextResponse.json(
    {
      message: "Followed user.",
      isFollowing: true,
      stats: buildStats(updatedTarget),
    },
    { status: 200 },
  );
}

export async function DELETE(
  _request: Request,
  context: any,
) {
  const { username } = await context.params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  await dbConnect();

  const viewerId = session.user.id;
  const target = await findTarget(username);
  console.log("Target user:", target);

  if (!target) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  if (target._id.toString() === viewerId) {
    return NextResponse.json(
      { message: "You cannot unfollow yourself." },
      { status: 400 },
    );
  }

  await Promise.all([
    User.findByIdAndUpdate(viewerId, {
      $pull: { following: target._id },
    }),
    User.findByIdAndUpdate(target._id, {
      $pull: { followers: viewerId },
    }),
  ]);

  const updatedTarget = await User.findById(target._id)
    .select("followers following")
    .lean()
    .exec();

  return NextResponse.json(
    {
      message: "Unfollowed user.",
      isFollowing: false,
      stats: buildStats(updatedTarget),
    },
    { status: 200 },
  );
}
