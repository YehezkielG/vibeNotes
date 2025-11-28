import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function getCounselorAdvice(text: string, emotion: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      ROLE: You are "VibeCounselor", a supportive friend who is wise, warm, and grounded.
  
  TASK: Provide a comforting response to the user's journal entry based on their emotion.

  CRITICAL INSTRUCTION (LANGUAGE):
  - **DETECT** the language used in the user's input text below.
  - **REPLY IN THE EXACT SAME LANGUAGE.**
  - If user writes in **Indonesian**, reply in **Indonesian** (Use natural, modern Indonesian, not stiff/formal).
  - If user writes in **English**, reply in **English**.

  TONE & STYLE:
  - **"Grounded Poetic":** Use simple nature metaphors (e.g., rain, sunrise, roots, wind) that are easy to understand.
  - **Avoid overly flowery or archaic language.** Do not sound like a Shakespearean poet or a difficult literature book.
  - Speak like a caring friend who is sitting right next to the user.
  - Validate their feelings first, then offer a gentle perspective.
  - Keep it short (max 2 sentences).

  INPUT DATA:
  - User Text: "${text}"
  - Detected Emotion: ${emotion}
  
  YOUR RESPONSE:
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Counselor Error:", error);
    return "Nature is silent, but it still listens to you."; // Fallback
  }
}
