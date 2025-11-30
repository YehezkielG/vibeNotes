"use client";

import { X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Portal from "@/components/Portal";
import PrivateNoteCard from "@/components/PrivateNoteCard";
import PublicNoteCard from "@/components/PublicNoteCard";
import { normalizeNoteId } from "@/lib/utils/notesLib";

/* VeggieBurgerIcon removed — not used after refactor */

export default function ListNote({ notes,  }: { notes: NoteType[]; }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<NoteType[]>(notes ?? []);

  useEffect(() => {
    setLocalNotes(notes ?? []);
  }, [notes]);
  
  const items = localNotes;
  const isYourNotesRoute = Boolean(pathname?.includes("/note/yours/"));

  const handleDeleteClick = (noteIdRaw: string) => {
    setNoteToDelete(noteIdRaw);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    
    setDeletingId(noteToDelete);
    // Optimistic update
    setLocalNotes(prev => prev.filter(note => normalizeNoteId(note._id) !== noteToDelete));
    setShowDeleteModal(false);
    
    try {
      const res = await fetch(`/api/notes/${noteToDelete}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete note");
      }
      router.refresh();
    } catch (err: unknown) {
      // Revert optimistic update on error
      setLocalNotes(notes);
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg || "Failed to delete note");
    } finally {
      setDeletingId(null);
      setNoteToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  return (
    <>
      {/* Delete Confirmation Modal rendered to document.body via Portal */}
      {showDeleteModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleDeleteCancel}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Note?</h3>
                <button onClick={handleDeleteCancel} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this note? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={!!deletingId}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {items.map((note, index) => {
          // author may be id string or populated object
          const authorObj =
            typeof note.author === "string" || !note.author
              ? undefined
              : (note.author as UserProfileType);

          const normalizedId = normalizeNoteId(note._id);
          const key = normalizedId || `note-skeleton-${index}`;

          // Check if current user owns this note
          const isOwner = Boolean(session?.user?.id && authorObj?._id === session.user.id);
          
          // Determine if note is private
          const isPrivate = !note.isPublic;

          // Handlers untuk edit dan delete
          const handleEdit = () => {
            if (!normalizedId) return;
            router.push(`/note/${normalizedId}/edit`);
          };

          const handleDelete = () => {
            if (!normalizedId) return;
            handleDeleteClick(normalizedId);
          };

          return isPrivate ? (
            <PrivateNoteCard
              key={key}
              note={note}
              showMenu={isYourNotesRoute && isOwner}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <PublicNoteCard
              key={key}
              note={note}
              showMenu={isYourNotesRoute && isOwner}
              isOwner={isOwner}
              onEdit={handleEdit}
              onDelete={handleDelete}
              hideMeta={true}
              // If `showDominant` is undefined, preserve previous behavior (show dominant by default).
              hideDominant={false}
            />
          );
        })}
      </>
    );
}