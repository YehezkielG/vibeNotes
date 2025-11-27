"use client";

import { useState } from "react";
import { useMemo, useEffect } from "react";
import { MessageCircle, Heart, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { transformAvatar } from "@/lib/utils/image";
import { formatCreatedAt } from "@/lib/utils/notesLib";

interface ResponseProps {
  noteId: string;
  initialResponses: NoteResponse[];
  isPublic: boolean;
}

interface ResponseItemProps {
  response: NoteResponse;
  responseIndex: number;
  noteId: string;
  isPublic: boolean;
  onReplyAdded?: () => void;
}

function ResponseItem({ response, responseIndex, noteId, isPublic, onReplyAdded }: ResponseItemProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [localLikes, setLocalLikes] = useState(response.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLikeResponse = async () => {
    if (!isPublic || isLiking) return;

    setIsLiking(true);
    // optimistic toggle: if already liked, decrement, else increment
    const optimisticLikes = hasLiked ? Math.max(0, localLikes - 1) : localLikes + 1;
    setLocalLikes(optimisticLikes);

    try {
      const res = await fetch(`/api/notes/${noteId}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like-response", responseIndex }),
      });
      
      if (!res.ok) {
        setLocalLikes(localLikes);
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error === "Unauthorized") {
          console.warn("Like failed: unauthorized");
        } else {
          console.warn("Failed to like response", errorData.error || "");
        }
      } else {
        const data = await res.json();
        const resp = data.response;
        setLocalLikes(resp?.likes ?? localLikes);
        // normalize likedBy from server and decide if current user is in it
        const serverLikedBy: string[] = Array.isArray(resp?.likedBy) ? resp.likedBy.map((e: unknown) => (typeof e === 'string' ? e : String(e))) : [];
        setHasLiked(serverLikedBy.includes(currentUserId || ""));
      }
    } catch (error) {
      setLocalLikes(localLikes);
      console.warn("Error liking response:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-reply",
          responseIndex,
          replyText: replyText.trim(),
        }),
      });
      console.log("Add reply fetch result:", res);
      if (res.ok) {
        setReplyText("");
        setShowReplyBox(false);
        onReplyAdded?.();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn("Failed to add reply:", errorData.error || res.statusText || "Unknown");
      }
    } catch (error) {
      console.warn("Error adding reply:", error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Extract author info
  const authorObj = typeof response.author === "string" ? null : response.author as UserProfileType;
  const authorImage = authorObj?.image || "/default-profile.png";
  const authorUsername = authorObj?.username || "unknown";
  const authorDisplay = authorObj?.displayName || authorUsername || "Unknown";
  
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? (session?.user as Record<string, unknown>)?._id?.toString();
  const normalizedLikedBy = useMemo(
    () =>
      Array.isArray(response.likedBy)
        ? response.likedBy.map((entry) => {
            if (typeof entry === "string") return entry;
            const candidate = entry as { toString?: () => string } | undefined;
            return candidate?.toString ? candidate.toString() : "";
          })
        : [],
    [response.likedBy]
  );
  useEffect(() => {
    setHasLiked(normalizedLikedBy.includes(currentUserId || ""));
  }, [normalizedLikedBy, currentUserId]);

  return (
    <div className="border-l-2 border-gray-100 pl-4 py-3">
      {/* Author Info */}
      {authorObj && (
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/profile/${authorUsername}`} className="shrink-0">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <Image
                src={transformAvatar(authorImage, 32)}
                alt={authorUsername}
                width={24}
                height={24}
                className="object-cover w-full h-full"
              />
            </div>
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Link href={`/profile/${authorUsername}`} className="font-semibold hover:text-indigo-600">
              {authorDisplay}
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{formatCreatedAt(response.createdAt)}</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <p className="text-gray-700 text-sm leading-relaxed flex-1">{response.text}</p>
        {isPublic && (
          <button
            onClick={handleLikeResponse}
            disabled={isLiking}
            className={`shrink-0 flex items-center gap-1 transition-colors ${
              hasLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart size={14} className={localLikes > 0 || hasLiked ? "fill-red-500 text-red-500" : ""} />
            {localLikes > 0 && <span className="text-xs">{localLikes}</span>}
          </button>
        )}
      </div>

      {/* Replies */}
      {response.replies && response.replies.length > 0 && (
        <div className="mt-3 space-y-2 ml-4">
          {response.replies.map((reply, idx) => (
            <ReplyItem
              key={idx}
              reply={reply}
              replyIndex={idx}
              responseIndex={responseIndex}
              noteId={noteId}
              isPublic={isPublic}
            />
          ))}
        </div>
      )}

      {/* Reply Button & Reply Box */}
      {isPublic && (
        <div className="mt-2">
          {!showReplyBox ? (
            <button
              onClick={() => setShowReplyBox(true)}
              className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
            >
              <MessageCircle size={12} />
              Reply
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddReply();
                  }
                }}
              />
              <button
                onClick={handleAddReply}
                disabled={!replyText.trim() || isSubmittingReply}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
              <button
                onClick={() => {
                  setShowReplyBox(false);
                  setReplyText("");
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ReplyItemProps {
  reply: NoteResponseReply;
  replyIndex: number;
  responseIndex: number;
  noteId: string;
  isPublic: boolean;
}

function ReplyItem({ reply, replyIndex, responseIndex, noteId, isPublic }: ReplyItemProps) {
  const [localLikes, setLocalLikes] = useState(reply.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  // Extract author info
  const authorObj = typeof reply.author === "string" ? null : reply.author as UserProfileType;
  const authorImage = authorObj?.image || "/default-profile.png";
  const authorUsername = authorObj?.username || "unknown";
  const authorDisplay = authorObj?.displayName || authorUsername || "Unknown";
  
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? (session?.user as Record<string, unknown>)?._id?.toString();
  const normalizedLikedBy = useMemo(
    () =>
      Array.isArray(reply.likedBy)
        ? reply.likedBy.map((entry) => {
            if (typeof entry === "string") return entry;
            const candidate = entry as { toString?: () => string } | undefined;
            return candidate?.toString ? candidate.toString() : "";
          })
        : [],
    [reply.likedBy]
  );

  useEffect(() => {
    setHasLiked(normalizedLikedBy.includes(currentUserId || ""));
  }, [normalizedLikedBy, currentUserId]);

  const handleLikeReply = async () => {
    if (!isPublic || isLiking) return;

    setIsLiking(true);
    const optimisticLikes = hasLiked ? Math.max(0, localLikes - 1) : localLikes + 1;
    setLocalLikes(optimisticLikes);

    try {
      const res = await fetch(`/api/notes/${noteId}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "like-reply",
          responseIndex,
          replyIndex,
        }),
      });

      if (!res.ok) {
        setLocalLikes(localLikes);
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error === "Unauthorized") {
          console.warn("Like reply failed: unauthorized");
        } else {
          console.warn("Failed to like reply", errorData.error || "");
        }
      } else {
        const data = await res.json();
        const rep = data.reply;
        setLocalLikes(rep?.likes ?? localLikes);
        const serverLikedBy: string[] = Array.isArray(rep?.likedBy) ? rep.likedBy.map((e: unknown) => (typeof e === 'string' ? e : String(e))) : [];
        setHasLiked(serverLikedBy.includes(currentUserId || ""));
      }
    } catch (error) {
      setLocalLikes(localLikes);
      console.warn("Error liking reply:", error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-2">
      {/* Author Info */}
      {authorObj && (
        <div className="flex items-center gap-1.5 mb-1">
          <Link href={`/profile/${authorUsername}`} className="shrink-0">
            <div className="w-5 h-5 rounded-full overflow-hidden">
              <Image
                src={transformAvatar(authorImage, 24)}
                alt={authorUsername}
                width={20}
                height={20}
                className="object-cover w-full h-full"
              />
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Link href={`/profile/${authorUsername}`} className="font-semibold hover:text-indigo-600">
              {authorDisplay}
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{formatCreatedAt(reply.createdAt)}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between gap-2">
        <p className="text-gray-600 text-xs flex-1">{reply.text}</p>
        {isPublic && (
          <button
            onClick={handleLikeReply}
            disabled={isLiking}
            className={`shrink-0 flex items-center gap-1 transition-colors ${
              hasLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart size={12} className={localLikes > 0 || hasLiked ? "fill-red-500 text-red-500" : ""} />
            {localLikes > 0 && <span className="text-xs">{localLikes}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Response({ noteId, initialResponses, isPublic }: ResponseProps) {
  const { data: session } = useSession();
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localResponses, setLocalResponses] = useState<NoteResponse[]>(initialResponses);

  const handleAddResponse = async () => {
    if (!responseText.trim() || isSubmitting || !session?.user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: responseText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalResponses(data.note.responses);
        console.log("Add response fetch result:", data);
        setResponseText("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn("Failed to add response:", errorData.error || res.statusText || "Unknown");
      }
    } catch (error) {
      console.warn("Error adding response:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshResponses = async () => {
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (res.ok) {
        const data = await res.json();
        setLocalResponses(data.note.responses || []);
      }
    } catch (error) {
      console.warn("Error refreshing responses:", error);
    }
  };

  const sectionTitle = isPublic ? "Responses" : "Reflections";
  const placeholder = isPublic
    ? "Share your thoughts..."
    : "Write a reflection on this entry...";

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <MessageCircle size={20} className="text-gray-600" />
        {sectionTitle} ({localResponses.length})
      </h3>

      {/* Add Response Form */}
      {session?.user && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddResponse}
              disabled={!responseText.trim() || isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <Send size={14} />
              {isSubmitting ? "Posting..." : `Add ${isPublic ? "Response" : "Reflection"}`}
            </button>
          </div>
        </div>
      )}

      {/* Responses List */}
      <div className="space-y-4">
        {localResponses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No {sectionTitle.toLowerCase()} yet. Be the first to {isPublic ? "respond" : "reflect"}!
          </p>
        ) : (
          localResponses.map((response, idx) => (
            <ResponseItem
              key={idx}
              response={response}
              responseIndex={idx}
              noteId={noteId}
              isPublic={isPublic}
              onReplyAdded={refreshResponses}
            />
          ))
        )}
      </div>
    </section>
  );
}