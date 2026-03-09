import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { GlobalReminders } from '@/components/global-reminders';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative z-0">
                <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen pb-24 md:pb-8">
                    {children}
                </div>
            </main>

            {/* Mobile Nav */}
            <MobileNav />

            {/* Global Listeners */}
            <GlobalReminders />
        </div>
    );
}
