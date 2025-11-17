"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileText, Globe2, Lock, Loader2 } from "lucide-react";

export default function NewNotePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Title and content cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, isPublic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save the note.");
      }

      router.push(`/profile/me`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth");
    return null;
  }

  return (
    <div className="">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-blue-500" />
        <h1 className="text-lg font-bold">New Note</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title - cleaner input */}
        <div className="border-b border-gray-700 focus-within:border-blue-500 transition">
          <input
            id="title"
            name="title"
            type="text"
            className="
                            block w-full bg-transparent
                            px-0 py-2
                            text-base font-semibold text-gray-100
                            placeholder:text-gray-500
                            border-none outline-none
                        "
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Content - auto-resizing relative to text rows */}
          <div className="border border-gray-800/60  bg-black/5">
            <textarea
              id="content"
              name="content"
              className="
            block w-full h-[60vh]
            bg-transparent
            px-4 py-3
            text-sm font-mono
            placeholder:text-gray-600
            border-none outline-none
            leading-relaxed
            whitespace-pre-wrap
        "
              placeholder="Write your notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              // no auto-resize, just scroll
            />
          </div>

        {/* Public / private with icon */}
        <div className="flex items-center">
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-600"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <label
            htmlFor="isPublic"
            className="ml-3 flex items-center gap-1 text-sm text"
          >
            {isPublic ? (
              <>
                <Globe2 className="h-4 w-4 text-green-400" />
                <span>Make this note public</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-yellow-400" />
                <span>Keep this note private</span>
              </>
            )}
          </label>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLoading ? "Saving..." : "Save Note"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
