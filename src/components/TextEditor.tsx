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
  Sparkles,
} from "lucide-react";

const LOCAL_DRAFT_KEY = "new-note-draft";

export default function TextEditor({ analyzeEmotion }: { analyzeEmotion?: (emotion: []) => void }) {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorFontFamily = "var(--font-inter), 'Inter', sans-serif";
  const editorMinHeight = focusMode ? "calc(100vh - 50vh)" : "60vh";
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [suggestingTitle, setSuggestingTitle] = useState(false);
  const [titleHint, setTitleHint] = useState<string | null>(null);
  const [showTitleBanner, setShowTitleBanner] = useState(false);
  const [showSuggestTooltip, setShowSuggestTooltip] = useState(false);
  const [includeCounselor, setIncludeCounselor] = useState(false);

  // Auto-scroll to counselor panel when advice arrives

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

  // auto-hide the "title suggestion" banner
  useEffect(() => {
    if (!showTitleBanner || !titleHint) return;
    const timer = setTimeout(() => setShowTitleBanner(false), 3000);
    return () => clearTimeout(timer);
  }, [showTitleBanner, titleHint]);

  useEffect(() => {
    // Only toggle the global focus-mode class on non-mobile viewports
    if (isMobile) {
      if (document.body.classList.contains("note-focus-mode")) {
        document.body.classList.remove("note-focus-mode");
      }
      return;
    }

    if (focusMode) {
      document.body.classList.add("note-focus-mode");
    } else {
      document.body.classList.remove("note-focus-mode");
    }
    return () => {
      document.body.classList.remove("note-focus-mode");
    };
  }, [focusMode, isMobile]);

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
    const handleResize = () => adjustTextareaHeight();
    if (typeof window === "undefined") return;
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [focusMode]);

  // Detect mobile viewport (Tailwind 'lg' breakpoint = 1024px)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile && focusMode) setFocusMode(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
        body: JSON.stringify({ title, content, isPublic, includeCounselor }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save the note.");
      }
      analyzeEmotion?.(data?.note?.emotion ?? []);

      // remove draft
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOCAL_DRAFT_KEY);
      }

      // Immediately navigate to the saved note detail
      if (data?.note) {
        const newId = String(data.note._id || data.note.id || "");
        if (newId) {
          router.push(`/note/${String(newId)}`);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestTitleSuggestion = async () => {
    if (suggestingTitle) return;
    if (!content.trim() || content.trim().length < 20) {
      setTitleHint("Write a bit more content before asking for a title.");
      setShowTitleBanner(true);
      return;
    }
    try {
      setSuggestingTitle(true);
      setTitleHint(null);
      setShowTitleBanner(false);
      const response = await fetch("/api/title-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch title suggestion.");
      }
      if (data?.suggestion) {
        setTitle(data.suggestion);
        setTitleHint("Suggested title applied.");
      } else {
        setTitleHint("No title suggestion returned. Try again.");
      }
      setShowTitleBanner(true);
    } catch (error: any) {
      setTitleHint(error?.message || "Unable to fetch title suggestion.");
      setShowTitleBanner(true);
    } finally {
      setSuggestingTitle(false);
    }
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
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

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-black">
        <Loader2 className="h-10 w-10 animate-spin" />
        <span>...</span>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    router.push("/auth");
    return null;
  }

  const visibilityAccents = {
    private: {
      button: "border-2",
      icon: "text-sky-300",
      active: "border-sky-400 shadow-[0_0_0_1px_rgba(14,165,233,0.45)]",
    },
    public: {
      button: "border-2",
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
    <div className={`${focusMode ? "max-w-none w-full p-0 " : ""} min-h-screen text-black`}>
      {focusMode && (
        <style>{`body.note-focus-mode aside, Header { display: none !important; }`}</style>
      )}

      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-6 w-6 text-black" />
        <h1 className="text-lg font-bold">New Note</h1>

        {/* Hide focus-mode toggle on mobile viewports */}
        {!isMobile && (
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
        )}
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
          <div className="flex items-center">
            <input
            id="title"
            name="title"
            type="text"
            className="
              block w-full bg-transparent
              px-0 py-2
              text-base font-semibold text-black
              border-none outline-none
            "
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
            <div
              className="relative ml-1"
              onMouseEnter={() => setShowSuggestTooltip(true)}
              onMouseLeave={() => setShowSuggestTooltip(false)}
            >
              <button
                type="button"
                onClick={requestTitleSuggestion}
                disabled={suggestingTitle || !content.trim()}
                className="inline-flex items-center gap-1 rounded-md  text-xs font-medium hover:bg-black/5 disabled:opacity-50 p-1 cursor-pointer"
                aria-label="Suggest a title"
              >
                {suggestingTitle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </button>
              {showSuggestTooltip && (
                <span className="absolute top-7 right-0 whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] text-white shadow transition-opacity">
                  Suggest title
                </span>
              )}
            </div>
          </div>

          <div
            className={`mb-1 text-xs transition-all text-gray-500 duration-700 ${
              showTitleBanner && titleHint
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            {titleHint ?? "."}
          </div>
        </div>

        <div
          className={`flex flex-col flex-1 rounded-2xl bg-transparent ${
            focusMode ? "mt-2" : ""
          }`}
        >
          <div className="sticky top-5 flex pb-6 min-h-10 items-center gap-2 text-black">
            {toolbarActions.map(({ action, icon: Icon, label, theme }) => (
              <button
                key={action}
                type="button"
                onClick={() => handleToolbarAction(action)}
                className={`inline-flex items-center gap-1 bg-white rounded-md border px-3 py-1.5 text-[11px] font-semibold cursor-pointer ${theme.button}`}
              >
                <Icon className={`h-4 w-4 ${theme.icon}`} />
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 text-gray-800">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                requestAnimationFrame(adjustTextareaHeight);
              }}
              onKeyDown={handleTextareaKeyDown}
              spellCheck={false}
              className="w-full overflow-none resize-none bg-transparent text-sm sm:text-base text-black outline-none focus:ring-0 leading-relaxed"
              style={{
                fontFamily: editorFontFamily,
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

        <div className="mb-5">
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCounselor}
                onChange={(e) => setIncludeCounselor(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-500" />
                Ask AI Counselor for advice
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-3 px-4 rounded-xl border border-black bg-transparent text-sm font-semibold text-black hover:bg-black/5 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-black" />}
              <span>{isLoading ? "Saving..." : "✨ Save & Analyze"}</span>
            </button>
          </div>
        </div>
        {/* 'View this note' and AI counselor UI moved to parent via `onSaved` callback */}
      </form>

      {/* AI Counselor removed from editor UI; new page will redirect immediately */}
    </div>
  );
}