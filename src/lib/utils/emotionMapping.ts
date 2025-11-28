// Data type for the 28 GoEmotion labels
export type GoEmotionLabel =
  | "admiration"
  | "amusement"
  | "anger"
  | "annoyance"
  | "approval"
  | "caring"
  | "confusion"
  | "curiosity"
  | "desire"
  | "disappointment"
  | "disapproval"
  | "disgust"
  | "embarrassment"
  | "excitement"
  | "fear"
  | "gratitude"
  | "grief"
  | "joy"
  | "love"
  | "nervousness"
  | "optimism"
  | "pride"
  | "realization"
  | "relief"
  | "remorse"
  | "sadness"
  | "surprise"
  | "neutral";

export const getEmojiForLabel = (label: string): string => {
  const emotionMap: Record<string, string> = {
    // Positive / Constructive
    admiration: "✨", // Awe
    amusement: "🤭", // Amused
    approval: "👌", // Approval
    caring: "🤗", // Caring
    desire: "🔥", // Desire
    excitement: "🤩", // Excited
    gratitude: "🙏", // Grateful
    joy: "🌻", // Joy
    love: "❤️", // Love
    optimism: "🌅", // Optimistic
    pride: "🦁", // Proud
    relief: "🍃", // Relief

    // Negative / Intense
    anger: "😡", // Angry
    annoyance: "😑", // Annoyed
    disappointment: "😞", // Disappointed
    disapproval: "👎", // Disapproval
    disgust: "🤢", // Disgust
    embarrassment: "😳", // Embarrassed
    fear: "😨", // Afraid
    grief: "💔", // Grief
    nervousness: "😰", // Nervous
    remorse: "🥀", // Remorse
    sadness: "🌧️", // Sadness

    // Ambiguous / Cognitive
    confusion: "😵‍💫", // Confused
    curiosity: "🤔", // Curious
    realization: "💡", // Realization
    surprise: "😲", // Surprise
    neutral: "😶", // Neutral
  };

  // Fallback for unknown labels
  return emotionMap[label] || "🌀";
};

export const getLabelColor = (label: string): string => {
  // Colors tuned to the "vibe" of each GoEmotion label.
  // These provide visually distinct hues for charts and badges.
  const colorMap: Record<string, string> = {
    admiration: "#7C4DFF", // violet - awe / wonder
    amusement: "#FFB86B", // warm orange - playful
    anger: "#FF3D00", // strong red - intense anger
    annoyance: "#FF7043", // muted orange - irritation
    approval: "#00C853", // green - affirmative
    caring: "#FF6DAA", // soft pink - nurturing
    confusion: "#9E9E9E", // gray - unclear
    curiosity: "#4FC3F7", // sky blue - inquisitive
    desire: "#FF6D00", // deep orange - longing
    disappointment: "#6B7280", // cool gray - letdown
    disapproval: "#D32F2F", // deep red - rejection
    disgust: "#8D6E63", // brownish - aversion
    embarrassment: "#F48FB1", // blushing pink
    excitement: "#FF4081", // bright pink - exhilaration
    fear: "#7E57C2", // purple - uneasy / anxious
    gratitude: "#FFB74D", // warm gold - thankful
    grief: "#37474F", // very dark slate - heavy sorrow
    joy: "#FFD54F", // sunny yellow - happiness
    love: "#E91E63", // rosy red - affection
    nervousness: "#FFCA28", // amber - jittery
    optimism: "#00E676", // bright green - hopeful
    pride: "#FF8A65", // coral - confident
    realization: "#29B6F6", // bright blue - aha moment
    relief: "#66BB6A", // soft green - calm after stress
    remorse: "#8E24AA", // muted magenta - regretful
    sadness: "#1976D2", // deep blue - sorrow
    surprise: "#FFC107", // amber - startled
    neutral: "#9E9E9E", // neutral gray
  };

  return colorMap[label] || "#607D8B"; // fallback blue-gray
};

export const extractDominantEmotion = (
  emotion?: { label: string; score: number }[] | null
) => {
  if (!Array.isArray(emotion) || !emotion.length) return null;
  return emotion.reduce((best, current) =>
    current.score > best.score ? current : best
  );
};