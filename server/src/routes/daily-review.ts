import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import pool from '../config/db';

const router = Router();

// GET /api/daily-review
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // 1. Get recent notes (last 24 hours or since last review)
        const recentNotesResult = await pool.query(
            `SELECT id, title, summary, created_at, note_type 
             FROM notes 
             WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 HOURS'
             ORDER BY created_at DESC`,
            [userId]
        );

        // 2. Get tasks due today or overdue (and not completed)
        const dueTasksResult = await pool.query(
            `SELECT t.id, t.title, t.deadline, t.status, n.id as note_id
             FROM tasks t
             JOIN notes n ON t.note_id = n.id
             WHERE n.user_id = $1 
               AND t.status != 'completed'
               AND t.deadline <= CURRENT_DATE + INTERVAL '1 DAY'
             ORDER BY t.deadline ASC NULLS LAST`,
            [userId]
        );

        // 3. Get all active goals
        const activeGoalsResult = await pool.query(
            `SELECT g.id, g.title, g.deadline, n.id as note_id
             FROM goals g
             JOIN notes n ON g.note_id = n.id
             WHERE n.user_id = $1 AND g.status = 'active'
             ORDER BY g.created_at DESC`,
            [userId]
        );

        res.json({
            recent_notes: recentNotesResult.rows,
            due_tasks: dueTasksResult.rows,
            active_goals: activeGoalsResult.rows
        });
    } catch (error) {
        console.error('Error fetching daily review:', error);
        res.status(500).json({ error: 'Failed to fetch daily review data' });
    }
});

export default router;
