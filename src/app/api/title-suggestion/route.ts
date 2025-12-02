import "server-only";
import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length < 20) {
      return NextResponse.json(
        { message: "Please provide at least a few sentences of content." },
        { status: 400 }
      );
    }

    if (!process.env.HUGGINGFACE_TOKEN) {
      return NextResponse.json(
        { message: "Hugging Face token is not configured." },
        { status: 500 }
      );
    }

    const prompt = [
      "You are an assistant that writes concise, engaging note titles.",
      "Give exactly one title (maximum 12 words) for the content below.",
      "Respond with the title only—no punctuation beyond what's needed in the title.",
      "",
      "Content:",
      content.trim(),
    ].join("\n");
    const client = new InferenceClient(process.env.HUGGINGFACE_TOKEN);

    const chatCompletion = await client.chatCompletion({
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const payload = chatCompletion?.choices?.[0]?.message;
    console.log("Title suggestion payload:", payload.content);
    const responseText = payload.content || "";

    return NextResponse.json({ suggestion: responseText }, { status: 200 });
  } catch (err: unknown) {
    console.error("Title suggestion failed:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
