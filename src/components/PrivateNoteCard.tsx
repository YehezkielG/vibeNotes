"use client";

import { Lock, Calendar, MessageCircle, Dot, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getEmojiForLabel, extractDominantEmotion, getLabelColor } from "@/lib/utils/emotionMapping";
import { normalizeNoteId } from "@/lib/utils/notesLib";

interface PrivateNoteCardProps {
  note: NoteType;
  showMenu?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PrivateNoteCard({ note, showMenu, onEdit, onDelete }: PrivateNoteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dominant = extractDominantEmotion(note.emotion);
  const emotionLabel = dominant?.label.toLowerCase() ?? "";
  const moodEmoji = getEmojiForLabel(emotionLabel);

  // Format timestamp untuk diary style
  const createdDate = new Date(note.createdAt);
  const now = new Date();
  const isToday = createdDate.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === createdDate.toDateString();
  const noteId = normalizeNoteId(note._id);
  
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
    <article className="relative rounded-2xl p-6 shadow-md dark:border-gray-600 border-gray-200 border bg-card transition-all hover:shadow-md">
      {/* Header dengan Lock Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Lock size={16} className="shrink-0 text-gray-400" />
          <span className="text-xs font-medium uppercase tracking-wide">Private Journal</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mood Tag (Small & Subtle) */}
          {dominant && (
            <div 
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border"
              style={{ backgroundColor: getLabelColor(dominant.label) + "33",
                borderColor: getLabelColor(dominant.label),
                color: getLabelColor(dominant.label)
              }}
            >
              <span className="text-sm">{moodEmoji}</span>
              <span className="font-medium capitalize">Mood: {dominant.label}</span>
            </div>
          )}

          {/* Action menu moved to header (top-right) */}
        </div>
      </div>

      {/* Title - Serif Font untuk Journal Feel */}
      <Link href={`/note/${noteId}`} className="block group">
        <h3 className="font-serif text-lg font-semibold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors">
          {note.title || "Untitled Entry"}
        </h3>

        {/* Content - Lebih personal, tidak truncate */}
        <div className="prose prose-sm max-w-none">
          <p className="text-base leading-relaxed whitespace-pre-wrap font-serif">
            {note.content}
          </p>
        </div>
      </Link>

      {/* Timestamp & Reflections Counter */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex items-center">
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
        <div className="absolute bottom-2 right-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="6" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-7 z-20 w-44 rounded-lg shadow-lg border border-variant bg-card py-1">
                {/* Private notes can always be edited by owner */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onEdit ? onEdit() : null;
                  }}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2"
                >
                  <Edit2 size={14} className="text-blue-600" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onDelete ? onDelete() : null;
                  }}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
