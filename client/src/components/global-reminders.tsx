'use client';

import { useGlobalReminders } from '@/hooks/use-global-reminders';

export function GlobalReminders() {
    useGlobalReminders();
    return null;
}
