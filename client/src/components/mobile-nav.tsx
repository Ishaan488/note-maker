'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, CheckSquare, Target, LogOut, User, Search, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function MobileNav() {
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
        { name: 'Review', href: '/daily-review', icon: FileText },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Goals', href: '/goals', icon: Target },
        { name: 'Profile', href: '#', icon: User, onClick: handleLogout },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800/60 pb-safe">
            <nav className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) && item.href !== '#';
                    return (
                        <div key={item.name} className="flex-1 flex justify-center h-full">
                            {item.onClick ? (
                                <button
                                    onClick={item.onClick}
                                    className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-zinc-500 hover:text-zinc-300"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span className="text-[10px] font-medium">Logout</span>
                                </button>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                                        isActive ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-300'
                                    )}
                                >
                                    <item.icon className={cn('h-5 w-5', isActive && 'text-zinc-50')} />
                                    <span className="text-[10px] font-medium">{item.name}</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>
        </div>
    );
}
