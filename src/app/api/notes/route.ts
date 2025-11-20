import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Note from "@/models/Note";
import { analyzeEmotion } from "@/lib/analyzeEmotion";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
        }
        
        const userId = session.user.id;
        const { title, content, isPublic } = await request.json();

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json({ message: "Title is required." }, { status: 400 });
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ message: "Note content is required." }, { status: 400 });
        }

        await dbConnect();

        const emotionResult = await analyzeEmotion(content.trim());

        if(emotionResult.error){
            return NextResponse.json({ message: "Emotion analysis failed.", error: emotionResult.error }, { status: 500 });
        }

        const newNote = new Note({
            author: userId,
            title: title.trim(),
            content: content.trim(),
            isPublic: !!isPublic,
            emotion: emotionResult.raw,
            // Emotion can be added later, e.g., via an analysis function
        });

        await newNote.save();

        return NextResponse.json({ message: "Note created successfully!", note: newNote }, { status: 201 });

    } catch (error) {
        console.error("Failed to create note:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
