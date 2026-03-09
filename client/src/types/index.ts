export interface User {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
}

export type NoteType = 'note' | 'task' | 'goal' | 'idea' | 'learning' | 'question';

export interface Note {
    id: string;
    user_id: string;
    content_text: string;
    title: string | null;
    summary: string | null;
    note_type: NoteType;
    created_at: string;
    updated_at: string;
    tags: string[];
    tasks: Task[];
}

export interface Task {
    id: string;
    note_id: string;
    title: string;
    status: 'pending' | 'completed';
    deadline: string | null;
    priority: number;
    created_at: string;
    note_title?: string;
    note_type?: NoteType;
}

export interface Goal {
    id: string;
    note_id: string;
    title: string;
    deadline: string | null;
    status: 'active' | 'completed' | 'abandoned';
    created_at: string;
    note_title?: string;
}

export interface AIMetadata {
    note_id: string;
    ai_summary: string | null;
    ai_tags: string[];
    ai_tasks: any[];
    ai_goal_detection: boolean;
    ai_deadline: string | null;
}
