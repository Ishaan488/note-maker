import { Router, Response } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { processNote } from '../services/ai';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/notes — Create a note + run AI pipeline
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { content_text } = req.body;

        if (!content_text || content_text.trim().length === 0) {
            res.status(400).json({ error: 'Note content is required' });
            return;
        }

        // 1. Run AI pipeline
        const aiResult = await processNote(content_text);

        // 2. Create note with AI-generated fields
        const noteResult = await pool.query(
            `INSERT INTO notes (user_id, content_text, title, summary, note_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [req.userId, content_text, aiResult.title, aiResult.summary, aiResult.noteType]
        );
        const note = noteResult.rows[0];

        // 3. Store AI metadata
        await pool.query(
            `INSERT INTO ai_metadata (note_id, ai_summary, ai_tags, ai_tasks, ai_goal_detection, ai_deadline)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                note.id,
                aiResult.summary,
                JSON.stringify(aiResult.tags),
                JSON.stringify(aiResult.tasks),
                aiResult.goalDetection,
                aiResult.deadline,
            ]
        );

        // 4. Create tags and note_tags associations
        const tagIds: string[] = [];
        for (const tagName of aiResult.tags) {
            const tagResult = await pool.query(
                `INSERT INTO tags (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
                [tagName.toLowerCase()]
            );
            const tagId = tagResult.rows[0].id;
            tagIds.push(tagId);

            await pool.query(
                `INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
                [note.id, tagId]
            );
        }

        // 5. Create extracted tasks
        const createdTasks = [];
        for (const task of aiResult.tasks) {
            const taskResult = await pool.query(
                `INSERT INTO tasks (note_id, title, deadline)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [note.id, task.title, task.deadline]
            );
            createdTasks.push(taskResult.rows[0]);
        }

        // 6. Create goal if detected
        let createdGoal = null;
        if (aiResult.goalDetection) {
            const goalResult = await pool.query(
                `INSERT INTO goals (note_id, title, deadline)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [note.id, aiResult.title, aiResult.deadline]
            );
            createdGoal = goalResult.rows[0];
        }

        res.status(201).json({
            note: {
                ...note,
                tags: aiResult.tags,
                tasks: createdTasks,
                goal: createdGoal,
            },
            ai: aiResult,
        });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/notes — List all notes for the user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { type, limit = '50', offset = '0' } = req.query;

        let query = `
      SELECT n.*,
        COALESCE(
          (SELECT json_agg(t.name)
           FROM note_tags nt
           JOIN tags t ON nt.tag_id = t.id
           WHERE nt.note_id = n.id), '[]'
        ) as tags,
        COALESCE(
          (SELECT json_agg(json_build_object('id', tk.id, 'title', tk.title, 'status', tk.status, 'deadline', tk.deadline))
           FROM tasks tk
           WHERE tk.note_id = n.id), '[]'
        ) as tasks
      FROM notes n
      WHERE n.user_id = $1
    `;
        const params: any[] = [req.userId];

        if (type && type !== 'all') {
            query += ` AND n.note_type = $${params.length + 1}`;
            params.push(type);
        }

        query += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit as string), parseInt(offset as string));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM notes WHERE user_id = $1';
        const countParams: any[] = [req.userId];
        if (type && type !== 'all') {
            countQuery += ' AND note_type = $2';
            countParams.push(type);
        }
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            notes: result.rows,
            total: parseInt(countResult.rows[0].count),
        });
    } catch (error) {
        console.error('List notes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/notes/:id — Get single note with all details
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const noteResult = await pool.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );

        if (noteResult.rows.length === 0) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        const note = noteResult.rows[0];

        // Get tags
        const tagsResult = await pool.query(
            `SELECT t.id, t.name FROM tags t
       JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id = $1`,
            [id]
        );

        // Get tasks
        const tasksResult = await pool.query(
            'SELECT * FROM tasks WHERE note_id = $1 ORDER BY created_at',
            [id]
        );

        // Get goals
        const goalsResult = await pool.query(
            'SELECT * FROM goals WHERE note_id = $1',
            [id]
        );

        // Get AI metadata
        const aiResult = await pool.query(
            'SELECT * FROM ai_metadata WHERE note_id = $1',
            [id]
        );

        res.json({
            ...note,
            tags: tagsResult.rows,
            tasks: tasksResult.rows,
            goals: goalsResult.rows,
            ai_metadata: aiResult.rows[0] || null,
        });
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/notes/search/query — Search notes
router.get('/search/query', async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { q, type, tags, limit = '50', offset = '0' } = req.query;

        let query = `
            SELECT n.*,
                COALESCE(
                (SELECT json_agg(t.name)
                FROM note_tags nt
                JOIN tags t ON nt.tag_id = t.id
                WHERE nt.note_id = n.id), '[]'
                ) as tags
            FROM notes n
            WHERE n.user_id = $1
        `;
        const params: any[] = [req.userId];
        let paramIndex = 2;

        if (q && typeof q === 'string' && q.trim().length > 0) {
            query += ` AND n.search_vector @@ plainto_tsquery('english', $${paramIndex})`;
            params.push(q);
            paramIndex++;
        }

        if (type && typeof type === 'string' && type !== 'all') {
            query += ` AND n.note_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (tags && typeof tags === 'string') {
            const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
            if (tagArray.length > 0) {
                query += ` AND EXISTS (
                    SELECT 1 FROM note_tags nt 
                    JOIN tags t ON nt.tag_id = t.id 
                    WHERE nt.note_id = n.id AND t.name = ANY($${paramIndex})
                )`;
                params.push(tagArray);
                paramIndex++;
            }
        }

        // Rank by search vector if searching, otherwise by date
        if (q && typeof q === 'string' && q.trim().length > 0) {
            query += ` ORDER BY ts_rank(n.search_vector, plainto_tsquery('english', $2)) DESC, n.created_at DESC`;
        } else {
            query += ` ORDER BY n.created_at DESC`;
        }

        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), parseInt(offset as string));

        const result = await pool.query(query, params);
        res.json({ notes: result.rows });
    } catch (error) {
        console.error('Search notes error:', error);
        res.status(500).json({ error: 'Internal server error during search' });
    }
});

// GET /api/notes/:id/related — Get related notes based on shared tags
router.get('/:id/related', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const query = `
            SELECT n.id, n.title, n.summary, n.note_type, n.created_at,
                COUNT(nt2.tag_id) as shared_tags,
                COALESCE(
                    (SELECT json_agg(t.name)
                    FROM note_tags nt3
                    JOIN tags t ON nt3.tag_id = t.id
                    WHERE nt3.note_id = n.id), '[]'
                ) as tags
            FROM notes n
            JOIN note_tags nt1 ON nt1.note_id = $1
            JOIN note_tags nt2 ON nt2.tag_id = nt1.tag_id AND nt2.note_id = n.id
            WHERE n.user_id = $2 AND n.id != $1
            GROUP BY n.id
            ORDER BY shared_tags DESC, n.created_at DESC
            LIMIT 5
        `;

        const result = await pool.query(query, [id, req.userId]);
        res.json({ related: result.rows });
    } catch (error) {
        console.error('Related notes error:', error);
        res.status(500).json({ error: 'Internal server error fetching related' });
    }
});

// PUT /api/notes/:id/convert — Convert note to task, goal, or revert to note
router.put('/:id/convert', async (req: AuthRequest, res: Response): Promise<any> => {
    const noteId = req.params.id;
    const { type } = req.body; // 'task', 'goal', or 'note'

    if (type !== 'task' && type !== 'goal' && type !== 'note') {
        return res.status(400).json({ error: 'Invalid conversion type' });
    }

    try {
        await pool.query('BEGIN');

        // Verify ownership and get note details
        const { rows: noteRows } = await pool.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2 FOR UPDATE',
            [noteId, req.userId]
        );

        if (noteRows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Note not found or unauthorized' });
        }

        const note = noteRows[0];

        // Update note type
        await pool.query(`UPDATE notes SET note_type = $1 WHERE id = $2`, [type, noteId]);

        if (type === 'task') {
            await pool.query(
                `INSERT INTO tasks (note_id, title) VALUES ($1, $2)`,
                [noteId, note.title || 'Untitled Task']
            );
        } else if (type === 'goal') {
            await pool.query(
                `INSERT INTO goals (note_id, title) VALUES ($1, $2)`,
                [noteId, note.title || 'Untitled Goal']
            );
        } else if (type === 'note') {
            // Revert: remove any existing tasks or goals linked to this note
            await pool.query(`DELETE FROM tasks WHERE note_id = $1`, [noteId]);
            await pool.query(`DELETE FROM goals WHERE note_id = $1`, [noteId]);
        }

        await pool.query('COMMIT');
        res.json({ success: true, type });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error converting note:', error);
        res.status(500).json({ error: 'Server error converting note' });
    }
});

// PUT /api/notes/:id/convert — Convert note to task or goal
router.put('/:id/convert', async (req: AuthRequest, res: Response): Promise<void> => {
    const noteId = req.params.id;
    const { type } = req.body; // 'task' or 'goal'

    if (type !== 'task' && type !== 'goal') {
        res.status(400).json({ error: 'Invalid conversion type' });
        return;
    }

    try {
        await pool.query('BEGIN');

        // Verify ownership and get note details
        const { rows: noteRows } = await pool.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2 FOR UPDATE',
            [noteId, req.userId]
        );

        if (noteRows.length === 0) {
            await pool.query('ROLLBACK');
            res.status(404).json({ error: 'Note not found or unauthorized' });
            return;
        }

        const note = noteRows[0];

        // Update note type
        await pool.query(`UPDATE notes SET note_type = $1 WHERE id = $2`, [type, noteId]);

        // Insert into respective table
        if (type === 'task') {
            await pool.query(
                `INSERT INTO tasks (note_id, title) VALUES ($1, $2)`,
                [noteId, note.title || 'Untitled Task']
            );
        } else if (type === 'goal') {
            await pool.query(
                `INSERT INTO goals (note_id, title) VALUES ($1, $2)`,
                [noteId, note.title || 'Untitled Goal']
            );
        }

        await pool.query('COMMIT');
        res.json({ success: true, type });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error converting note:', error);
        res.status(500).json({ error: 'Server error converting note' });
    }
});

// PUT /api/notes/:id — Update note
router.put('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { content_text, title, summary, note_type } = req.body;

        const result = await pool.query(
            `UPDATE notes SET
        content_text = COALESCE($1, content_text),
        title = COALESCE($2, title),
        summary = COALESCE($3, summary),
        note_type = COALESCE($4, note_type),
        updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
            [content_text, title, summary, note_type, id, req.userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/notes/:id — Delete note
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        res.json({ message: 'Note deleted' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/notes/:id/tags — Update tags on a note
router.put('/:id/tags', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { tags } = req.body; // array of tag names

        // Verify note belongs to user
        const noteCheck = await pool.query(
            'SELECT id FROM notes WHERE id = $1 AND user_id = $2',
            [id, req.userId]
        );
        if (noteCheck.rows.length === 0) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        // Remove existing tags
        await pool.query('DELETE FROM note_tags WHERE note_id = $1', [id]);

        // Add new tags
        for (const tagName of tags) {
            const tagResult = await pool.query(
                `INSERT INTO tags (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
                [tagName.toLowerCase()]
            );
            await pool.query(
                'INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [id, tagResult.rows[0].id]
            );
        }

        res.json({ message: 'Tags updated', tags });
    } catch (error) {
        console.error('Update tags error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
