'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Search, Filter, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NoteCard } from '@/components/note-card';
import { Note } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 300);
    const [selectedType, setSelectedType] = useState<string>('all');

    // Fetch search results
    const { data: searchResults, isLoading } = useSWR<{ notes: Note[] }>(
        `/notes/search/query?q=${encodeURIComponent(debouncedQuery)}&type=${selectedType}`,
        (url: string) => api.get(url) as Promise<any>
    );

    const notes = searchResults?.notes || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">Search</h1>
                <p className="text-zinc-500">Find notes, tasks, ideas, and goals across your knowledge base.</p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 backdrop-blur-sm space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                    <Input
                        type="text"
                        placeholder="Search your notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-zinc-950/50 border-zinc-800 h-11 text-base placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
                    <div className="flex items-center gap-2">
                        {['all', 'note', 'task', 'goal', 'idea', 'learning', 'question'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedType === type
                                        ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300'
                                    }`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 h-32 flex flex-col justify-between">
                            <Skeleton className="h-6 w-3/4 rounded bg-zinc-800" />
                            <Skeleton className="h-4 w-full rounded bg-zinc-800" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-16 rounded-full bg-zinc-800/80" />
                                <Skeleton className="h-5 w-16 rounded-full bg-zinc-800/80" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && notes.length > 0 && (
                <div className="space-y-4">
                    {notes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                    ))}
                </div>
            )}

            {!isLoading && notes.length === 0 && (debouncedQuery || selectedType !== 'all') && (
                <div className="text-center py-24 px-4 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-zinc-900/50 rounded-full border border-zinc-800">
                            <Search className="h-8 w-8 text-zinc-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-zinc-300">No results found</h3>
                    <p className="text-zinc-500 mt-2">Try adjusting your search query or filters.</p>
                </div>
            )}

            {!isLoading && notes.length === 0 && !debouncedQuery && selectedType === 'all' && (
                <div className="text-center py-20 px-4">
                    <p className="text-zinc-500">Start typing to search your knowledge base.</p>
                </div>
            )}
        </div>
    );
}
