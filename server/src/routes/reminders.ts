import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import pool from '../config/db';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const result = await pool.query(
            `SELECT * FROM reminders 
             WHERE user_id = $1 AND is_read = false 
             ORDER BY remind_at ASC`,
            [userId]
        );

        res.json({ reminders: result.rows });
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { title, description, remind_at, entity_type, entity_id } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!title || !remind_at) {
            res.status(400).json({ error: 'Title and remind_at are required' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO reminders (user_id, title, description, remind_at, entity_type, entity_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, title, description, remind_at, entity_type, entity_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.status(500).json({ error: 'Failed to create reminder' });
    }
});

// PUT /api/reminders/:id/read - Mark reminder as read
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const reminderId = req.params.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const result = await pool.query(
            `UPDATE reminders 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [reminderId, userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Reminder not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ error: 'Failed to update reminder' });
    }
});

export default router;
