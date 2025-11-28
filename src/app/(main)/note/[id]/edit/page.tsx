"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FileText,
  Globe2,
  Lock,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { canEditNote } from "@/lib/utils/notesLib";
import EditNoteSkeleton from "@/components/skeletons/EditNoteSkeleton";

export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const noteId = params.id as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [createdAt, setCreatedAt] = useState<string>("");
  // removed visible remainingTime timer per UI request
  const [canEdit, setCanEdit] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorFontFamily = "var(--font-inter), 'Inter', sans-serif";
  const editorMinHeight = focusMode ? "calc(100vh - 320px)" : "60vh";
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch note data
  useEffect(() => {
    if (authStatus === "loading" || !noteId) return;
    if (authStatus === "unauthenticated") {
      router.push("/auth");
      return;
    }

    const fetchNote = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/notes/${noteId}`);
        if (!res.ok) throw new Error("Failed to fetch note");

        const data = await res.json();
        const note = data.note;

        // Check ownership
        if (note.author._id !== session?.user?.id) {
          setError("You can only edit your own notes");
          setTimeout(() => router.push("/note/yours/private"), 2000);
          return;
        }

        // Check edit window: only enforce 10-minute rule for public notes.
        if (note.isPublic) {
          if (!canEditNote(note.createdAt)) {
            setError("Edit window has expired (10 minutes)");
            setCanEdit(false);
            setTimeout(() => router.push("/note/yours/private"), 2000);
            return;
          }
        }

        setTitle(note.title);
        setContent(note.content);
        setIsPublic(note.isPublic);
        setCreatedAt(note.createdAt);
        setCanEdit(true);
      } catch (err: any) {
        setError(err.message || "Failed to load note");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId, authStatus, session, router]);

  // No visible countdown: keep server/client check for edit eligibility,
  // but do not show a live timer in the UI.

  useEffect(() => {
    if (focusMode) {
      document.body.classList.add("note-focus-mode");
    } else {
      document.body.classList.remove("note-focus-mode");
    }
    return () => {
      document.body.classList.remove("note-focus-mode");
    };
  }, [focusMode]);

  const adjustTextareaHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const viewport = typeof window !== "undefined" ? window.innerHeight : 0;
    const baseMinHeight = focusMode ? Math.max(viewport - 260, 320) : 420;
    const newHeight = Math.max(Math.min(ta.scrollHeight), baseMinHeight);
    ta.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, focusMode]);

  useEffect(() => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    undoTimeout.current = setTimeout(() => {
      setUndoStack((stack) => {
        if (stack.length === 0 || stack[stack.length - 1] !== content) {
          return [...stack, content];
        }
        return stack;
      });
    }, 600);
    return () => {
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
    };
  }, [content]);

  const handleUndo = () => {
    setUndoStack((stack) => {
      if (stack.length < 2) return stack;
      const newStack = stack.slice(0, -1);
      setContent(newStack[newStack.length - 1] || "");
      return newStack;
    });
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToolbarAction = async (action: string) => {
    switch (action) {
      case "undo":
        handleUndo();
        break;
      case "copy":
        if (!content) return;
        await navigator.clipboard?.writeText(content);
        break;
      case "clear":
        setContent("");
        setUndoStack([]);
        textareaRef.current?.focus();
        break;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canEdit) {
      setError("Edit window has expired");
      return;
    }

    setIsSaving(true);
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Title and content cannot be empty");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update note");
      }

      // Redirect immediately to the note detail after successful update
      router.push(`/note/${noteId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const insert = "        ";
      const nextValue =
        target.value.slice(0, start) + insert + target.value.slice(end);

      setContent(nextValue);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + insert.length;
        adjustTextareaHeight();
      });
    }
  };

  if (authStatus === "loading" || isLoading) {
    return <EditNoteSkeleton />;
  }

  if (error && !canEdit) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    );
  }

  const toolbarActions = [
    { action: "undo", icon: RotateCcw, label: "Undo" },
    { action: "copy", icon: Copy, label: "Copy" },
    { action: "clear", icon: Trash2, label: "Clear" },
  ];

  return (
    <div className={`${focusMode ? "max-w-none w-full p-0" : ""} min-h-screen`}>
      {focusMode && (
        <style>{`body.note-focus-mode aside, Header { display: none !important; }`}</style>
      )}

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <FileText className="h-6 w-6" />
        <h1 className="text-lg font-bold">Edit Note</h1>

        {/* Timer removed from UI per request; edit eligibility still enforced on load */}

        <button
          type="button"
          onClick={() => setFocusMode((s) => !s)}
          className="ml-auto inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-gray-100"
        >
          {focusMode ? (
            <>
              <Minimize2 className="h-4 w-4" />
              <span>Exit focus</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              <span>Focus mode</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="border-b border-gray-700 transition">
          <input
            id="title"
            type="text"
            className="block w-full bg-transparent px-0 py-2 text-base font-semibold border-none outline-none"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            required
          />
        </div>

        <div className={`flex flex-col flex-1 rounded-2xl bg-transparent ${focusMode ? "mt-2" : ""}`}>
          <div className="sticky top-0 flex flex-wrap pb-6 h-10 items-center gap-2 text-sm">
            {toolbarActions.map(({ action, icon: Icon, label }) => (
              <button
                key={action}
                type="button"
                onClick={() => handleToolbarAction(action)}
                disabled={!canEdit}
                className="inline-flex items-center gap-1 bg-white rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-3" />
          </div>

          <div className="flex-1 min-h-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                requestAnimationFrame(adjustTextareaHeight);
              }}
              onKeyDown={handleTextareaKeyDown}
              disabled={!canEdit}
              spellCheck={false}
              className="w-full overflow-none resize-none bg-transparent text-sm outline-none focus:ring-0 leading-relaxed disabled:opacity-50"
              style={{
                fontFamily: editorFontFamily,
                minHeight: editorMinHeight,
                transition: "height 120ms ease-in-out",
                backgroundClip: "padding-box",
                overflow: "none",
              }}
              placeholder="Write your note content here..."
              required
            />
          </div>
          <hr />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border">
            {isPublic ? (
              <>
                <Globe2 size={16} />
                <span>Public</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Private</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-500">Visibility cannot be changed</span>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="mb-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="py-3 px-4 rounded-xl border text-sm font-semibold hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-3 px-4 rounded-xl border bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={isSaving || !canEdit}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isSaving ? "Saving..." : "Update Note"}</span>
          </button>
        </div>
        {/* removed transient saved message; redirect happens immediately after save */}
      </form>
    </div>
  );
}
