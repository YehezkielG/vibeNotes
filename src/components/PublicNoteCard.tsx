"use client";

import { MessageCircle, Share2, Edit, Trash2, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { transformAvatar } from "@/lib/utils/image";
import {
  getEmojiForLabel,
  getLabelColor,
  extractDominantEmotion,
} from "@/lib/utils/emotionMapping";
import { formatCreatedAt, canEditNote } from "@/lib/utils/notesLib";
import LikeButton from "@/components/LikeButton";

interface PublicNoteCardProps {
  note: NoteType;
  showMenu?: boolean;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PublicNoteCard({
  note,
  showMenu,
  isOwner,
  onEdit,
  onDelete,
}: PublicNoteCardProps) {
  const [showActions, setShowActions] = useState(false);

  const dominant = extractDominantEmotion(note.emotion);
  const emotionLabel = dominant?.label.toLowerCase() ?? "";
  const badgeColor = getLabelColor(emotionLabel);
  const badgeIcon = getEmojiForLabel(emotionLabel);

  // Author info
  const authorObj =
    typeof note.author === "string" || !note.author
      ? undefined
      : (note.author as UserProfileType);

  const authorImage = authorObj?.image || "/default-profile.png";
  const authorUsername = authorObj?.username || "unknown";
  const authorDisplay =
    authorObj?.displayName || authorUsername || "Unknown Author";

  const likedBy = Array.isArray(note.likedBy)
    ? note.likedBy.map((val) => val?.toString?.() ?? "")
    : [];

  // Show full content (no truncation)

  const canEdit = canEditNote(note.createdAt);

  return (
    <article className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-5 transition-all hover:shadow-md hover:border-gray-300">
      {/* Header: Avatar + Author Info + Public Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${authorUsername}`} className="shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100">
              <Image
                src={transformAvatar(authorImage, 64)}
                alt={authorUsername}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
          </Link>
          <div className="flex flex-col">
            <Link
              href={`/profile/${authorUsername}`}
              className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
            >
              {authorDisplay}
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>@{authorUsername}</span>
              <span>•</span>
              <span>{formatCreatedAt(note.createdAt)}</span>
              <Globe size={14} className="text-gray-400 float-right" />
            </div>
          </div>
        </div>
        {dominant && (
          <div className="flex items-center">
            <div
              className="inline-flex items-center gap-2 rounded-full p-2 text-sm font-semibold shadow-sm border"
              style={{
                backgroundColor: `${badgeColor}20`,
                borderColor: `${badgeColor}40`,
                color: badgeColor,
              }}
            >
              <span className="">{badgeIcon}</span>
              <span className="">{dominant.label}</span>
              <span className="text-xs opacity-75">
                {(dominant.score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <Link href={`/note/${note._id}`} className="block group">
        <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
          {note.title || "(Untitled note)"}
        </h3>

        {/* Content Preview */}
        <p className="text-gray-700 whitespace-pre-wrap mb-3 leading-relaxed">
          {note.content}
        </p>
      </Link>

      {/* Action Menu - Only for owner */}
      {showMenu && isOwner && (
        <div className="absolute bottom-2 right-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowActions(!showActions);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="6" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 bottom-7 z-20 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                {canEdit && onEdit ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowActions(false);
                      onEdit();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit size={14} className="text-blue-600" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="w-full px-4 py-2 text-left text-sm text-gray-400 flex items-center gap-2">
                    <span>Edit expired</span>
                  </div>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowActions(false);
                      onDelete();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Action Buttons: Like, Comment, Share */}
      <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
        <LikeButton
          noteId={note._id}
          likes={note.likes ?? 0}
          likedBy={likedBy}
        />

        <button className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group">
          <MessageCircle
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-sm font-medium">{note.responses?.length || 0}</span>
        </button>

        <button className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group">
          <Share2
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>
    </article>
  );
}
