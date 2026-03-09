'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    FileText,
    CheckSquare,
    Target,
    Search,
    Bell,
    Clock,
    LogOut,
    Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserName(user.name || user.email.split('@')[0]);
            } catch (e) {
                // ignore
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const navItems = [
        { name: 'Timeline', href: '/feed', icon: Clock },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Goals', href: '/goals', icon: Target },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Reminders', href: '/reminders', icon: Bell },
        { name: 'Daily Review', href: '/review', icon: FileText },
    ];

    return (
        <div className="flex h-screen w-64 flex-col bg-zinc-950 border-r border-zinc-800">
            <div className="flex h-16 items-center px-6 border-b border-zinc-800/50">
                <Link href="/feed" className="flex items-center gap-2 font-semibold text-zinc-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
                        <Mic className="h-4 w-4 text-zinc-300" />
                    </div>
                    <span>Note Maker</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-zinc-800/80 text-zinc-50'
                                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t border-zinc-800/50 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-zinc-300">{userName}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-400 hover:text-zinc-50" title="Logout">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
