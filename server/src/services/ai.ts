import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AIResult {
    title: string;
    summary: string;
    tags: string[];
    noteType: 'note' | 'task' | 'goal' | 'idea' | 'learning' | 'question';
    tasks: { title: string; deadline: string | null }[];
    goalDetection: boolean;
    deadline: string | null;
}

export async function processNote(text: string): Promise<AIResult> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are an AI assistant for a note-taking app. Analyze the following note text and extract structured information.

Note text:
"""
${text}
"""

Return a JSON object with exactly these fields:
{
  "title": "A short, descriptive title (max 10 words)",
  "summary": "A 1-2 sentence summary of the note",
  "tags": ["array", "of", "relevant", "topic", "tags"],
  "noteType": "one of: note, task, goal, idea, learning, question",
  "tasks": [{"title": "actionable task extracted from the note", "deadline": "ISO date string or null"}],
  "goalDetection": true/false (is this about a long-term objective?),
  "deadline": "ISO date string if a deadline is detected, null otherwise"
}

Rules:
- noteType should be classified based on the intent of the note
- Extract ALL actionable tasks, even implicit ones
- Tags should be lowercase, single words or short phrases
- If a date is mentioned, convert to ISO format. Use year 2026 if not specified.
- Return ONLY valid JSON, no markdown formatting, no code blocks

JSON:`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let responseText = response.text().trim();

        // Clean up potential markdown formatting
        if (responseText.startsWith('```json')) {
            responseText = responseText.slice(7);
        }
        if (responseText.startsWith('```')) {
            responseText = responseText.slice(3);
        }
        if (responseText.endsWith('```')) {
            responseText = responseText.slice(0, -3);
        }
        responseText = responseText.trim();

        const parsed: AIResult = JSON.parse(responseText);

        // Validate and sanitize
        return {
            title: parsed.title || 'Untitled Note',
            summary: parsed.summary || text.substring(0, 150),
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
            noteType: ['note', 'task', 'goal', 'idea', 'learning', 'question'].includes(parsed.noteType)
                ? parsed.noteType
                : 'note',
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
            goalDetection: Boolean(parsed.goalDetection),
            deadline: parsed.deadline || null,
        };
    } catch (error) {
        console.error('AI processing error:', error);
        // Fallback: return basic structure
        return {
            title: text.substring(0, 50).trim(),
            summary: text.substring(0, 150).trim(),
            tags: [],
            noteType: 'note',
            tasks: [],
            goalDetection: false,
            deadline: null,
        };
    }
}
