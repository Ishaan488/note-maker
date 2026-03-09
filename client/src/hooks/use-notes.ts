import useSWR from 'swr';
import { api } from '@/lib/api';
import { Note } from '@/types';

export function useNotes(type: string = 'all') {
    const { data, error, isLoading, mutate } = useSWR<{ notes: Note[]; total: number }>(
        `/notes?type=${type}`,
        (url: string) => api.get(url) as Promise<any>
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
        (url: string) => api.get(url) as Promise<any>
    );

    return {
        note: data,
        isLoading,
        isError: error,
        mutate,
    };
}

export async function convertNote(id: string, type: 'task' | 'goal' | 'note') {
    return api.put(`/notes/${id}/convert`, { type });
}
