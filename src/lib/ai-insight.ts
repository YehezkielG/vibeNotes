import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/mongoose';
import Note from '@/models/Note';

/**
 * Generates a weekly emotional insight summary for a user based on their recent notes.
 * Uses Gemini AI to analyze patterns and create a poetic reflection.
 * 
 * @param userId - The MongoDB user ID
 * @returns A short poetic summary in Indonesian (max 3 sentences)
 */
export async function generateWeeklyInsight(userId: string): Promise<string> {
  try {
    // Connect to database
    await dbConnect();

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch recent notes for the user
    const recentNotes = await Note.find({
      author: userId,
      createdAt: { $gte: sevenDaysAgo },
    })
      .select('content emotion createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Handle empty state
    if (!recentNotes || recentNotes.length === 0) {
      return 'No notes captured this week. Start writing to begin your reflection journey.';
    }

    // Initialize Gemini AI
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY is not set');
      return 'Weekly reflection is currently unavailable. Please try again later.';
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare notes data for the prompt
    const notesContext = recentNotes
      .map((note, idx) => {
        const emotionStr = note.emotion
          ? JSON.stringify(note.emotion)
          : 'not detected';
        return `[Note ${idx + 1}]
Date: ${new Date(note.createdAt).toLocaleDateString('en-US')}
Emotion: ${emotionStr}
Content: ${note.content.substring(0, 200)}...`;
      })
      .join('\n\n');

    // Construct the AI prompt
    const prompt = `You are "VibeCounselor", an analytical and poetic psychologist who uses nature metaphors to explain emotional patterns.

Task:
Analyze the following notes and create a summary of this week's emotional pattern in English. Use nature metaphors (like ocean, sky, forest, seasons) to describe the emotional journey. Create a warm, deep, and understanding tone.

Constraints:
- Maximum 3 sentences
- Use poetic yet accessible language
- Focus on emotional patterns, not specific details

User's Notes:
${notesContext}

Weekly Reflection:`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Return the generated insight
    return text.trim() || 'This week has been filled with unique shades of emotion.';
  } catch (error) {
    console.error('Error generating weekly insight:', error);
    return 'Weekly reflection cannot be generated at this time. Please try again later.';
  }
}
