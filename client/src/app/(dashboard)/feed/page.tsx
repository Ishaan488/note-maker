'use client';

import { useState } from 'react';
import { useNotes } from '@/hooks/use-notes';
import { NoteCard } from '@/components/note-card';
import { NoteCapture } from '@/components/note-capture';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeedPage() {
    const [activeTab, setActiveTab] = useState('all');
    const { notes, isLoading, isError, mutate } = useNotes(activeTab);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">Timeline</h1>
                <p className="text-zinc-500">Capture your thoughts, AI will organize them.</p>
            </div>

            <div className="mb-8">
                <NoteCapture onCreated={() => mutate()} />
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full relative z-20">
                        <TabsList className="bg-zinc-900 border border-zinc-800">
                            <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">All</TabsTrigger>
                            <TabsTrigger value="note" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Notes</TabsTrigger>
                            <TabsTrigger value="task" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Tasks</TabsTrigger>
                            <TabsTrigger value="goal" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">Goals</TabsTrigger>
                            <TabsTrigger value="idea" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Ideas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-48 w-full rounded-xl bg-zinc-900/50" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="text-center py-12 text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20 mt-4">
                        Failed to load timeline. Let's try refreshing.
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-24 px-4 bg-zinc-900/20 rounded-xl border border-zinc-800/50 border-dashed mt-4">
                        <h3 className="text-lg font-medium text-zinc-300 mb-2">Nothing here yet</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto">
                            Start capturing your thoughts using the text box above or the voice recorder.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mt-4 relative z-0">
                        {notes.map((note) => (
                            <NoteCard key={note.id} note={note} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
