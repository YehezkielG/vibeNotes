"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

type LikeButtonProps = {
  noteId: string;
  likes: number;
  likedBy?: (string | { toString(): string })[];
  className?: string;
};

export default function LikeButton({ noteId, likes, likedBy = [], className }: LikeButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState(likes);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const currentUser = session?.user?.id;
    if (!currentUser) {
      setIsLiked(false);
      return;
    }
    const likedIds = likedBy.map((id) => id?.toString?.() ?? "");
    setIsLiked(likedIds.includes(currentUser));
  }, [likedBy, session?.user?.id]);

  const toggleLike = async () => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }
    if (!session?.user?.id || pending) return;
    if (!noteId) {
      console.warn("Cannot toggle like without a valid note id");
      return;
    }

    try {
      setPending(true);
      const res = await fetch(`/api/notes/${noteId}/like`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to update like.");
      }
      const payload = await res.json();
      setIsLiked(payload.liked);
      setCount(payload.likes);
    } catch (error) {
      console.error("Like toggle failed:", error);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={pending}
      className={`inline-flex items-center gap-1 transition-colors ${
        isLiked ? "text-pink-600" : "dark:text-gray-100 text-gray-900"
      } ${className ?? ""}`}
    >
      <Heart size={16} className={isLiked ? "fill-current" : ""} />
      <span>{count}</span>
    </button>
  );
}
