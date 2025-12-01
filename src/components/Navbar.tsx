"use client";
import { Compass, NotebookText, Bell, ChartLine, PlusCircle, LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { transformAvatar } from "@/lib/utils/image";
import ThemeToggle from "./ThemeToggle";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

type ClientSessionUser = {
  username?: string | null;
  image?: string | null;
  displayName?: string | null;
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  // Local user state to reflect immediate updates when profile changes.
  const [localUser, setLocalUser] = useState<ClientSessionUser | null>(session?.user ?? null);

  // Keep localUser in sync with session and listen for manual updates.
  useEffect(() => setLocalUser(session?.user ?? null), [session?.user]);
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const { detail } = e as CustomEvent<ClientSessionUser | null>;
        if (detail) setLocalUser(detail);
      } catch {
        // ignore
      }
    };
    window.addEventListener("vibe:sessionUpdate", handler as EventListener);
    return () => window.removeEventListener("vibe:sessionUpdate", handler as EventListener);
  }, []);

  const pathname = usePathname();
  const shouldFetchUnread = Boolean(!isLoading && session?.user);
  const { data: unreadSummary } = useSWR(shouldFetchUnread ? "/api/notifications/unread" : null, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });
  const unreadCount = unreadSummary?.unreadCount ?? 0;
  const isOwnProfileView = !!(
    !isLoading &&
    session?.user?.username &&
    pathname &&
    pathname.startsWith(`/profile/${session.user.username}`)
  );
  // Restore compact icon styling (smaller, muted)
  const navItems = [
    {
      href: "/note/new",
      icon: <PlusCircle className="inline mr-3 text-gray-400" size={25} />,
      label: "New Note",
    },
    {
      href: "/",
      icon: <Compass className="inline mr-3 text-gray-400" size={25} />,
      label: "Explore",
    },
    {
      href: "/note/yours/private",
      icon: <NotebookText className="inline mr-3 text-gray-400" size={25} />,
      label: "Your Notes",
    },
    {
      href: "/notifications",
      icon: <Bell className="inline mr-3 text-gray-400" size={25} />,
      label: "Notifications",
    },
    {
      href: "/insight",
      icon: <ChartLine className="inline mr-3 text-gray-400" size={25} />,
      label: "Insight",
    },
  ];

  // removed dropdown logic; logout will be handled on the profile page

  const sessionUser = session?.user as ClientSessionUser | undefined;
  const resolvedUser = localUser ?? sessionUser ?? null;
  const profileImage = transformAvatar(
    resolvedUser?.image || "/default-profile.png",
    48
  );
  const resolvedUsername = resolvedUser?.username ?? sessionUser?.username ?? "";
  const fallbackUsername = resolvedUsername || session?.user?.username || "";

  // Mobile menu open 
  return (
    <nav className="w-full">
      {/* Mobile top bar (visible below lg). Show app name only on Home. */}
      <div className="lg:hidden sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
        {pathname === "/" && (
          <div className="flex items-center justify-between py-3 px-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={28} height={28} />
              <span className="font-bold text-lg dark:text-white">vibeNotes</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/notifications" aria-label="Notifications" className="relative text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 right-0 h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Desktop header + vertical nav */}
      <div className="hidden lg:block">
        <div className="flex select-none my-5">
          <div className="w-48 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Notes App Logo"
                width={25}
                height={25}
              />
              <h1 className="font-bold text-xl dark:text-white">vibeNotes</h1>
            </div>
            <ThemeToggle />
            <ul className="text-lg font-medium flex flex-col w-full">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/" && pathname === "/") ||
                  (item.href.includes("/note/yours") &&
                    pathname.includes("/note/yours"));
                return (
                  <li className="py-2 w-full" key={item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 w-full ${
                        isActive
                          ? "text-black font-semibold dark:text-white"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                      }`}
                    >
                      <span className="relative inline-flex">
                        {item.icon}
                        {item.href === "/notifications" && unreadCount > 0 && (
                          <span className="absolute -top-1 right-0 h-2.5 w-2.5 rounded-full bg-red-500" />
                        )}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto w-full">
              {isLoading ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-full w-7 h-7 bg-gray-200 animate-pulse shrink-0" />
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ) : session?.user ? (
                <Link
                  href={`/profile/${fallbackUsername}`}
                  className="flex items-center gap-3 min-w-0 shrink-0"
                >
                  <div
                    className={`rounded-full overflow-hidden w-7 h-7 ring-2 ${
                      isOwnProfileView ? "ring-black" : "ring-gray-100"
                    } shrink-0`}
                  >
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={28}
                      height={28}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span
                    className={`block truncate max-w-40 ${
                      isOwnProfileView
                        ? "text-black font-semibold dark:text-white"
                        : "text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-100"
                    }`}
                    title={fallbackUsername}
                  >
                    {fallbackUsername}
                  </span>
                </Link>
              ) : (
                    <Link
                      href="/auth" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 w-full"
                    >
                      <LogIn size={18} />
                  <span>sign in</span>
                    </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}