import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { FileText, CheckSquare, Target, Lightbulb, GraduationCap, HelpCircle } from 'lucide-react';
import { Note } from '@/types';
import Link from 'next/link';

interface NoteCardProps {
    note: Note;
}

const TYPE_CONFIG = {
    note: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    task: { icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    goal: { icon: Target, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
    idea: { icon: Lightbulb, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    learning: { icon: GraduationCap, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
    question: { icon: HelpCircle, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
};

export function NoteCard({ note }: NoteCardProps) {
    const config = TYPE_CONFIG[note.note_type] || TYPE_CONFIG.note;
    const Icon = config.icon;

    return (
        <Link href={`/note/${note.id}`} className="block group">
            <Card className="bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700/80 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-900/50 backdrop-blur-sm h-full flex flex-col">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-zinc-100 group-hover:text-zinc-50 transition-colors line-clamp-1">
                            {note.title || 'Untitled'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <time dateTime={note.created_at}>
                                {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                            </time>
                            {note.tasks && note.tasks.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{note.tasks.length} task{note.tasks.length !== 1 ? 's' : ''}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={`p-2 rounded-lg border ${config.bg} flex-shrink-0 transition-colors`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-1">
                    <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                        {note.summary || note.content_text}
                    </p>
                </CardContent>

                {note.tags && note.tags.length > 0 && (
                    <CardFooter className="p-4 pt-0 gap-2 flex-wrap">
                        {note.tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border-zinc-700/50 transition-colors px-2 py-0 text-xs font-normal"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
}
