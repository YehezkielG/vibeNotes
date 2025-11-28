import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";

type EmotionEntry = { label: string; score: number };
type EmotionDistribution = Record<string, number>;
type NoteEmotionDoc = { emotion?: EmotionEntry[] | Record<string, number> | null };

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count notes in the last 7 days, split by public/private
    const [publicCount, privateCount] = await Promise.all([
      Note.countDocuments({
        author: session.user.id,
        isPublic: true,
        createdAt: { $gte: sevenDaysAgo },
      }),
      Note.countDocuments({
        author: session.user.id,
        isPublic: false,
        createdAt: { $gte: sevenDaysAgo },
      }),
    ]);

    // Get emotion distribution for last 7 days - split by public/private
    const [publicNotes, privateNotes] = await Promise.all([
      (Note.find({
        author: session.user.id,
        isPublic: true,
        createdAt: { $gte: sevenDaysAgo },
      }).select("emotion").lean() as Promise<NoteEmotionDoc[]>),
      (Note.find({
        author: session.user.id,
        isPublic: false,
        createdAt: { $gte: sevenDaysAgo },
      }).select("emotion").lean() as Promise<NoteEmotionDoc[]>),
    ]);

    // Build public emotion distribution
    const publicEmotionDistribution: EmotionDistribution = {};
    (await publicNotes).forEach((note) => {
      const emotions = note.emotion;
      if (Array.isArray(emotions)) {
        emotions.forEach((emotion) => {
          publicEmotionDistribution[emotion.label] =
            (publicEmotionDistribution[emotion.label] || 0) + emotion.score;
        });
      } else if (emotions && typeof emotions === "object") {
        Object.entries(emotions).forEach(([label, score]) => {
          publicEmotionDistribution[label] =
            (publicEmotionDistribution[label] || 0) + (score as number);
        });
      }
    });

    // Build private emotion distribution
    const privateEmotionDistribution: EmotionDistribution = {};
    (await privateNotes).forEach((note) => {
      const emotions = note.emotion;
      if (Array.isArray(emotions)) {
        emotions.forEach((emotion) => {
          privateEmotionDistribution[emotion.label] =
            (privateEmotionDistribution[emotion.label] || 0) + emotion.score;
        });
      } else if (emotions && typeof emotions === "object") {
        Object.entries(emotions).forEach(([label, score]) => {
          privateEmotionDistribution[label] =
            (privateEmotionDistribution[label] || 0) + (score as number);
        });
      }
    });

    return NextResponse.json({
      publicCount,
      privateCount,
      publicEmotionDistribution,
      privateEmotionDistribution,
    });
  } catch (error) {
    console.error("Error analyzing notes:", error);
    return NextResponse.json(
      { error: "Failed to analyze notes" },
      { status: 500 }
    );
  }
}
