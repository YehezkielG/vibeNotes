"use client";
import Image from "next/image";
import { transformAvatar } from "@/lib/utils/image";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import SuggestionsSkeleton from "@/components/skeletons/SuggestionsSkeleton";

type Suggestion = {
  _id: string;
  username: string;
  displayName: string;
  image?: string;
  isFollowing?: boolean;
};

export default function RightSidebar() {
  const { data: session, status } = useSession();
  // Sidebar no longer renders the avatar dropdown (moved to Navbar)
  const [suggestions, setSuggestions] = useState<{ newest: Suggestion[]; recent: Suggestion[] } | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Sidebar no longer manages a profile dropdown; avatar and profile actions moved to the Navbar.

  // Fetch follow suggestions (newest users + recent public authors)
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/suggestions`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setSuggestions({ newest: data.newest || [], recent: data.recent || [] });
      } catch (err) {
        console.warn("Failed to load suggestions", err);
      } finally {
        if (mounted) setLoadingSuggestions(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

    return <header className="flex items-center my-5">

      {/* Follow suggestions */}
      {loadingSuggestions ? (
        <SuggestionsSkeleton />
      ) : suggestions && (
        <aside className="px-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Suggested for you</h4>
          {/* Desktop/large: vertical list */}
          <div className="hidden lg:block">
            <div className="space-y-3">
              {[...suggestions.recent, ...suggestions.newest]
                .reduce((acc: Suggestion[], cur) => {
                  if (!acc.find((a) => a._id === cur._id)) acc.push(cur);
                  return acc;
                }, [])
                .slice(0, 5)
                .map((s) => (
                  <div key={s._id} className="flex items-center justify-between gap-3">
                    <Link href={`/profile/${s.username}`} className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                        <Image
                          src={transformAvatar(s.image || "/default-profile.png", 40)}
                          alt={s.username}
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="text-xs min-w-0">
                        <div className="font-semibold text-gray-800 truncate max-w-40" title={s.displayName}>{s.displayName}</div>
                        <div className="text-gray-500 truncate max-w-40" title={`@${s.username}`}>@{s.username}</div>
                      </div>
                    </Link>
                    <FollowButton username={s.username} initialFollowing={!!s.isFollowing} onToggle={(isFollowing) => {
                      setSuggestions((prev) => {
                        if (!prev) return prev;
                        const update = (arr: Suggestion[]) => arr.map(u => u._id === s._id ? { ...u, isFollowing } : u);
                        return { newest: update(prev.newest), recent: update(prev.recent) };
                      });
                    }} />
                  </div>
                ))}
            </div>
          </div>

          {/* Mobile: card grid */}
          <div className={`block lg:hidden w-[360px] `}>
            <div className="flex items-center gap-3 overflow-x-auto overflow-y-hidden">
              {[...suggestions.recent, ...suggestions.newest]
                .reduce((acc: Suggestion[], cur) => {
                  if (!acc.find((a) => a._id === cur._id)) acc.push(cur);
                  return acc;
                }, [])
                .slice(0, 6)
                .map((s) => (
                  <div key={s._id} className="inline-block bg-white w-[150px] rounded-lg  p-4 text-center h-full hover:shadow-md transition-shadow">
                    <Link href={`/profile/${s.username}`} className="flex flex-col items-center w-full">
                      <div className="w-20 h-20 rounded-full overflow-hidden shrink-0">
                        <Image
                          src={transformAvatar(s.image || "/default-profile.png", 96)}
                          alt={s.username}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="mt-2 text-sm font-semibold text-gray-800 truncate max-w-full" title={s.displayName}>{s.displayName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-full mb-2">@{s.username}</div>
                    </Link>
                    <div className="w-full mt-auto">
                      <FollowButton username={s.username} initialFollowing={!!s.isFollowing} onToggle={(isFollowing) => {
                        setSuggestions((prev) => {
                          if (!prev) return prev;
                          const update = (arr: Suggestion[]) => arr.map(u => u._id === s._id ? { ...u, isFollowing } : u);
                          return { newest: update(prev.newest), recent: update(prev.recent) };
                        });
                      }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      )}
    </header>
}

function FollowButton({ username, initialFollowing, onToggle }: { username: string; initialFollowing?: boolean; onToggle?: (v: boolean) => void }) {
  const [isFollowing, setIsFollowing] = useState<boolean>(!!initialFollowing);
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/profile/${username}/follow`, { method });
      if (!res.ok) throw new Error("Failed");
      setIsFollowing(!isFollowing);
      onToggle?.(!isFollowing);
    } catch (err) {
      console.warn("Follow toggle failed", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full lg:w-auto text-xs font-medium px-3 py-1 rounded-lg ${isFollowing ? 'bg-gray-300/30 text-gray-800' : 'bg-indigo-600 text-white'}`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}