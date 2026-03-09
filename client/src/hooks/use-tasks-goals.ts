import useSWR from 'swr';
import { api } from '@/lib/api';
import { Task, Goal } from '@/types';

export function useTasks() {
    const { data, error, mutate } = useSWR<Task[]>('/tasks', api.get.bind(api));
    return {
        tasks: data || [],
        isLoading: !error && !data,
        isError: !!error,
        mutate,
    };
}

export function useGoals() {
    const { data, error, mutate } = useSWR<Goal[]>('/goals', api.get.bind(api));
    return {
        goals: data || [],
        isLoading: !error && !data,
        isError: !!error,
        mutate,
    };
}
