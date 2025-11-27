import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import {
  validateOnboarding,
  validateUsername,
  validateBio,
  validateDisplayName,
} from "@/lib/utils/validator";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ err: "Not authenticated." }, { status: 401 });
    }

    const userId = session.user.id;

    const { username, displayName, bio, image } = await request.json();

    // validate payload via centralized validators
    const validationError = validateOnboarding({
      username,
      displayName,
      bio,
    });
    if (validationError) {
      return NextResponse.json(
        {
          errInput: {
            username: validateUsername(username),
            displayName: validateDisplayName(displayName),
            bio: validateBio(bio),
          },
        },
        { status: 400 },
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({
      username: username,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already taken. Try another." },
        { status: 409 },
      );
    }

    // normalize displayName so UI greeting never shows a leading comma
    const normalizedDisplayName =
      typeof displayName === "string" && displayName.trim().length > 0
        ? displayName.trim()
        : username?.trim() || "User";

    await User.findByIdAndUpdate(userId, {
      $set: {
        username: username,
        displayName: normalizedDisplayName,
        name: normalizedDisplayName,
        bio: bio,
        image: image || session.user.image,
        isOnboarded: true,
        followers: [],
        following: [],
      },
    });

    return NextResponse.json(
      { message: "Profile saved successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Onboarding failed:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
