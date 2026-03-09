import useSWR from 'swr';
import { api } from '@/lib/api';
import { Note } from '@/types';

export function useNotes(type: string = 'all') {
    const { data, error, isLoading, mutate } = useSWR<{ notes: Note[]; total: number }>(
        `/notes?type=${type}`,
        (url) => api.get(url)
    );

    return {
        notes: data?.notes || [],
        total: data?.total || 0,
        isLoading,
        isError: error,
        mutate,
    };
}

export function useNote(id: string) {
    const { data, error, isLoading, mutate } = useSWR<Note & { ai_metadata: any; goals: any[] }>(
        id ? `/notes/${id}` : null,
        (url) => api.get(url)
    );

    return {
        note: data,
        isLoading,
        isError: error,
        mutate,
    };
}
