'use client';

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useGlobalReminders() {
    // Poll every 1 minute
    const { data } = useSWR(
        '/reminders',
        (url: string) => api.get(url) as Promise<any>,
        { refreshInterval: 60000 }
    );

    const notifiedSet = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!data || !data.reminders) return;

        const now = new Date();

        data.reminders.forEach((reminder: any) => {
            const remindTime = new Date(reminder.remind_at);

            // If the reminder is due (or past due by up to 10 minutes) and we haven't notified yet
            if (remindTime <= now && !notifiedSet.current.has(reminder.id)) {

                // Show toast notification
                toast('🔔 Reminder Due!', {
                    description: reminder.title,
                    action: {
                        label: 'View',
                        onClick: () => {
                            if (reminder.entity_id) {
                                window.location.href = `/note/${reminder.entity_id}`;
                            } else {
                                window.location.href = `/reminders`;
                            }
                        }
                    },
                    duration: 10000,
                });

                // Mark as notified in memory so we don't spam toasts
                notifiedSet.current.add(reminder.id);
            }
        });
    }, [data]);

    return data?.reminders || [];
}
