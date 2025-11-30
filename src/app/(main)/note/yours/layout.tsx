"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Globe } from "lucide-react";
import SearchBar from "@/components/SearchBar";

export default function YoursLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentIsPrivate = pathname.includes("/note/yours/private");

    const handleSearch = (query: string) => {
        const currentPath = pathname;
        if (query.trim()) {
            router.push(`${currentPath}?q=${encodeURIComponent(query)}`);
        } else {
            router.push(currentPath);
        }
    };

    const tabClass = (active: boolean) =>
        `rounded-full border px-4 py-1.5 text-sm gap-2 font-medium transition-colors flex items-center${
                    active
                      ? "border-black bg-gray-700 text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-700 hover:text-gray-700"
                  }`

    return (
        <div className="w-full min-h-svh">
            <SearchBar
                onSearch={handleSearch}
                placeholder="Search your notes by title, content, or date..."
                defaultValue={searchParams.get("q") || ""}
                className="mb-6"
            />
            
            <div className="gap-3 mb-6 flex items-center flex-wrap  text-sm text-gray-900">
                <Link href="/note/yours/private" className={tabClass(currentIsPrivate)}>
                    <Lock size={18} />
                    Private
                </Link>
                <Link href="/note/yours/public" className={tabClass(!currentIsPrivate)}>
                    <Globe size={18} />
                    Public
                </Link>
            </div>
            <div className="space-y-10">
            {children}</div>
        </div>
    );
}