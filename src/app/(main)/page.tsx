"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ListNote from "@/components/ListNotes";
import NoteCardSkeleton from "@/components/skeletons/NoteCardSkeleton";
import SearchBar from "@/components/SearchBar";
import Image from "next/image";
import Link from "next/link";
import { normalizeNoteId } from "@/lib/utils/notesLib";

const TABS = [
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Popular" },
  { id: "following", label: "Following" },
] as const;

const PAGE_SIZE = 15;

function mergeNotes(prev: NoteType[], incoming: NoteType[], append: boolean) {
  if (!append) return incoming ?? [];
  const seen = new Set<string>();
  const merged: NoteType[] = [];
  [...prev, ...(incoming ?? [])].forEach((note) => {
    const id = normalizeNoteId(note?._id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    merged.push(note);
  });
  return merged;
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["id"]>("newest");
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    notes?: NoteType[];
    users?: UserProfileType[];
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchNotes = useCallback(
    async (skip: number, append: boolean) => {
      const params = new URLSearchParams();
      params.set("limit", PAGE_SIZE.toString());
      params.set("skip", skip.toString());

      if (activeTab === "following") {
        params.set("scope", "following");
        params.set("sort", "newest");
      } else {
        params.set("sort", activeTab);
      }

      const res = await fetch(`/api/notes?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        if (!append) {
          setNotes([]);
          setError("Sign in to see notes from people you follow.");
        }
        setHasMore(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to fetch notes.");
      }

      const data = await res.json();
      console.log("Fetched notes:", data);
      setNotes((prev) => mergeNotes(prev, data.notes ?? [], append));
      setHasMore(Boolean(data.hasMore));
    },
    [activeTab],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setHasMore(true);
        if (!cancelled) {
          await fetchNotes(0, false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load notes.");
          setNotes([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, fetchNotes]);

  useEffect(() => {
    const target = loaderRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && hasMore && !loading) {
          setLoadingMore(true);
          fetchNotes(notes.length, true)
            .catch((err: any) => {
              setError(err.message || "Failed to load more notes.");
              setHasMore(false);
            })
            .finally(() => {
              setLoadingMore(false);
            });
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNotes, hasMore, loading, loadingMore, notes.length]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=all`,
        { cache: "no-store" },
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="space-y-6">
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search users and notes..."
        className="mb-4"
      />

      {searchQuery && searchResults ? (
        <div className="space-y-6">
          {searchResults.users && searchResults.users.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-600">
                Users ({searchResults.users.length})
              </h2>
              <div className="space-y-4">
                {searchResults.users.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 rounded-xl border border-transparent bg-white/70 backdrop-blur transition-shadow">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={user.image || "/default-profile.png"}
                        alt={user.displayName}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {searchResults.notes && searchResults.notes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-600">
                Notes ({searchResults.notes.length})
              </h2>
              <div className="space-y-4">
                <ListNote notes={searchResults.notes} />
              </div>
            </div>
          )}

          {(!searchResults.notes?.length && !searchResults.users?.length) && (
            <p className="text-center text-sm text-gray-500">
              No results found for &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-gray-700 bg-gray-700 text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-700 hover:text-gray-700"
                  }`}
                  aria-pressed={active}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
                <NoteCardSkeleton count={4} />
              ) : error ? (
                <p className="text-sm text-gray-500">{error}</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-gray-500">No notes found.</p>
              ) : (
                <>
                  <div className="space-y-10">
                    <ListNote notes={notes} />
                  </div>
                  <div ref={loaderRef} className="w-full" />
                  {loadingMore && <NoteCardSkeleton count={3} />}
                  {!hasMore && (
                    <p className="text-center text-xs text-gray-400">
                      You’re all caught up.
                    </p>
                  )}
                </>
              )}
        </>
      )}
    </section>
  );
}
