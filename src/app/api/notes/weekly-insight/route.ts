import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { generateWeeklyInsight } from "@/lib/ai-insight";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const insight = await generateWeeklyInsight(session.user.id);

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Error generating weekly insight:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}
