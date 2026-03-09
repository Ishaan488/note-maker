'use client';

import { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/hooks/use-speech';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceRecorderProps {
    onTranscriptComplete: (text: string) => void;
    className?: string;
}

export function VoiceRecorder({ onTranscriptComplete, className }: VoiceRecorderProps) {
    const { isListening, transcript, interimTranscript, startListening, stopListening, error, supported } = useSpeech();

    if (!supported) {
        return (
            <Button variant="outline" size="icon" className={className} disabled title="Speech API not supported">
                <Mic className="h-4 w-4 text-zinc-600" />
            </Button>
        );
    }

    if (error) {
        console.error(error);
    }

    const toggleRecording = () => {
        if (isListening) {
            stopListening();
            if (transcript) {
                onTranscriptComplete(transcript);
                toast.success('Audio captured');
            }
        } else {
            startListening();
            toast('Listening...', { icon: <Mic className="h-4 w-4 animate-pulse text-red-500" /> });
        }
    };

    return (
        <div className={cn("relative flex items-center", className)}>
            {isListening && interimTranscript && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 max-w-[200px] truncate text-xs text-zinc-500 mr-2 animate-pulse">
                    {interimTranscript}
                </div>
            )}

            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleRecording}
                className={cn(
                    "transition-all duration-300 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800",
                    isListening && "border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                )}
            >
                {isListening ? (
                    <Square className="h-4 w-4 fill-current" />
                ) : (
                    <Mic className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
