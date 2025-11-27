"use client";
import Image from "next/image";
import { transformAvatar } from "@/lib/utils/image";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User as UserIcon, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

export default function RightSidebar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileImageSrc = transformAvatar(session?.user?.image || "/default-profile.png", 80);
  const isImageLoading = loadedImageSrc !== profileImageSrc;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (!showDropdown) {
      return;
    }

    if(!session?.user?.isOnboarded){
      redirect('/onboarding');
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, session?.user?.isOnboarded]);

    return <header className="flex items-center justify-end my-5">
      <div className="relative flex items-center">
        {status === "loading" ? null : session ? (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="focus:outline-none"
            >
              <div className="relative w-10 h-10">
                {isImageLoading && (
                  <div className="w-10 h-10 rounded-full border-2 border-gray-300 animate-pulse bg-gray-200" />
                )}
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={transformAvatar(profileImageSrc,40)}
                    alt="Profile picture"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    onLoadingComplete={() => setLoadedImageSrc(profileImageSrc)}
                  />
                </div>
              </div>
            </button>
            {showDropdown && (
              <div className="absolute right-0 rounded-lg bg-white border border-gray-300 shadow-lg p-3 py-5">
                <div className="flex items-center justify-center mb-3">
                  <div className="relative">
                    {isImageLoading && (
                      <div className="w-12 h-12 rounded-full border-2 border-gray-300 animate-pulse bg-gray-200" />
                    )}
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={transformAvatar(profileImageSrc,50)}
                        alt="Profile picture"
                        width={50}
                        height={50}
                        className="object-cover w-full h-full"
                        onLoadingComplete={() => setLoadedImageSrc(profileImageSrc)}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="px-4 py-2 border-b mb-2 mx-2 text-center"
                  style={{
                    width: `${Math.max(
                      (session.user?.displayName?.length || 4) * 17,
                      160
                    )}px`,
                  }}
                >
                  <p className="font-semibold text-gray-700">
                    Hello, {session.user?.displayName || "User"}
                  </p>
                </div>
                <Link
                  href={`/profile/${session.user?.username}`}
                  className="flex items-center gap-2 hover:bg-gray-100 p-2"
                  onClick={() => setShowDropdown(false)}
                >
                  <UserIcon size={16} className="text-gray-600" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    signOut();
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <LogOut size={16} className="text-gray-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        
        ) : (
          <Link
            className="border-2 border-indigo-500 focus:bg-indigo-500 focus:text-black text-indigo-500 px-4 py-1 rounded-xl"
            href="/auth"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
}