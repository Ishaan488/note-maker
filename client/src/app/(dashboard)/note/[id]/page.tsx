'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { NoteCard } from '@/components/note-card';
import { format } from 'date-fns';
import { ArrowLeft, Trash2, Calendar, Target, CheckSquare, Sparkles, FileText, Clock, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNote, convertNote } from '@/hooks/use-notes';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;
    const { note, isLoading, isError, mutate } = useNote(id);
    const { data: relatedData } = useSWR(
        id ? `/notes/${id}/related` : null,
        (url: string) => api.get(url) as Promise<any>
    );
    const relatedNotes = relatedData?.related || [];

    const [isDeleting, setIsDeleting] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [remindAt, setRemindAt] = useState('');
    const [isSettingReminder, setIsSettingReminder] = useState(false);

    const handleSetReminder = async () => {
        if (!remindAt) return;
        setIsSettingReminder(true);
        try {
            await api.post('/reminders', {
                title: note?.title || 'Reminder for Note',
                remind_at: new Date(remindAt).toISOString(),
                entity_type: note?.note_type,
                entity_id: note?.id
            });
            toast.success('Reminder set successfully!');
            setRemindAt('');
        } catch (error) {
            toast.error('Failed to set reminder');
        } finally {
            setIsSettingReminder(false);
        }
    };

    const handleConvert = async (type: 'task' | 'goal' | 'note') => {
        setIsConverting(true);
        try {
            await convertNote(id, type);
            toast.success(`Converted to ${type}`);
            mutate();
        } catch (error) {
            toast.error('Failed to convert note');
        } finally {
            setIsConverting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        setIsDeleting(true);
        try {
            await api.delete(`/notes/${id}`);
            toast.success('Note deleted');
            router.push('/feed');
        } catch (error) {
            toast.error('Failed to delete note');
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            </div>
        );
    }

    if (isError || !note) {
        return (
            <div className="text-center py-24 px-4 bg-zinc-900/20 rounded-xl border border-rose-500/20">
                <h3 className="text-lg font-medium text-rose-400 mb-2">Note not found</h3>
                <Button variant="outline" onClick={() => router.push('/feed')} className="mt-4 border-zinc-700">
                    Back to feed
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/feed')} className="text-zinc-400 hover:text-zinc-100 bg-zinc-900/50">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{note.title || 'Untitled Note'}</h1>
                        <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <time>{format(new Date(note.created_at), 'PPP ')}</time>
                            <span>•</span>
                            <Badge variant="outline" className="capitalize text-xs font-normal border-zinc-700/50 bg-zinc-800/30">
                                {note.note_type}
                            </Badge>
                        </div>
                    </div>
                </div>
                <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isDeleting} className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Transcript / Text
                        </h3>
                        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {note.content_text}
                        </div>
                    </div>

                    {note.ai_metadata?.ai_summary && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-24 h-24 text-blue-500" />
                            </div>
                            <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2 uppercase tracking-wider relative z-10">
                                <Sparkles className="h-4 w-4" /> AI Summary
                            </h3>
                            <p className="text-zinc-300 relative z-10 leading-relaxed">
                                {note.ai_metadata.ai_summary}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar Data Area */}
                <div className="space-y-6">

                    {/* Tags */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {note.tags?.length > 0 ? (
                                note.tags.map((tag: any) => (
                                    <Badge key={tag.id} variant="secondary" className="bg-zinc-800 border-zinc-700 text-zinc-300 font-normal">
                                        {tag.name}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-zinc-500">No tags detected</span>
                            )}
                        </div>
                    </div>

                    {/* Set Reminder */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 mt-6">
                        <h3 className="text-sm font-medium text-blue-400/80 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <BellRing className="h-4 w-4" /> Reminders
                        </h3>
                        <div className="space-y-3">
                            <Input
                                type="datetime-local"
                                value={remindAt}
                                onChange={(e) => setRemindAt(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 text-zinc-300 text-sm"
                            />
                            <Button
                                variant="secondary"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleSetReminder}
                                disabled={isSettingReminder || !remindAt}
                            >
                                Set Reminder
                            </Button>
                        </div>
                    </div>

                    {/* Extracted Tasks */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-amber-500/70 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <CheckSquare className="h-4 w-4" /> Action Items
                        </h3>
                        <div className="space-y-3">
                            {note.tasks?.length > 0 ? (
                                note.tasks.map((task: any) => (
                                    <div key={task.id} className="flex items-start gap-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50 group transition-all hover:border-amber-500/30">
                                        <div className="mt-0.5 w-4 h-4 rounded border border-zinc-600 group-hover:border-amber-500/50 transition-colors flex-shrink-0" />
                                        <div>
                                            <span className="text-sm text-zinc-300">{task.title}</span>
                                            {task.deadline && (
                                                <div className="text-xs text-amber-500/70 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {format(new Date(task.deadline), 'MMM d, yyyy')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <span className="text-sm text-zinc-500">No actions extracted</span>
                            )}
                        </div>
                    </div>

                    {/* Goals */}
                    {note.goals?.length > 0 && (
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-purple-400/80 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Target className="h-4 w-4" /> Associated Goals
                            </h3>
                            <div className="space-y-3">
                                {note.goals.map((goal: any) => (
                                    <div key={goal.id} className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                        <span className="text-sm text-zinc-200 font-medium block">{goal.title}</span>
                                        <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-none rounded-sm px-2 font-normal text-xs">
                                            Active
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Manual Conversion Actions */}
                    {note.note_type === 'note' && (
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 mt-6">
                            <h3 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Manual Actions</h3>
                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-zinc-300 hover:text-amber-500 hover:border-amber-500/50 bg-zinc-900"
                                    onClick={() => handleConvert('task')}
                                    disabled={isConverting}
                                >
                                    <CheckSquare className="mr-2 h-4 w-4" /> Convert to Action Item
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-zinc-300 hover:text-purple-500 hover:border-purple-500/50 bg-zinc-900"
                                    onClick={() => handleConvert('goal')}
                                    disabled={isConverting}
                                >
                                    <Target className="mr-2 h-4 w-4" /> Mark as Long-Term Goal
                                </Button>
                            </div>
                        </div>
                    )}

                    {note.note_type !== 'note' && (
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 mt-6">
                            <h3 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Manual Actions</h3>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-zinc-300 hover:text-rose-400 hover:border-rose-400/50 bg-zinc-900"
                                onClick={() => handleConvert('note')}
                                disabled={isConverting}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Revert to Regular Note
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Related Notes Area */}
            {relatedNotes.length > 0 && (
                <div className="mt-12 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
                            Related Notes
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedNotes.map((relatedNote: any) => (
                            <NoteCard key={relatedNote.id} note={relatedNote} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
