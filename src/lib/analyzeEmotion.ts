import { franc } from "franc-min";
import 'server-only';

const TRANSLATOR_API = "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-mul-en";
const EMOTION_API ="https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli";

const HEADERS = {
    Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
    "Content-Type": "application/json",
};

function splitIntoSentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

async function translateToEnIfNeeded(sentence: string): Promise<{
    translated: string;
    lang: string;
}> {
    const langCode = franc(sentence || "");
    const isEnglish = langCode === "eng";

    if (isEnglish) {
        return { translated: sentence, lang: langCode };
    }

    const res = await fetch(TRANSLATOR_API, {
        headers: HEADERS,
        method: "POST",
        body: JSON.stringify({ inputs: sentence }),
    });

    const data = await res.json();
    const translated = data?.[0]?.translation_text || sentence;

    return { translated, lang: langCode };
}


export async function analyzeEmotion(text: string) {
     try {
        if (!text || typeof text !== "string") {
            return {
                error: "text must be a non-empty string",
                status: 400}
        }

        const sentences = splitIntoSentences(text);
        if (sentences.length === 0) {
            return {
                error: "text must contain at least one sentence",
                status: 400,
            }
        }

        const translatedParts = await Promise.all(
            sentences.map((s) => translateToEnIfNeeded(s)),
        );

        const normalizedText = translatedParts.map((p) => p.translated).join(" ");

        const emotionRes = await fetch(EMOTION_API, {
            headers: HEADERS,
            method: "POST",
            body: JSON.stringify({
                inputs: normalizedText,
                parameters: {
                    candidate_labels: ["Happy", "Sad", "Angry", "Love", "Anxiety", "Disgust", "Anger"],
                },
            }),
        });
        const emotionData = await emotionRes.json();
        console.log("Emotion analysis result:", emotionData);

        return {
            raw: emotionData,
        };
    } catch (error: any) {
        return { error: error.message };
    }
}