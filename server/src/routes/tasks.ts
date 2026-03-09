import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get all tasks for the logged-in user (joined with notes to ensure ownership and get note title)
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT t.*, n.title as note_title, n.note_type 
             FROM tasks t
             JOIN notes n ON t.note_id = n.id
             WHERE n.user_id = $1
             ORDER BY 
                CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END,
                t.deadline ASC NULLS LAST,
                t.created_at DESC`,
            [req.userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Server error fetching tasks' });
    }
});

// Update a task (e.g., mark as completed)
router.put('/:id', async (req: AuthRequest, res) => {
    const taskId = req.params.id;
    const { status, title, deadline } = req.body;

    try {
        // Verify ownership
        const { rows: taskRows } = await pool.query(
            `SELECT t.id FROM tasks t JOIN notes n ON t.note_id = n.id WHERE t.id = $1 AND n.user_id = $2`,
            [taskId, req.userId]
        );

        if (taskRows.length === 0) {
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }

        const { rows } = await pool.query(
            `UPDATE tasks 
             SET status = COALESCE($1, status),
                 title = COALESCE($2, title),
                 deadline = COALESCE($3, deadline)
             WHERE id = $4
             RETURNING *`,
            [status, title, deadline, taskId]
        );

        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Server error updating task' });
    }
});

export default router;
