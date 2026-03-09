import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get all goals for the logged-in user
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT g.*, n.title as note_title
             FROM goals g
             JOIN notes n ON g.note_id = n.id
             WHERE n.user_id = $1
             ORDER BY 
                CASE WHEN g.status = 'active' THEN 0 ELSE 1 END,
                g.deadline ASC NULLS LAST,
                g.created_at DESC`,
            [req.userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Server error fetching goals' });
    }
});

// Update goal status
router.put('/:id', async (req: AuthRequest, res) => {
    const goalId = req.params.id;
    const { status } = req.body;

    try {
        // Verify ownership
        const { rows: goalRows } = await pool.query(
            `SELECT g.id FROM goals g JOIN notes n ON g.note_id = n.id WHERE g.id = $1 AND n.user_id = $2`,
            [goalId, req.userId]
        );

        if (goalRows.length === 0) {
            return res.status(404).json({ error: 'Goal not found or unauthorized' });
        }

        const { rows } = await pool.query(
            `UPDATE goals SET status = $1 WHERE id = $2 RETURNING *`,
            [status, goalId]
        );

        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Server error updating goal' });
    }
});

export default router;
