'use client';
import { Globe, NotebookText, Bell, Sparkles, Plus, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
    const pathname = usePathname();
    const navItems = [
        { href: '/note/new', icon: <Plus className="inline mr-3" size={20} />, label: 'New Note' },
        { href: '/', icon: <Globe className="inline mr-3" size={20} />, label: 'Explore' },
        { href: '/explore', icon: <NotebookText className="inline mr-3" size={20} />, label: 'Your Notes' },
        { href: '/notifications', icon: <Bell className="inline mr-3" size={20} />, label: 'Notifications' },
        { href: '/messages', icon: <Sparkles className="inline mr-3" size={20} />, label: 'Insight' },
        { href: '/profile', icon: <User className="inline mr-3" size={20} />, label: 'My Profile' },
    ];

    return (
        <nav className="block">
            <div className="container mx-auto">
                <ul className="text-gray-600 text-lg font-medium">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
                        return (
                            <li className={`p-3 rounded-xl ${isActive ? 'bg-gray-50' : ''}`} key={item.label}>
                                <Link
                                    href={item.href}
                                    className={`hover:text-gray-900 flex items-center`}
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
