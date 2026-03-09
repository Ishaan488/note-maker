'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Target, ArrowRight, Circle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoals } from '@/hooks/use-tasks-goals';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function GoalsPage() {
    const { goals, isLoading, mutate } = useGoals();
    const router = useRouter();
    const [updating, setUpdating] = useState<string | null>(null);

    const toggleGoal = async (goalId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
        setUpdating(goalId);

        // Optimistic UI update
        mutate((currentGoals) => currentGoals?.map(g =>
            g.id === goalId ? { ...g, status: newStatus } : g
        ), false);

        try {
            await api.put(`/goals/${goalId}`, { status: newStatus });
            mutate(); // Revalidate
        } catch (error) {
            toast.error('Failed to update goal');
            mutate(); // Revert on error
        } finally {
            setUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
                <Skeleton className="h-8 w-32 mb-8" />
                <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    return (
        <div className="max-w-4xl mx-auto w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Target className="h-6 w-6 text-purple-500" /> Long-Term Goals
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    High-level objectives automatically identified from your notes and ideas.
                </p>
            </div>

            {goals.length === 0 ? (
                <div className="text-center py-24 px-4 bg-zinc-900/40 rounded-xl border border-zinc-800/60 border-dashed">
                    <Target className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400">No goals identified yet.</p>
                    <p className="text-xs text-zinc-600 mt-1">Capture a thought about a major milestone to create a goal.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Active Goals */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {activeGoals.map(goal => (
                            <div key={goal.id} className="flex flex-col p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl hover:border-purple-500/30 transition-colors group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Target className="w-16 h-16 text-purple-500" />
                                </div>

                                <div className="flex items-start gap-4 flex-1">
                                    <button
                                        onClick={() => toggleGoal(goal.id, goal.status)}
                                        disabled={updating === goal.id}
                                        className="pt-0.5 flex-shrink-0 text-zinc-500 hover:text-purple-500 transition-colors"
                                    >
                                        <Circle className="h-5 w-5" />
                                    </button>
                                    <div className="min-w-0">
                                        <p className="text-zinc-200 font-medium leading-snug">{goal.title}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between items-center text-xs text-zinc-500 font-medium">
                                    {goal.note_title && (
                                        <button
                                            onClick={() => router.push(`/note/${goal.note_id}`)}
                                            className="flex items-center gap-1 hover:text-zinc-300 transition-colors truncate max-w-[200px]"
                                            title={goal.note_title}
                                        >
                                            <span className="truncate">Source: {goal.note_title}</span>
                                        </button>
                                    )}
                                    {goal.deadline && (
                                        <span className="text-purple-400/70 shrink-0 ml-auto">
                                            {format(new Date(goal.deadline), 'MMM d, yyyy')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Completed Goals */}
                    {completedGoals.length > 0 && (
                        <div className="pt-6 border-t border-zinc-900">
                            <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4">Achieved Goals</h3>
                            <div className="grid sm:grid-cols-2 gap-4 opacity-50">
                                {completedGoals.map(goal => (
                                    <div key={goal.id} className="flex items-center gap-3 p-4 bg-zinc-950/50 rounded-lg border border-zinc-900">
                                        <button
                                            onClick={() => toggleGoal(goal.id, goal.status)}
                                            disabled={updating === goal.id}
                                            className="text-purple-500"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </button>
                                        <span className="text-zinc-400 text-sm line-through truncate">{goal.title}</span>
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
