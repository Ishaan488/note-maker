'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, BellRing, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RemindersPage() {
    const { data, isLoading, error, mutate } = useSWR(
        '/reminders',
        (url: string) => api.get(url) as Promise<any>
    );

    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [remindAt, setRemindAt] = useState('');

    const handleCreateReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/reminders', {
                title,
                remind_at: new Date(remindAt).toISOString(),
            });
            toast.success('Reminder created');
            setTitle('');
            setRemindAt('');
            setIsCreating(false);
            mutate();
        } catch (error) {
            toast.error('Failed to create reminder');
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.put(`/reminders/${id}/read`, {});
            mutate();
            toast.success('Reminder dismissed');
        } catch (error) {
            toast.error('Failed to dismiss reminder');
        }
    };

    if (isLoading) {
        return <div className="animate-pulse space-y-4">Loading reminders...</div>;
    }

    if (error) {
        return <div className="text-rose-500">Failed to load reminders.</div>;
    }

    const unreadReminders = data?.reminders || [];
    const isAllClear = unreadReminders.length === 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">Reminders</h1>
                    <p className="text-zinc-500">Upcoming alerts for your tasks and notes.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                    <BellRing className="mr-2 h-4 w-4" />
                    New Reminder
                </Button>
            </div>

            {isCreating && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6 mb-8">
                    <form onSubmit={handleCreateReminder} className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="What to remind you about?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 flex-1"
                            required
                        />
                        <Input
                            type="datetime-local"
                            value={remindAt}
                            onChange={(e) => setRemindAt(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-zinc-100 w-auto sm:w-56"
                            required
                        />
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                            Save
                        </Button>
                        <Button type="button" variant="ghost" className="text-zinc-400" onClick={() => setIsCreating(false)}>
                            Cancel
                        </Button>
                    </form>
                </div>
            )}

            {isAllClear ? (
                <div className="text-center py-24 px-4 bg-zinc-900/20 rounded-xl border border-zinc-800/50 border-dashed">
                    <div className="bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-8 w-8 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-medium text-zinc-200 mb-2">No Active Reminders</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto">
                        You're all caught up! Create a new reminder above.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {unreadReminders.map((reminder: any) => {
                        const isPastDue = new Date(reminder.remind_at) <= new Date();

                        return (
                            <div
                                key={reminder.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-all ${isPastDue
                                    ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                                    : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900'
                                    }`}
                            >
                                <div className="flex items-start gap-4 mb-4 sm:mb-0">
                                    <div className={`mt-1 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${isPastDue ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        <Bell className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-zinc-100 font-medium text-lg leading-tight mb-1">{reminder.title}</p>
                                        <div className="flex items-center text-xs">
                                            <Clock className={`mr-1 h-3 w-3 ${isPastDue ? 'text-rose-400' : 'text-zinc-500'}`} />
                                            <span className={isPastDue ? 'text-rose-400 font-medium' : 'text-zinc-500'}>
                                                {format(new Date(reminder.remind_at), 'MMM d, yyyy • h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {reminder.entity_id && (
                                        <Button variant="outline" size="sm" className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
                                            <Link href={`/note/${reminder.entity_id}`}>View Context</Link>
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => handleMarkAsRead(reminder.id)}
                                        className="bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 transition-colors"
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Dismiss
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
