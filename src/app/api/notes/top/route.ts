import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Convert userId to ObjectId
    const authorId = new mongoose.Types.ObjectId(session.user.id);

    // Aggregate popularity score similar to server pipeline
    const pipeline = [
      { $match: { author: authorId, isPublic: true } },
      {
        $addFields: {
          responseCount: { $size: { $ifNull: ["$responses", []] } },
          responseLikesSum: {
            $sum: {
              $map: {
                input: { $ifNull: ["$responses", []] },
                as: "r",
                in: { $ifNull: ["$$r.likes", 0] },
              },
            },
          },
          replyLikesSum: {
            $sum: {
              $map: {
                input: { $ifNull: ["$responses", []] },
                as: "r",
                in: {
                  $sum: {
                    $map: {
                      input: { $ifNull: ["$$r.replies", []] },
                      as: "p",
                      in: { $ifNull: ["$$p.likes", 0] },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          popularity: {
            $add: [
              { $ifNull: ["$likes", 0] },
              { $multiply: ["$responseCount", 2] },
              { $ifNull: ["$responseLikesSum", 0] },
              { $ifNull: ["$replyLikesSum", 0] },
            ],
          },
        },
      },
      { $sort: { popularity: -1, createdAt: -1 } },
      { $limit: 3 },
      {
        $project: {
          title: 1,
          content: 1,
          likes: 1,
          responses: 1,
          createdAt: 1,
          popularity: 1,
        },
      },
    ];

    const notes = await Note.aggregate(pipeline).exec();

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching top notes:", error);
    return NextResponse.json({ error: "Failed to fetch top notes" }, { status: 500 });
  }
}
