"use client";
import { Compass, NotebookText, Bell, ChartLine, PlusCircle, LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import { transformAvatar } from "@/lib/utils/image";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  // Local user state to reflect immediate updates when profile changes.
  const [localUser, setLocalUser] = useState(session?.user ?? null);

  // Keep localUser in sync with session and listen for manual updates.
  useEffect(() => setLocalUser(session?.user ?? null), [session?.user]);
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (detail) setLocalUser(detail);
      } catch {
        // ignore
      }
    };
    window.addEventListener("vibe:sessionUpdate", handler as EventListener);
    return () => window.removeEventListener("vibe:sessionUpdate", handler as EventListener);
  }, []);

  const pathname = usePathname();
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

  const profileImage = transformAvatar(
    (localUser as any)?.image || session?.user?.image || "/default-profile.png",
    48
  );

  // Mobile menu open 

  const handleSearch = (q: string) => {
    // placeholder: integrate search navigation as needed
  };

  return (
    <nav className="w-full">
      {/* Mobile top bar (visible below lg). Show app name only on Home. */}
      <div className="lg:hidden sticky top-0 z-50 bg-white">
        {pathname === "/" && (
          <div className="flex items-center justify-between py-3 px-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={28} height={28} />
              <span className="font-bold text-lg">vibeNotes</span>
            </Link>
            <Link href="/notifications" aria-label="Notifications" className="text-gray-600 hover:text-gray-900">
              <Bell size={20} />
            </Link>
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
              <h1 className="font-bold text-xl">vibeNotes</h1>
            </div>
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
                          ? "text-black font-semibold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
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
                  href={`/profile/${(localUser as any)?.username ?? session.user.username}`}
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
                        ? "text-black font-semibold"
                        : "text-gray-600 hover:text-black"
                    }`}
                    title={(localUser as any)?.username ?? session?.user?.username ?? ""}
                  >
                    {(localUser as any)?.username ?? session?.user?.username ?? ""}
                  </span>
                </Link>
              ) : (
                    <Link
                      href="/auth" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full"
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