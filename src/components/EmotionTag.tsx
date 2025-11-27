"use client";

import { getEmojiForLabel, getLabelColor } from "@/lib/utils/emotionMapping";

interface EmotionTagProps {
  label: string;
  score?: number;
  variant?: "small" | "large" | "diary";
  className?: string;
}

export default function EmotionTag({ label, score, variant = "small", className = "" }: EmotionTagProps) {
  const color = getLabelColor(label);
  const emoji = getEmojiForLabel(label);

  if (variant === "diary") {
    return (
      <div 
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${className}`}
        style={{ 
          backgroundColor: `${color}15`,
          borderColor: `${color}30`,
          color: color
        }}
      >
        <span className="text-sm">{emoji}</span>
        <span className="font-medium capitalize">Mood: {label}</span>
      </div>
    );
  }

  if (variant === "large") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm border ${className}`}
        style={{
          backgroundColor: `${color}20`,
          borderColor: `${color}40`,
          color: color
        }}
      >
        <span className="text-lg">{emoji}</span>
        <span className="capitalize">{label}</span>
        {score !== undefined && (
          <span className="text-xs opacity-75">
            {(score * 100).toFixed(0)}%
          </span>
        )}
      </div>
    );
  }

  // Small variant (default)
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}
      style={{ backgroundColor: `${color}20` }}
    >
      <span>{emoji}</span>
      <span className="capitalize">{label}</span>
    </div>
  );
}
