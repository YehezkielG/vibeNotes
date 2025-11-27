'use client';
import { Globe, NotebookText, Bell, Sparkles, Plus, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

export default function Navbar() {
    const { data: session } = useSession();

    const pathname = usePathname();
    const navItems = [
        { href: '/note/new', icon: <Plus className="inline mr-3" size={20} />, label: 'New Note' },
        { href: '/', icon: <Globe className="inline mr-3" size={20} />, label: 'Explore' },
        { href: '/note/yours/private', icon: <NotebookText className="inline mr-3" size={20} />, label: 'Your Notes' },
        { href: '/notifications', icon: <Bell className="inline mr-3" size={20} />, label: 'Notifications' },
        { href: '/messages', icon: <Sparkles className="inline mr-3" size={20} />, label: 'Insight' },
        { href: `/profile/${session?.user?.username}`, icon: <User className="inline mr-3" size={20} />, label: 'My Profile' },
    ];
    
    return (
        <nav className="">
            <div className="container mx-auto">
                      <div className="flex items-center space-x-3 my-5">
                        <Image src="/logo.png" alt="Notes App Logo" width={25} height={25} />
                        <h1 className="font-bold text-xl">vibeNotes</h1>
                    </div>
                <ul className="text-lg font-medium">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href === '/' && pathname === '/') || (item.href.includes('/note/yours') && pathname.includes('/note/yours'));
                        return (
                            <li className="py-3" key={item.label}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center ${
                                        isActive
                                            ? 'text-black font-semibold'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
