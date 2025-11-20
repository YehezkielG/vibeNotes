"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FileText,
  Globe2,
  Lock,
  Loader2,
  Maximize2,
  Minimize2,
  Save,
  RotateCcw,
  Copy,
  Trash2,
} from "lucide-react";

const LOCAL_DRAFT_KEY = "new-note-draft";

export default function TextEditor({ analyzeEmotion }: { analyzeEmotion: (emotion: []) => void }) {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [fontSize, setFontSize] = useState("14px");
  const editorFontFamily = "var(--font-inter), 'Inter', sans-serif";
  const editorMinHeight = focusMode ? "calc(100vh - 320px)" : "60vh";
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(false);

  // load draft from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        title?: string;
        content?: string;
        isPublic?: boolean;
      };

      let restored = false;
      if (draft.title) {
        setTitle(draft.title);
        restored = true;
      }
      if (draft.content) {
        setContent(draft.content);
        restored = true;
      }
      if (typeof draft.isPublic === "boolean") {
        setIsPublic(draft.isPublic);
        restored = true;
      }
      if (restored) {
        setDraftRestored(true);
        // show the banner with animation
        setShowDraftBanner(true);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // auto-hide the "draft loaded" banner
  useEffect(() => {
    if (!showDraftBanner) return;
    const timer = setTimeout(() => setShowDraftBanner(false), 3000);
    return () => clearTimeout(timer);
  }, [showDraftBanner]);

  // auto-hide the "draft saved at" banner
  useEffect(() => {
    if (!showSavedBanner) return;
    const timer = setTimeout(() => setShowSavedBanner(false), 3000);
    return () => clearTimeout(timer);
  }, [showSavedBanner]);

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
  }, [content, fontSize, focusMode]);

  useEffect(() => {
    const handleResize = () => adjustTextareaHeight();
    if (typeof window === "undefined") return;
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [focusMode]);

  // Save a snapshot to the undo stack after user stops typing for 600ms
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

  const toolbarActions = [
    {
      action: "save",
      icon: Save,
      label: "Save draft",
      theme: {
        button: "border-black/60 text-black hover:border-black hover:text-gray-600",
        icon: "text-black",
      },
    },
    { action: "undo", icon: RotateCcw, label: "Undo", theme: { button: "border-black/60 text-black hover:border-black hover:text-gray-600", icon: "text-black" } },
    { action: "copy", icon: Copy, label: "Copy", theme: { button: "border-black/60 text-black hover:border-black hover:text-gray-600", icon: "text-black" } },
    { action: "clear", icon: Trash2, label: "Clear", theme: { button: "border-black/60 text-black hover:border-black hover:text-gray-600", icon: "text-black" } },
  ];

  // Undo handler shared by button and keyboard
  const handleUndo = () => {
    setUndoStack((stack) => {
      if (stack.length < 2) return stack;
      const newStack = stack.slice(0, -1);
      setContent(newStack[newStack.length - 1] || "");
      return newStack;
    });
    textareaRef.current?.focus();
  };

  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z)
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
      case "save":
        handleDraftSave();
        break;
      case "undo":
        handleUndo();
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

  const handleDraftSave = () => {
    if (typeof window === "undefined") return;
    const draft = { title, content, isPublic };
    window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
    const now = new Date();
    setDraftSavedAt(now);
    setShowSavedBanner(true);
  };

  const handleSubmit = async (
    e?: React.FormEvent | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e?.preventDefault();
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
      const data = await response.json();
      analyzeEmotion(data.note.emotion);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save the note.");
      }

      // remove draft after success
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOCAL_DRAFT_KEY);
      }

    //   router.push(`/profile/me`);
    //   router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  if (authStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-black">
        <Loader2 className="h-10 w-10 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    router.push("/auth");
    return null;
  }

  const visibilityAccents = {
    private: {
      button: "border-2 text-sky-100",
      icon: "text-sky-300",
      active: "border-sky-400 shadow-[0_0_0_1px_rgba(14,165,233,0.45)]",
    },
    public: {
      button: "border-2 text-fuchsia-100",
      icon: "text-fuchsia-300",
      active: "border-fuchsia-400 shadow-[0_0_0_1px_rgba(217,70,239,0.45)]",
    },
  };

  const visibilityOptions = [
    {
      value: false,
      label: "Private",
      helper: "Only you can view",
      icon: Lock,
      accent: visibilityAccents.private,
    },
    {
      value: true,
      label: "Public",
      helper: "Visible to everyone",
      icon: Globe2,
      accent: visibilityAccents.public,
    },
  ];

  return (
    <div className={`${focusMode ? "max-w-none w-full my-10 p-0 " : "mt-5"} min-h-screen text-black`}>
      {focusMode && (
        <style>{`body.note-focus-mode aside, Header { display: none !important; }`}</style>
      )}

      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-6 w-6 text-black" />
        <h1 className="text-lg font-bold">New Note</h1>

        <button
          type="button"
          aria-pressed={focusMode}
          onClick={() => setFocusMode((s) => !s)}
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-black/60 bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:border-black hover:text-gray-600 cursor-pointer"
        >
          {focusMode ? (
            <>
              <Minimize2 className="h-4 w-4 text-black" />
              <span>Exit focus</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 text-black" />
              <span>Focus mode</span>
            </>
          )}
        </button>
      </div>

      <div className="">
        {/* Animated “draft loaded” banner */}
      {draftRestored && (
        <span
          className={`mb-1 text-xs absolute text-gray-500 transition-all duration-700 ${
            showDraftBanner
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1 pointer-events-none"
          }`}
        >
          Draft loaded from your last session.
        </span>
      )}

      {/* Animated “draft saved at …” banner */}
      {draftSavedAt && (
        <span
          className={`mb-1 text-xs absolute text-gray-500 transition-all duration-700 ${
            showSavedBanner
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1 pointer-events-none"
          }`}
        >
          Draft saved at{" "}
          {draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
        </span>
      )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]"
      >
        <div className="border-b mt-5 border-gray-700 transition">
          <input
            id="title"
            name="title"
            type="text"
            className="
              block w-full bg-transparent
              px-0 py-2
              text-base font-semibold text-black
              placeholder:text-black/60
              border-none outline-none
            "
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div
          className={`flex flex-col flex-1 rounded-2xl bg-transparent ${
            focusMode ? "mt-2" : ""
          }`}
        >
          <div className="sticky top-0 flex flex-wrap pb-6 h-10 items-center gap-2 text-sm text-black">
            {toolbarActions.map(({ action, icon: Icon, label, theme }) => (
              <button
                key={action}
                type="button"
                onClick={() => handleToolbarAction(action)}
                className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer ${theme.button}`}
              >
                <Icon className={`h-4 w-4 ${theme.icon}`} />
                {label}
              </button>
              ))}
            <div className="ml-auto flex items-center gap-3">
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="rounded-md border px-3 py-1.5 text-xs font-semibold "
              >
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
              </select>
              <button
                type="button"
                onClick={() => setFocusMode((s) => !s)}
                className="rounded-md border border-black/60 p-2 text-black hover:border-black hover:text-gray-600 cursor-pointer"
              >
                {focusMode ? (
                  <Minimize2 className="h-4 w-4 text-black" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-black" />
                )}
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 text-gray-800  py-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                requestAnimationFrame(adjustTextareaHeight);
              }}
              spellCheck={false}
              className="w-full overflow-none resize-none bg-transparent text-sm text-black outline-none focus:ring-0 leading-relaxed
              "
              style={{
                fontFamily: editorFontFamily,
                fontSize,
                minHeight: editorMinHeight,
                transition: "height 120ms ease-in-out",
                backgroundClip: "padding-box", overflow:"none"
              }}
              placeholder="Write your note content here..."
              required
            />
          </div>
          <hr />
        </div>
        <div className="flex flex-wrap gap-3 ">
          {visibilityOptions.map(({ value, label, icon: Icon, accent }) => {
            const isActive = isPublic === value;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={isActive}
                onClick={() => setIsPublic(value)}
                className={`cursor-pointer rounded-2xl border px-2 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${accent.button} ${
                  isActive ? accent.active : "bg-transparent"
                }`}
              >
                <div className="flex text-gray-800  items-center gap-2">
                  <Icon className={`h-4 w-4 ${accent.icon}`} />
                  <span className="font-semibold">{label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-black text-sm">{error}</p>}

        <div className="mb-5 flex justify-end">
          <button
            type="submit"
            className="py-3 px-4 rounded-xl border border-black bg-transparent text-sm font-semibold text-black hover:bg-black/5 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-black" />}
            <span>{isLoading ? "Saving..." : "✨ Save & Analyze"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}