'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, CheckSquare, Search, LayoutGrid, Bell, Target, FileText, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';

export function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        // Close drawer on route change
        setShowMore(false);
    }, [pathname]);

    // Close on escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowMore(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    }, [router]);

    // Primary items in bottom bar (max 5 for clean spacing)
    const primaryItems = [
        { name: 'Timeline', href: '/feed', icon: Clock },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    ];

    // Secondary items in the "More" drawer
    const drawerItems = [
        { name: 'Reminders', href: '/reminders', icon: Bell, desc: 'Upcoming alerts & notifications' },
        { name: 'Daily Review', href: '/daily-review', icon: FileText, desc: 'Your daily summary' },
        { name: 'Goals', href: '/goals', icon: Target, desc: 'Track long-term objectives' },
    ];

    const isMoreActive = drawerItems.some(
        item => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );

    return (
        <>
            {/* Backdrop overlay */}
            {showMore && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setShowMore(false)}
                />
            )}

            {/* Slide-up drawer */}
            <div
                className={cn(
                    'md:hidden fixed bottom-16 left-3 right-3 z-50 transition-all duration-300 ease-out',
                    showMore
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-8 opacity-0 pointer-events-none'
                )}
            >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl shadow-black/50">
                    {drawerItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all',
                                    isActive
                                        ? 'bg-zinc-800 text-white'
                                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 active:scale-[0.98]'
                                )}
                            >
                                <div className={cn(
                                    'flex items-center justify-center w-10 h-10 rounded-xl',
                                    isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'
                                )}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{item.name}</p>
                                    <p className="text-[11px] text-zinc-500">{item.desc}</p>
                                </div>
                            </Link>
                        );
                    })}

                    {/* Divider */}
                    <div className="my-1 mx-4 border-t border-zinc-800" />

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10">
                            <LogOut className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">Logout</p>
                    </button>
                </div>
            </div>

            {/* Bottom navigation bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/60 pb-safe">
                <nav className="flex justify-around items-center h-16 px-4">
                    {primaryItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-95',
                                    isActive ? 'text-white' : 'text-zinc-500'
                                )}
                            >
                                <item.icon className={cn('h-5 w-5', isActive && 'text-white')} />
                                <span className="text-[10px] font-medium">{item.name}</span>
                                {isActive && (
                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
                                )}
                            </Link>
                        );
                    })}

                    {/* More button */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={cn(
                            'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-95',
                            showMore || isMoreActive ? 'text-white' : 'text-zinc-500'
                        )}
                    >
                        {showMore ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <LayoutGrid className="h-5 w-5" />
                        )}
                        <span className="text-[10px] font-medium">More</span>
                        {isMoreActive && !showMore && (
                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
                        )}
                    </button>
                </nav>
            </div>
        </>
    );
}
