'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { VoiceRecorder } from './voice-recorder';
import { Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface NoteCaptureProps {
    onCreated?: () => void;
}

export function NoteCapture({ onCreated }: NoteCaptureProps) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim()) return;

        setIsSubmitting(true);
        try {
            const promise = api.post('/notes', { content_text: text });

            toast.promise(promise, {
                loading: 'AI is processing your note...',
                success: 'Note captured and structured!',
                error: 'Failed to save note'
            });

            await promise;

            setText('');
            setIsExpanded(false);
            onCreated?.();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTranscript = (transcriptText: string) => {
        setText((prev) => prev ? `${prev} ${transcriptText}` : transcriptText);
        setIsExpanded(true);
    };

    return (
        <Card className="bg-zinc-900/40 border-zinc-800/50 p-2 backdrop-blur-sm transition-all duration-300 relative z-10">
            <div className="relative">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={isExpanded ? "Write down your thoughts..." : "Capture a thought..."}
                    className={`resize-none border-none bg-transparent focus-visible:ring-0 px-3 py-3 text-zinc-100 placeholder:text-zinc-500 transition-all ${isExpanded ? 'min-h-[120px]' : 'min-h-[48px]'}`}
                    onFocus={() => setIsExpanded(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />

                <div className={`absolute right-2 bottom-2 flex items-center gap-2 transition-opacity duration-300`}>
                    <VoiceRecorder onTranscriptComplete={handleTranscript} />

                    {(isExpanded || text.trim().length > 0) && (
                        <Button
                            size="icon"
                            onClick={handleSubmit}
                            disabled={!text.trim() || isSubmitting}
                            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                        </Button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="flex justify-between items-center mt-2 px-3 text-xs text-zinc-500 pb-1">
                    <span>Cmd+Enter to save</span>
                    <button onClick={() => setIsExpanded(false)} className="hover:text-zinc-300 py-1">
                        Cancel
                    </button>
                </div>
            )}
        </Card>
    );
}
