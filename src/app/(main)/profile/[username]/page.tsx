"use client";

import { useEffect, useState, useRef } from "react";
import { MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { transformAvatar } from "@/lib/utils/image";
import LogoutModal from "@/components/LogoutModal";
import ListNote from "@/components/ListNotes";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";
import AvatarUpload from "@/components/AvatarUpload";

type ProfileStats = { followers: number; following: number; publicNotes: number };

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const username = params.username as string;

  const [user, setUser] = useState<UserProfileType | null>(null);
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    followers: 0,
    following: 0,
    publicNotes: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followPending, setFollowPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ username: "", displayName: "", bio: "", image: "" });
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const userRes = await fetch(`/api/profile/${username}`);
        if (!userRes.ok) {
          throw new Error("User not found");
        }
        const userData = await userRes.json();
        setUser(userData.user);
        setStats(
          userData.stats ?? { followers: 0, following: 0, publicNotes: 0 },
        );
        setIsFollowing(userData.isFollowing ?? false);
        setIsOwnProfile(userData.isOwnProfile ?? false);

        // Fetch user's public notes
        const notesRes = await fetch(
          `/api/notes?scope=public&author=${userData.user._id}`,
        );
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(notesData.notes ?? []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadProfile();
    }
  }, [username]);

  // Close modal on Escape key
  useEffect(() => {
    if (!showEdit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEdit(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showEdit]);

  // close settings dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!showSettings) return;
      if (!settingsRef.current) return;
      const el = settingsRef.current as HTMLElement;
      if (e.target && el.contains(e.target as Node)) return;
      setShowSettings(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [showSettings]);

  const handleFollowToggle = async () => {
    if (!session?.user?.id) {
      router.push("/auth");
      return;
    }
    try {
      setFollowPending(true);
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/profile/${username}/follow`, { method });
      if (!res.ok) {
        if (res.status === 401) router.push("/auth");
        return;
      }
      const data = await res.json();
      setIsFollowing(data.isFollowing ?? false);
      if (data.stats) setStats(data.stats);
    } finally {
      setFollowPending(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton noteCount={3} />;
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">{error || "User not found."}</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className=" rounded-xl ">
          <div className="flex items-start gap-4">
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shrink-0`}>
              <Image
                src={transformAvatar(user.image || "/default-profile.png",80)}
                alt="Profile Picture"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="ml-2 md:ml-4 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold truncate text-black">{user.displayName}</h1>
                  <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                </div>
                <div className="ml-auto flex items-center gap-3 relative">
                  {!isOwnProfile && session ? (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followPending}
                      className="rounded-full px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {followPending ? "..." : isFollowing ? "Following" : "Follow"}
                    </button>
                  ) : (
                    <div className="relative">
                      <button
                        aria-label="Profile settings"
                        onClick={() => setShowSettings((s) => !s)}
                        ref={settingsRef}
                        className="p-2 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {showSettings && (
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-md border border-gray-200 py-1 z-50">
                          <button
                            onClick={() => {
                              setShowSettings(false);
                              setEditData({
                                username: user?.username ?? "",
                                displayName: user?.displayName ?? "",
                                bio: user?.bio ?? "",
                                image: user?.image ?? "",
                              });
                              setShowEdit(true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={() => {
                              setShowSettings(false);
                              setShowLogout(true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-6 text-sm text-gray-600">
                <span>
                  <strong>{stats.followers}</strong> Followers
                </span>
                <span>
                  <strong>{stats.following}</strong> Following
                </span>
                <span>
                  <strong>{stats.publicNotes}</strong> Notes
                </span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showEdit && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowEdit(false)}
              />

              <motion.div
                ref={modalRef}
                className="relative z-10 w-full max-w-md rounded-xl bg-white p-4 shadow-lg"
                initial={{ y: 30, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-3">Edit Profile</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSaving(true);
                    setError(null);
                    try {
                      const res = await fetch(`/api/profile/update`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(editData),
                      });

                      if (!res.ok) {
                        const err = await res.json().catch(() => null);
                        throw new Error(err?.message || "Failed to save profile");
                      }

                      const data = await res.json();
                      setUser(data.user ?? user);
                      // Broadcast updated user so other client components can update immediately
                      try {
                        window.dispatchEvent(new CustomEvent("vibe:sessionUpdate", { detail: data.user }));
                      } catch (e) {
                        // ignore in environments where CustomEvent isn't allowed
                      }
                      setShowEdit(false);
                      // Redirect to new username profile if username changed
                      if (data.user?.username && data.user.username !== username) {
                        router.push(`/profile/${data.user.username}`);
                      }
                    } catch (err: any) {
                      console.error(err);
                      setError(err.message || "An error occurred");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <div className="mb-4 flex justify-center">
                    <AvatarUpload
                      currentAvatar={transformAvatar(editData.image || user.image || "/default-profile.png",120)}
                      onAvatarChange={(url) => setEditData({ ...editData, image: url })}
                      showDefaultOption={false}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm text-gray-600">Username</label>
                    <input
                      value={editData.username}
                              onChange={(e) => setEditData({ ...editData, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="username"
                      minLength={3}
                      maxLength={30}
                    />
                    <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and underscores only</p>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm text-gray-600">Display name</label>
                    <input
                      value={editData.displayName}
                      onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-600">Bio</label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEdit(false)}
                      className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                  {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <LogoutModal
          open={showLogout}
          onClose={() => setShowLogout(false)}
          avatar={transformAvatar(user.image || "/default-profile.png", 80)}
          username={user.username}
          onConfirm={() => {
            // call next-auth signOut and redirect to home
            signOut({ callbackUrl: "/" });
          }}
        />
      </div>
      {user.bio && (
        <p className="text-sm text-gray-300 whitespace-pre-wrap mt-5">{user.bio}</p>
      )}
      <hr className="my-5"/>
      {/* Notes Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Public Notes ({notes.length})
        </h2>
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500">No public notes yet.</p>
        ) : (
          <div className="space-y-10 my-5">
            <ListNote notes={notes} />
          </div>
        )}
      </div>
    </div>
  );
}