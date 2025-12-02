import "server-only";
import { franc } from "franc-min";
import { getHfClient } from "@/lib/hf-client";

const TRANSLATOR_MODEL = "Helsinki-NLP/opus-mt-mul-en";
const EMOTION_MODEL = "bhadresh-savani/bert-base-go-emotion";


type TranslationResult =
  | { translation_text?: string }
  | { generated_text?: string }
  | string;

const hf = () => getHfClient();

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function translateToEnglish(sentence: string) {
  const langCode = franc(sentence || "");
  if (langCode === "eng") {
    return { translated: sentence, lang: langCode };
  }

  const response = await hf().translation({
    model: TRANSLATOR_MODEL,
    inputs: sentence,
  });

  const translated =
    Array.isArray(response)
      ? (response[0] as TranslationResult)?.translation_text ?? sentence
      : (response as TranslationResult)?.translation_text ?? sentence;

  return { translated, lang: langCode };
}

export async function analyzeEmotion(text: string) {
  const sentences = splitIntoSentences(text);
  if (!sentences.length) {
    return { error: "Text must contain at least one sentence." };
  }

  const translatedParts = await Promise.all(
    sentences.map((sentence) => translateToEnglish(sentence)),
  );


  const normalizedText = translatedParts.map((part) => part.translated).join(" ");
  const detectedLangs = Array.from(
    new Set(translatedParts.map((part) => part.lang ?? "und")),
  );

  const classification = await hf().textClassification({
    model: EMOTION_MODEL,
    inputs: normalizedText,
  });

  return {
    original_langs: detectedLangs,
    normalized_text: normalizedText,
    raw: classification,
  };
}