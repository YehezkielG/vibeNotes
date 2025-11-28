"use client";

import { Lock, Calendar, MessageCircle, Dot } from "lucide-react";
/* no client state needed for simplified card */
import Link from "next/link";
import { getEmojiForLabel, extractDominantEmotion } from "@/lib/utils/emotionMapping";

interface PrivateNoteCardProps {
  note: NoteType;
}

export default function PrivateNoteCard({ note }: PrivateNoteCardProps) {
  const dominant = extractDominantEmotion(note.emotion);
  const emotionLabel = dominant?.label.toLowerCase() ?? "";
  const moodEmoji = getEmojiForLabel(emotionLabel);

  // Format timestamp untuk diary style
  const createdDate = new Date(note.createdAt);
  const now = new Date();
  const isToday = createdDate.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === createdDate.toDateString();
  
  let timeDisplay = "";
  if (isToday) {
    timeDisplay = `Today at ${createdDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  } else if (isYesterday) {
    timeDisplay = `Yesterday at ${createdDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  } else {
    timeDisplay = createdDate.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: createdDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit"
    });
  }

  return (
    <article className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
      {/* Header dengan Lock Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Lock size={16} className="shrink-0 text-gray-400" />
          <span className="text-xs font-medium uppercase tracking-wide">Private Journal</span>
        </div>
        
        {/* Mood Tag (Small & Subtle) */}
        {dominant && (
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border"
            style={{ 
              backgroundColor: `#fafafa`,
              borderColor: `#ececec`,
              color: `#6b7280`
            }}
          >
            <span className="text-sm">{moodEmoji}</span>
            <span className="font-medium capitalize">Mood: {dominant.label}</span>
          </div>
        )}
      </div>

      {/* Title - Serif Font untuk Journal Feel */}
      <Link href={`/note/${note._id}`} className="block group">
        <h3 className="font-serif text-xl font-semibold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors">
          {note.title || "Untitled Entry"}
        </h3>

        {/* Content - Lebih personal, tidak truncate */}
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">
            {note.content}
          </p>
        </div>
      </Link>

      {/* Timestamp & Reflections Counter */}
      <div className="flex items-center mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <time dateTime={note.createdAt}>{timeDisplay}</time>
        </div>
        {note.responses && note.responses.length > 0 && (
          <>
            <Dot />
          <div className="flex items-center gap-1.5 text-gray-600">
            <MessageCircle size={14} className="text-gray-400" />
            <span className="text-xs font-medium">
              {note.responses.length} {note.responses.length === 1 ? 'Reflection' : 'Reflections'}
            </span>
          </div>
          </>
        )}
      </div>

      {/* AI Counselor preview (appear below emotion/timestamp) */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {((note as any)?.counselorAdvice as string | null) && (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const advice = ((note as any).counselorAdvice as string) || "";
        const short = advice.length > 160 ? advice.slice(0, 160) + "…" : advice;
        return (
          <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
            <div className="text-sm text-gray-800 italic mb-2">{short}</div>
            <div className="flex items-center justify-end">
              <Link href={`/note/${note._id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                View note
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Simplified: no edit/delete menu to keep entries feeling private and personal */}
    </article>
  );
}
