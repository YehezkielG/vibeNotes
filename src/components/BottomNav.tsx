"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Compass, ChartLine, NotebookText,PlusCircle, LogIn } from "lucide-react";
import { transformAvatar } from "@/lib/utils/image";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  // Local user to reflect immediate updates
  const [localUser, setLocalUser] = useState(session?.user ?? null);
  useEffect(() => setLocalUser(session?.user ?? null), [session?.user]);
  useEffect(() => {
    const handler = (e: Event) => setLocalUser((e as CustomEvent).detail ?? session?.user ?? null);
    window.addEventListener("vibe:sessionUpdate", handler as EventListener);
    return () => window.removeEventListener("vibe:sessionUpdate", handler as EventListener);
  }, [session?.user]);

  const items = [
    { href: "/", label: "Explore", icon: Compass },
    { href: "/note/new", label: "New Note", icon: PlusCircle },
    { href: "/note/yours/private", label: "Your Notes", icon: NotebookText }, // acts like Shop
    { href: "/insight", label: "Insight", icon: ChartLine }, // acts like Reels
  ];

  const isActive = (href: string) => pathname === href || (href === "/" && pathname === "/");

  const avatar = transformAvatar((localUser as any)?.image || session?.user?.image || "/default-profile.png", 64);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      <div className="mx-auto max-w-screen-sm">
        <ul className="flex items-center justify-between px-6 py-2">
          {items.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                className={`flex flex-col items-center gap-1 ${
                  isActive(href) ? "text-black" : "text-gray-600"
                }`}
              >
                <Icon size={22} />
              </Link>
            </li>
          ))}

          <li>
            {isLoading ? (
              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0 animate-pulse" />
            ) : session?.user ? (
              <Link
                href={`/profile/${(localUser as any)?.username ?? session.user.username}`}
                aria-label="Profil"
                className={`w-6 h-6 block rounded-full shrink-0 overflow-hidden ring-2 ${
                  pathname?.startsWith(`/profile/${session.user.username}`)
                    ? "ring-black"
                    : "ring-gray-100"
                }`}
              >
                <Image
                  src={avatar}
                  alt="Profile"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </Link>
            ) : (
              <Link href="/auth" className="inline-flex items-center gap-2 text-gray-700 text-sm">
                <LogIn size={16} />
                <span>sign in</span>
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
