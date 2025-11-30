import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import User, { IUser } from "@/models/User";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/utils/notifications";

interface FollowRouteContext {
  params: {
    username: string;
  };
}

async function findTarget(username: string) {
  return User.findOne({
    username: { $regex: `^${username}$`, $options: "i" },
  })
    .select("_id")
    .lean<IUser>()
    .exec();
}

function buildStats(doc: Pick<IUser, "followers" | "following"> | null | undefined) {
  const followersCount = Array.isArray(doc?.followers) ? doc.followers.length : 0;
  const followingCount = Array.isArray(doc?.following) ? doc.following.length : 0;
  return {
    followers: followersCount,
    following: followingCount,
  };
}

export async function POST(
  _request: Request,
  context: FollowRouteContext,
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
  const alreadyFollowing = await User.exists({ _id: viewerId, following: target._id });

  await User.findByIdAndUpdate(viewerId, {
    $addToSet: { following: target._id },
  });

  await User.findByIdAndUpdate(target._id, {
    $addToSet: { followers: viewerId },
  });

  if (!alreadyFollowing) {
    const actorLabel = session.user.displayName ?? session.user.username ?? "Someone";
    await createNotification({
      actorId: viewerId,
      recipientId: target._id.toString(),
      type: "follow",
      targetUrl: session.user.username ? `/profile/${session.user.username}` : `/profile/${viewerId}`,
      message: `${actorLabel} started following you`,
      dedupe: true,
    });
  }

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
  context: FollowRouteContext,
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
