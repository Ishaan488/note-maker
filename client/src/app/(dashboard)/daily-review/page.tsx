'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { NoteCard } from '@/components/note-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CheckSquare, Target, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DailyReviewPage() {
    const { data: reviewData, isLoading, error, mutate } = useSWR(
        '/daily-review',
        (url: string) => api.get(url) as Promise<any>
    );

    const handleMarkTaskComplete = async (taskId: string) => {
        try {
            await api.put(`/tasks/${taskId}`, { status: 'completed' });
            toast.success('Task marked as completed');
            mutate();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-12 animate-pulse">
                <div>
                    <Skeleton className="h-10 w-64 mb-4" />
                    <Skeleton className="h-4 w-96 mb-8" />
                </div>
                {[1, 2, 3].map((section) => (
                    <div key={section} className="space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    if (error || (!isLoading && !reviewData)) {
        return (
            <div className="text-center py-24 bg-zinc-900/20 rounded-xl border border-rose-500/20">
                <h3 className="text-lg font-medium text-rose-400 mb-2">Failed to load daily review</h3>
                <Button variant="outline" onClick={() => mutate()} className="mt-4 border-zinc-700">
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry
                </Button>
            </div>
        );
    }

    const { recent_notes = [], due_tasks = [], active_goals = [] } = reviewData;
    const isAllClear = recent_notes.length === 0 && due_tasks.length === 0 && active_goals.length === 0;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">Daily Review</h1>
                <p className="text-zinc-500">
                    Your summarized dashboard for today. Review recent notes, tackle due tasks, and check goals.
                </p>
            </div>

            {isAllClear && (
                <div className="text-center py-24 px-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50 border-dashed">
                    <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-medium text-zinc-200 mb-2">Inbox Zero</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto">
                        You have no recent notes to process, no tasks due today, and no active goals. Enjoy your day!
                    </p>
                </div>
            )}

            {!isAllClear && (
                <>
                    {/* Due Tasks Section */}
                    {due_tasks.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <h2 className="text-xl font-semibold text-zinc-100">Tasks Due Today</h2>
                                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs text-zinc-400 font-medium ml-2">
                                    {due_tasks.length}
                                </span>
                            </div>
                            <div className="grid gap-3">
                                {due_tasks.map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/60 transition-all hover:bg-zinc-900">
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => handleMarkTaskComplete(task.id)}
                                                className="mt-1 w-5 h-5 rounded border border-zinc-600 hover:border-amber-500 transition-colors flex-shrink-0"
                                            />
                                            <div>
                                                <p className="text-zinc-200 font-medium">{task.title}</p>
                                                <div className="flex justify-start text-xs text-amber-500/70 mt-1">
                                                    {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy') : 'No deadline'}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300">
                                            <Link href={`/note/${task.note_id}`}>View Note</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Active Goals Section */}
                    {active_goals.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                                <Target className="h-5 w-5 text-purple-400" />
                                <h2 className="text-xl font-semibold text-zinc-100">Active Goals</h2>
                                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs text-zinc-400 font-medium ml-2">
                                    {active_goals.length}
                                </span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {active_goals.map((goal: any) => (
                                    <div key={goal.id} className="p-5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                        <h3 className="font-medium text-zinc-200">{goal.title}</h3>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs text-purple-400/70">
                                                {goal.deadline ? `Due ${format(new Date(goal.deadline), 'MMM d, yyyy')}` : 'Long-term'}
                                            </span>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-zinc-400 hover:text-zinc-200">
                                                <Link href={`/note/${goal.note_id}`}>View Context</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Recent Notes Section */}
                    {recent_notes.length > 0 && (
                        <section className="space-y-4 hidden-scroll">
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                                <RefreshCw className="h-5 w-5 text-blue-400" />
                                <h2 className="text-xl font-semibold text-zinc-100">Recent Notes to Process</h2>
                                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs text-zinc-400 font-medium ml-2">
                                    {recent_notes.length}
                                </span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {recent_notes.map((note: any) => (
                                    <NoteCard key={note.id} note={note} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
