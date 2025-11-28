"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ListNote from "@/components/ListNotes";
import NoteCardSkeleton from "@/components/skeletons/NoteCardSkeleton";

export default function YourNotesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const visibility = params.visibility as string;
  const searchQuery = searchParams.get("q") || "";

  const [notes, setNotes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true);

        if (searchQuery.trim()) {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(
              searchQuery
            )}&scope=yours&visibility=${visibility}`,
            { cache: "no-store" }
          );

          if (res.ok) {
            const data = await res.json();
            setNotes(data.notes ?? []);
          }
        } else {
          const res = await fetch(`/api/notes/yours/${visibility}`, {
            cache: "no-store",
          });

          if (res.ok) {
            const data = await res.json();
            setNotes(data.notes ?? []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (visibility) {
      fetchNotes();
    }
  }, [visibility, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-white/80 backdrop-blur animate-pulse">
          <div className="flex items-center justify-between mb-5">
            <div className="h-5 w-32 rounded bg-gray-200" />
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
          <NoteCardSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {notes.length === 0 ? (
        <p className="text-center text-sm text-gray-500">
          {searchQuery
            ? `No notes found for "${searchQuery}"`
            : "No notes yet."}
        </p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl bg-white/60 backdrop-blur space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Your Notes</h3>
              <span className="text-xs text-gray-500">
                {notes.length} items
              </span>
            </div>
            <div className="space-y-10">
              <ListNote notes={notes} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
