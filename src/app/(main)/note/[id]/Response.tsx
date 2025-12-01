"use client";

import { useState } from "react";
import { useMemo, useEffect, useRef } from "react";
import { MessageCircle, Heart, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { transformAvatar } from "@/lib/utils/image";
import { formatCreatedAt } from "@/lib/utils/notesLib";

// helper to safely resolve id from different shapes (string, {id}, {_id}, ObjectId-like)
function resolveId(a: unknown): string | null {
  if (!a) return null;
  if (typeof a === "string" || typeof a === "number") return String(a);
  const obj = a as Record<string, unknown>;
  if ("id" in obj && (typeof obj.id === "string" || typeof obj.id === "number")) return String(obj.id);
  if ("_id" in obj) {
    const v = obj._id;
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (v) {
      const maybeToString = (v as { toString?: unknown }).toString;
      if (typeof maybeToString === "function") {
        return String((maybeToString as () => string).call(v));
      }
    }
  }
  return null;
}

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
  const replyRef = useRef<HTMLTextAreaElement | null>(null);
  const [localLikes, setLocalLikes] = useState(response.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const { data: session } = useSession();
  const serverIndex = typeof response.serverIndex === "number" ? response.serverIndex : responseIndex;
  const responseAnchorId = `response-${serverIndex}`;

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showContextMenu]);

  // When reply box opens, ensure textarea height is adjusted to its content
  useEffect(() => {
    if (showReplyBox && replyRef.current) {
      // allow DOM to update
      setTimeout(() => adjustReplyHeight(replyRef.current), 0);
    }
  }, [showReplyBox]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Check if user is the author (support author as object with `id` or `_id`, or string)
    const authorId = resolveId(response.author);
    const currentUserId = session?.user?.id ?? (session?.user as Record<string, unknown>)?._id?.toString();
    console.debug("contextmenu on response", { responseIndex, authorId, currentUserId });
    if (authorId && currentUserId && authorId === currentUserId) {
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }
  };

  const handleLongPressStart = (e: React.TouchEvent) => {
    const authorId = resolveId(response.author);
    const currentUserId = session?.user?.id ?? (session?.user as Record<string, unknown>)?._id?.toString();
    if (authorId && currentUserId && authorId === currentUserId) {
      longPressTimer.current = setTimeout(() => {
        const touch = e.touches[0];
        setContextMenuPos({ x: touch.clientX, y: touch.clientY });
        setShowContextMenu(true);
      }, 500);
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteResponse = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setShowContextMenu(false);
    
    try {
      console.debug("attempting delete response", { responseIndex, serverIndex, noteId });
      const res = await fetch(`/api/notes/${noteId}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-response", responseIndex: serverIndex }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn("delete response failed", errorData);
        alert(errorData.error || "Failed to delete response");
      } else {
        // API returns note with populated authors - use it directly
        onReplyAdded?.();
      }
    } catch (error) {
      console.warn("Error deleting response:", error);
      alert("Failed to delete response");
    } finally {
      setIsDeleting(false);
    }
  };

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
        body: JSON.stringify({ action: "like-response", responseIndex: serverIndex }),
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
          responseIndex: serverIndex,
          replyText: replyText.trim(),
        }),
      });
      console.log("Add reply fetch result:", res);
      if (res.ok) {
        setReplyText("");
        setShowReplyBox(false);
        if (replyRef.current) replyRef.current.style.height = "";
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

  const adjustReplyHeight = (el?: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    // add a small offset so the cursor isn't hidden
    el.style.height = `${el.scrollHeight}px`;
  };

  // Extract author info
  const authorObj = typeof response.author === "string" ? null : response.author as UserProfileType;
  const authorImage = authorObj?.image || "/default-profile.png";
  const authorUsername = authorObj?.username || "unknown";
  const authorDisplay = authorObj?.displayName || authorUsername || "Unknown";
  
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

  // Check if within 10-minute delete window
  const createdAt = response.createdAt ? new Date(response.createdAt) : new Date(0);
  const now = new Date();
  const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  const canDelete = minutesElapsed <= 10;

  return (
    <div 
      id={responseAnchorId}
      className="group border-l-2 border-variant pl-4 py-3 relative note-anchor"
      onContextMenu={handleContextMenu}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchMove={handleLongPressEnd}
    >
      {/* Context Menu */}
      {showContextMenu && canDelete && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-card border border-variant rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }}
        >
          <button
            onClick={handleDeleteResponse}
            disabled={isDeleting}
            className="w-full px-4 py-2 text-left text-sm text-red-600 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}

      {/* Author Info */}
      {authorObj && (
        <div className="flex items-center gap-2 mb-2">
          {isPublic ? (
            <Link href={`/profile/${authorUsername}`} className="shrink-0">
              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                <Image
                  src={transformAvatar(authorImage, 32)}
                  alt={authorUsername}
                  width={24}
                  height={24}
                  className="object-cover w-full h-full"
                />
              </div>
            </Link>
          ) : null}
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href={`/profile/${authorUsername}`} className="font-semibold hover:text-accent">
              {authorDisplay}
            </Link>
            <span className="text-muted">•</span>
            <span className="text-muted">{formatCreatedAt(response.createdAt)}</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <p className="text-foreground text-sm leading-relaxed flex-1" style={{ whiteSpace: "pre-wrap" }}>{response.text}</p>
        {isPublic && (
          <button
            onClick={handleLikeResponse}
            disabled={isLiking}
            className={`shrink-0 flex items-center gap-1 transition-colors ${
              hasLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart size={14} className={hasLiked ? "fill-red-500 text-red-500" : ""} />
            {localLikes > 0 && <span className="text-xs">{localLikes}</span>}
          </button>
        )}
      </div>

      {/* Replies */}
      {response.replies && response.replies.length > 0 && (
        <div className="mt-3 space-y-2 ml-4">
          {response.replies.map((reply, idx) => {
            const serverReplyIndex =
              typeof reply.serverReplyIndex === "number" ? reply.serverReplyIndex : idx;
            const replyKey = `response-${serverIndex}-reply-${serverReplyIndex}`;
            return (
              <ReplyItem
                key={replyKey}
                reply={reply}
                replyIndex={idx}
                responseIndex={responseIndex}
                parentServerIndex={serverIndex}
                noteId={noteId}
                isPublic={isPublic}
                onReplyAdded={onReplyAdded}
              />
            );
          })}
        </div>
      )}

      {/* Reply Button & Reply Box */}
      {isPublic && (
        <div className="mt-2">
          {!showReplyBox ? (
            <button
              onClick={() => setShowReplyBox(true)}
              className="text-xs text-muted hover:text-accent flex items-center gap-1"
            >
              <MessageCircle size={12} />
              Reply
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <textarea
                ref={replyRef}
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  adjustReplyHeight(e.target as HTMLTextAreaElement);
                }}
                placeholder="Write a reply..."
                rows={1}
                style={{ overflow: "hidden" }}
                className="flex-1 text-sm px-3 py-2 border border-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none bg-card text-foreground"
                onKeyDown={(e) => {
                  // Enter submits; Shift+Enter inserts a newline
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddReply();
                  }
                }}
              />
              <button
                onClick={handleAddReply}
                disabled={!replyText.trim() || isSubmittingReply}
                className="self-start px-3 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
              <button
                onClick={() => {
                  setShowReplyBox(false);
                  setReplyText("");
                }}
                aria-label="Cancel reply"
                className="self-start w-10 h-10 flex items-center justify-center text-muted hover:text-foreground"
              >
                <X size={16} />
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
  parentServerIndex: number;
  noteId: string;
  isPublic: boolean;
  onReplyAdded?: () => void;
}

function ReplyItem({ reply, replyIndex, responseIndex, parentServerIndex, noteId, isPublic, onReplyAdded }: ReplyItemProps) {
  const [localLikes, setLocalLikes] = useState(reply.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const { data: session } = useSession();
  
  // Extract author info
  const authorObj = typeof reply.author === "string" ? null : reply.author as UserProfileType;
  const authorImage = authorObj?.image || "/default-profile.png";
  const authorUsername = authorObj?.username || "unknown";
  const authorDisplay = authorObj?.displayName || authorUsername || "Unknown";
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

  const serverResponseIndex =
    typeof reply.serverResponseIndex === "number" ? reply.serverResponseIndex : parentServerIndex;
  const serverReplyIndex =
    typeof reply.serverReplyIndex === "number" ? reply.serverReplyIndex : replyIndex;
  const replyAnchorId = `response-${serverResponseIndex}-reply-${serverReplyIndex}`;

  useEffect(() => {
    setHasLiked(normalizedLikedBy.includes(currentUserId || ""));
  }, [normalizedLikedBy, currentUserId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showContextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const authorId = resolveId(reply.author);
    const currentUserId = session?.user?.id ?? (session?.user as Record<string, unknown>)?._id?.toString();
    console.debug("contextmenu on reply", { responseIndex, replyIndex, authorId, currentUserId });
    if (authorId && currentUserId && authorId === currentUserId) {
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }
  };

  const handleLongPressStart = (e: React.TouchEvent) => {
    const authorId = resolveId(reply.author);
    const currentUserId = session?.user?.id ?? (session?.user as Record<string, unknown>)?._id?.toString();
    console.debug("longpress start on reply", { responseIndex, replyIndex, authorId, currentUserId });
    if (authorId && currentUserId && authorId === currentUserId) {
      longPressTimer.current = setTimeout(() => {
        const touch = e.touches[0];
        setContextMenuPos({ x: touch.clientX, y: touch.clientY });
        setShowContextMenu(true);
      }, 500);
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteReply = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setShowContextMenu(false);
    
    try {
      console.debug("attempting delete reply", { responseIndex, replyIndex, serverResponseIndex, serverReplyIndex, noteId });
      const res = await fetch(`/api/notes/${noteId}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-reply", responseIndex: serverResponseIndex, replyIndex: serverReplyIndex }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to delete reply");
      } else {
        // Refresh only the responses list (do not reload whole page)
        onReplyAdded?.();
      }
    } catch (error) {
      console.warn("Error deleting reply:", error);
      alert("Failed to delete reply");
    } finally {
      setIsDeleting(false);
    }
  };

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
          responseIndex: serverResponseIndex,
          replyIndex: serverReplyIndex,
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

  // Check if within 10-minute delete window
  const createdAt = reply.createdAt ? new Date(reply.createdAt) : new Date(0);
  const now = new Date();
  const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  const canDelete = minutesElapsed <= 10;

  return (
    <div 
      id={replyAnchorId}
      className="group bg-gray-400/25 rounded-lg p-2 relative note-anchor"
      onContextMenu={handleContextMenu}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchMove={handleLongPressEnd}
    >
      {/* Context Menu */}
      {showContextMenu && canDelete && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-card border border-variant rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }}
        >
          <button
            onClick={handleDeleteReply}
            disabled={isDeleting}
            className="w-full px-4 py-2 text-left text-sm text-red-600 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}

      {/* Author Info */}
      {authorObj && (
        <div className="flex items-center gap-1.5 mb-1">
          {isPublic ? (
            <Link href={`/profile/${authorUsername}`} className="shrink-0">
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                <Image
                  src={transformAvatar(authorImage, 24)}
                  alt={authorUsername}
                  width={20}
                  height={20}
                  className="object-cover w-full h-full"
                />
              </div>
            </Link>
          ) : null}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Link href={`/profile/${authorUsername}`} className="font-semibold hover:text-accent">
              {authorDisplay}
            </Link>
            <span className="text-muted">•</span>
            <span className="text-muted">{formatCreatedAt(reply.createdAt)}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted text-sm flex-1" style={{ whiteSpace: "pre-wrap" }}>{reply.text}</p>
        {isPublic && (
          <button
            onClick={handleLikeReply}
            disabled={isLiking}
            className={`shrink-0 flex items-center gap-1 transition-colors ${
              hasLiked ? "text-red-500" : "text-muted hover:text-red-500"
            }`}
          >
            <Heart size={12} className={hasLiked ? "fill-red-500 text-red-500" : ""} />
            {localLikes > 0 && <span className="text-xs">{localLikes}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Response({ noteId, initialResponses = [], isPublic }: ResponseProps) {
  const { data: session } = useSession();
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localResponses, setLocalResponses] = useState<NoteResponse[]>(initialResponses ?? []);
  const responseRef = useRef<HTMLTextAreaElement | null>(null);

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
        const serverResponses = (data.note?.responses || []) as NoteResponse[];
        setLocalResponses(serverResponses);
        console.log("Add response fetch result:", data);
        setResponseText("");
        if (responseRef.current) responseRef.current.style.height = "";
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
        const serverResponses = (data.note?.responses || []) as NoteResponse[];
        setLocalResponses(serverResponses);
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
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <MessageCircle size={20} className="text-muted" />
        {sectionTitle} ({localResponses.length})
      </h3>

      {/* Add Response Form */}
      {session?.user && (
        <div className="mb-6 bg-card border border-variant rounded-lg p-4 shadow-sm">
          <textarea
            ref={responseRef}
            value={responseText}
            onChange={(e) => {
              setResponseText(e.target.value);
              // auto-grow
              const el = e.target as HTMLTextAreaElement;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            placeholder={placeholder}
            rows={1}
            style={{ overflow: "hidden" }}
                className="w-full px-3 py-2 border border-variant rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            onKeyDown={(e) => {
              // Enter submits; Shift+Enter inserts a newline
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddResponse();
              }
            }}
          />
            <div className="flex justify-end mt-2">
            <button
              onClick={handleAddResponse}
              disabled={!responseText.trim() || isSubmitting}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
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
          <p className="text-muted text-sm text-center py-8">
            No {sectionTitle.toLowerCase()} yet. Be the first to {isPublic ? "respond" : "reflect"}!
          </p>
        ) : (
          localResponses.map((response, idx) => {
              const serverIdx = typeof response.serverIndex === "number" ? response.serverIndex : idx;
              const respKey = `response-${serverIdx}-${String(response.createdAt ?? idx)}`;
              return (
                <ResponseItem
                  key={respKey}
                  response={response}
                  responseIndex={idx}
                  noteId={noteId}
                  isPublic={isPublic}
                  onReplyAdded={refreshResponses}
                />
              );
            })
        )}
      </div>
    </section>
  );
}