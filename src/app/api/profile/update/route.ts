import "server-only";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { validateUsername, validateDisplayName, validateBio } from "@/lib/utils/validator";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (session.user.isBanned) {
      return NextResponse.json({ message: "Account is banned." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { username, displayName, bio, image } = body ?? {};

    if (!username && !displayName && !bio && !image) {
      return NextResponse.json({ message: "No fields to update." }, { status: 400 });
    }

    await dbConnect();

    // Use centralized validators
    if (typeof username === "string" && username.trim()) {
      const err = validateUsername(username.trim());
      if (err) {
        return NextResponse.json({ message: err }, { status: 400 });
      }
      // check uniqueness
      const trimmedUsername = username.trim().toLowerCase();
      const existingUser = await User.findOne({ username: trimmedUsername }).lean();
      if (existingUser && existingUser._id.toString() !== session.user.id) {
        return NextResponse.json({ message: "Username is already taken" }, { status: 409 });
      }
    }

    if (typeof displayName === "string") {
      const err = validateDisplayName(displayName);
      if (err) return NextResponse.json({ message: err }, { status: 400 });
    }

    if (typeof bio === "string") {
      const err = validateBio(bio);
      if (err) return NextResponse.json({ message: err }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (typeof username === "string" && username.trim()) update.username = username.trim().toLowerCase();
    if (typeof displayName === "string") update.displayName = displayName;
    if (typeof bio === "string") update.bio = bio;
    if (typeof image === "string") update.image = image;

    const userDoc = await User.findByIdAndUpdate(
      session.user.id,
      { $set: update },
      { new: true, projection: { username: 1, displayName: 1, bio: 1, image: 1 } },
    ).lean();

    if (!userDoc) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user: userDoc }, { status: 200 });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
