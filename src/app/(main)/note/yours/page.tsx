"use client";

import { useEffect, useState } from "react";

type Note = {
  _id: string;
  title?: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
};

export default function YourNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // asumsi: kamu akan buat GET /api/notes?scope=me nanti,
    // untuk sekarang bisa kosong atau mocked.
    async function load() {
      try {
        const res = await fetch("/api/notes?scope=me");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setNotes(data.notes ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading your notes...</p>;
  }

  if (!notes.length) {
    return <p className="text-sm text-gray-500">You have no notes yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold mb-2">Your Notes</h1>
      {notes.map((note) => (
        <article
          key={note._id}
          className="border border-gray-200 rounded-lg p-3 text-sm"
        >
          <h2 className="font-semibold mb-1">
            {note.title || "(Untitled note)"}
          </h2>
          <p className="line-clamp-3 whitespace-pre-wrap text-gray-700">
            {note.content}
          </p>
        </article>
      ))}
    </div>
  );
}
