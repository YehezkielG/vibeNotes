'use client';
import { Globe, NotebookText, Bell, Sparkles, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { transformAvatar } from '@/lib/utils/image';

export default function Navbar() {
    const { data: session } = useSession();

    const pathname = usePathname();
    const isOwnProfileView = !!(
        session?.user?.username &&
        pathname &&
        pathname.startsWith(`/profile/${session.user.username}`)
    );
    // Restore compact icon styling (smaller, muted)
    const navItems = [
        { href: '/note/new', icon: <Plus className="inline mr-3 text-gray-400" size={25} />, label: 'New Note' },
        { href: '/', icon: <Globe className="inline mr-3 text-gray-400" size={25} />, label: 'Explore' },
        { href: '/note/yours/private', icon: <NotebookText className="inline mr-3 text-gray-400" size={25} />, label: 'Your Notes' },
        { href: '/notifications', icon: <Bell className="inline mr-3 text-gray-400" size={25} />, label: 'Notifications' },
        { href: '/messages', icon: <Sparkles className="inline mr-3 text-gray-400" size={25} />, label: 'Insight' },
    ];
    
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    const profileImage = transformAvatar(session?.user?.image || '/default-profile.png', 48);

    return (
        <nav>
            <div className="container mx-auto">
                <div className="flex select-none my-5">
                    {/* Left column: brand + vertical nav */}
                    <div className="w-48 flex flex-col items-start gap-4">
                        <div className="flex items-center gap-3">
                            <Image src="/logo.png" alt="Notes App Logo" width={25} height={25} />
                            <h1 className="font-bold text-xl">vibeNotes</h1>
                        </div>
                        <ul className="text-lg font-medium flex flex-col w-full">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href === '/' && pathname === '/') || (item.href.includes('/note/yours') && pathname.includes('/note/yours'));
                                return (
                                    <li className="py-2 w-full" key={item.label}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-2 w-full ${
                                                isActive
                                                    ? 'text-black font-semibold'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* User summary at bottom of left column */}
                        <div className="mt-auto w-full">
                            {session?.user ? (
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        onClick={() => setShowDropdown(v => !v)}
                                        className={`rounded-full overflow-hidden w-7 h-7 ring-2 ${isOwnProfileView ? 'ring-gray-600 ring-offset-white' : 'ring-gray-100'}`}
                                        aria-current={isOwnProfileView ? 'true' : undefined}
                                    >
                                        <Image src={profileImage} alt="Profile" width={28} height={28} className="object-cover w-full h-full" />
                                    </button>
                                    <Link href={`/profile/${session.user.username}`} className="text-sm font-medium text-gray-400 min-w-0">
                                        <span className={`block truncate max-w-40 ${isOwnProfileView ? 'text-black font-semibold' : 'text-gray-600 hover:text-black'}`} title={session.user?.username ?? ''}>{session.user?.username ?? ''}</span>
                                    </Link>
                                </div>
                            ) : (
                                <Link className="border-2 text-white bg-indigo-600 px-4 py-1 rounded-xl" href="/auth">Sign In</Link>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </nav>
    );
}
