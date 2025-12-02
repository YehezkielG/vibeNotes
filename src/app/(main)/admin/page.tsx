"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, Ban, Search } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import Image from "next/image";
import { transformAvatar } from "@/lib/utils/image";
import Link from "next/link";
import Portal from "@/components/Portal";

type AdminNote = {
  _id: string;
  title: string;
  content: string;
  emotion: string;
  createdAt: string;
  author: {
    _id: string;
    username: string;
    displayName: string;
    email: string;
    image: string;
  } | null;
};

type AdminUser = {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  image: string;
  createdAt: string;
  isOnboarded: boolean;
  isBanned: boolean;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"notes" | "users">("notes");
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [banning, setBanning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "normal";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "normal",
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session?.user?.email || !isAdmin(session.user.email)) return;
    
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [notesRes, usersRes] = await Promise.all([
          fetch("/api/admin/notes"),
          fetch("/api/admin/users")
        ]);

        if (notesRes.ok) {
          const data = await notesRes.json();
          setNotes(data.notes ?? []);
        } else {
          console.error("Failed to load notes");
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users ?? []);
        } else {
          console.error("Failed to load users");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session]);

  const confirmAction = (title: string, message: string, onConfirm: () => void, type: "danger" | "normal" = "normal") => {
    setModalConfig({ isOpen: true, title, message, onConfirm, type });
  };

  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const handleDeleteNote = async (noteId: string) => {
    confirmAction(
      "Delete Note",
      "Are you sure you want to delete this note? This action cannot be undone.",
      async () => {
        setDeleting(noteId);
        closeModal();
        try {
          const res = await fetch(`/api/admin/notes/${noteId}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            throw new Error("Failed to delete note");
          }

          setNotes((prev) => prev.filter((n) => n._id !== noteId));
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to delete note");
        } finally {
          setDeleting(null);
        }
      },
      "danger"
    );
  };

  const formatDate = (dateVal?: string | number | Date | null) => {
    try {
      if (!dateVal) return "Unknown";
      const d = new Date(dateVal as any);
      if (isNaN(d.getTime())) return "Unknown";
      return d.toLocaleDateString();
    } catch (e) {
      return "Unknown";
    }
  };

  const handleDeleteUser = async (userId: string) => {
    confirmAction(
      "Delete User",
      "⚠️ WARNING: This will permanently delete the user and ALL their notes. This action cannot be undone. Are you sure?",
      async () => {
        setDeleting(userId);
        closeModal();
        try {
          const res = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            throw new Error("Failed to delete user");
          }

          setUsers((prev) => prev.filter((u) => u._id !== userId));
          // Also remove notes by this user from the list if any
          setNotes((prev) => prev.filter((n) => n.author?._id !== userId));
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to delete user");
        } finally {
          setDeleting(null);
        }
      },
      "danger"
    );
  };

  const handleBanUser = async (userId: string, currentStatus: boolean) => {
    confirmAction(
      currentStatus ? "Unban User" : "Ban User",
      currentStatus 
        ? "Are you sure you want to unban this user? They will regain access to their account."
        : "Are you sure you want to ban this user? They will lose access to their account immediately.",
      async () => {
        setBanning(userId);
        closeModal();
        try {
          const res = await fetch(`/api/admin/users/${userId}/ban`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isBanned: !currentStatus }),
          });

          if (!res.ok) {
            throw new Error("Failed to update ban status");
          }

          setUsers((prev) => prev.map((u) => 
            u._id === userId ? { ...u, isBanned: !currentStatus } : u
          ));
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to update ban status");
        } finally {
          setBanning(null);
        }
      },
      currentStatus ? "normal" : "danger"
    );
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.author?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.author?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-sm text-muted">Manage public notes and user accounts</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-card border border-variant rounded-lg focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-variant mb-6">
        <button
          onClick={() => { setActiveTab("notes"); setSearchQuery(""); }}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "notes"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Public Notes ({notes.length})
        </button>
        <button
          onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "users"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === "notes" && (
            <div className="space-y-4">
              {filteredNotes.length === 0 ? (
                <p className="text-sm text-muted text-center py-12">No public notes found</p>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note._id}
                    className="bg-card border border-variant rounded-lg p-4 hover:shadow-md transition-shadow relative group"
                  >
                    <div className="flex items-start gap-4">
                      <Link href={`/note/${note._id}`} className="flex-1 min-w-0 block">
                        <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-accent transition-colors">{note.title}</h3>
                        <p className="text-sm text-muted line-clamp-2 mb-2">{note.content}</p>
                        {note.author && (
                          <div className="flex items-center gap-2 text-xs text-muted">
                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                              <Image
                                src={transformAvatar(note.author.image || "/default-profile.png", 24)}
                                alt={note.author.displayName}
                                width={24}
                                height={24}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <span>@{note.author.username}</span>
                            <span>•</span>
                            <span>{note.author.email}</span>
                            <span>•</span>
                            <span>{formatDate(note.createdAt)}</span>
                          </div>
                        )}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note._id);
                        }}
                        disabled={deleting === note._id}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 z-10"
                        title="Delete note"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted text-center py-12">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`bg-card border border-variant rounded-lg p-4 hover:shadow-md transition-shadow relative group ${user.isBanned ? 'opacity-75 bg-red-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <Link href={`/profile/${user.username}`} className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                          <Image
                            src={transformAvatar(user.image || "/default-profile.png", 48)}
                            alt={user.displayName}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate group-hover:text-accent transition-colors">{user.displayName}</p>
                            {user.isBanned && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">BANNED</span>}
                          </div>
                          <p className="text-sm text-muted truncate">@{user.username}</p>
                          <p className="text-xs text-muted truncate">{user.email}</p>
                          <p className="text-xs text-muted mt-1">
                            Joined {formatDate(user.createdAt)}
                            {!user.isOnboarded && " • Not onboarded"}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBanUser(user._id, user.isBanned);
                          }}
                          disabled={banning === user._id}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            user.isBanned 
                              ? 'text-green-500 hover:bg-green-500/10' 
                              : 'text-orange-500 hover:bg-orange-500/10'
                          }`}
                          title={user.isBanned ? "Unban user" : "Ban user"}
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user._id);
                          }}
                          disabled={deleting === user._id}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete user and all their notes"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {modalConfig.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-variant rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <h3 className={`text-xl font-bold mb-2 ${modalConfig.type === 'danger' ? 'text-red-500' : 'text-foreground'}`}>
                {modalConfig.title}
              </h3>
              <p className="text-muted mb-6">{modalConfig.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg hover:bg-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={modalConfig.onConfirm}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    modalConfig.type === 'danger' 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-accent hover:bg-accent/90'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
