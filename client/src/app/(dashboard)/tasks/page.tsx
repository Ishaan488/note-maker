'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CheckSquare, Clock, ArrowRight, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/hooks/use-tasks-goals';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function TasksPage() {
    const { tasks, isLoading, mutate } = useTasks();
    const router = useRouter();
    const [updating, setUpdating] = useState<string | null>(null);

    const toggleTask = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        setUpdating(taskId);

        // Optimistic UI update
        mutate((currentTasks) => currentTasks?.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        ), false);

        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            mutate(); // Revalidate
        } catch (error) {
            toast.error('Failed to update task');
            mutate(); // Revert on error
        } finally {
            setUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-3xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
                <Skeleton className="h-8 w-32 mb-8" />
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    return (
        <div className="max-w-3xl mx-auto w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <CheckSquare className="h-6 w-6 text-amber-500" /> Action Items
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Tasks automatically extracted from your thoughts and notes.
                </p>
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-24 px-4 bg-zinc-900/40 rounded-xl border border-zinc-800/60 border-dashed">
                    <CheckSquare className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400">No action items found.</p>
                    <p className="text-xs text-zinc-600 mt-1">Capture a note with an actionable task to see it here.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Pending Tasks */}
                    <div className="space-y-3">
                        {pendingTasks.map(task => (
                            <div key={task.id} className="flex items-start gap-4 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl hover:border-amber-500/30 transition-colors group">
                                <button
                                    onClick={() => toggleTask(task.id, task.status)}
                                    disabled={updating === task.id}
                                    className="pt-1 flex-shrink-0 text-zinc-500 hover:text-amber-500 transition-colors"
                                >
                                    <Circle className="h-5 w-5" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-zinc-200 font-medium">{task.title}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 font-medium tracking-wide">
                                        {task.deadline && (
                                            <span className="flex items-center gap-1 text-amber-500/70">
                                                <Clock className="h-3.5 w-3.5" />
                                                {format(new Date(task.deadline), 'MMM d, yyyy')}
                                            </span>
                                        )}
                                        {task.note_title && (
                                            <button
                                                onClick={() => router.push(`/note/${task.note_id}`)}
                                                className="flex items-center gap-1 hover:text-zinc-300 transition-colors truncate"
                                            >
                                                <span>From: {task.note_title}</span>
                                                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <div className="pt-6 border-t border-zinc-900">
                            <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4">Completed</h3>
                            <div className="space-y-2 opacity-50">
                                {completedTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-transparent rounded-lg">
                                        <button
                                            onClick={() => toggleTask(task.id, task.status)}
                                            disabled={updating === task.id}
                                            className="text-amber-500"
                                        >
                                            <CheckSquare className="h-4 w-4" />
                                        </button>
                                        <span className="text-zinc-400 text-sm line-through">{task.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
