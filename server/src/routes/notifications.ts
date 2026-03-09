import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import pool from '../config/db';
import webpush from 'web-push';

const router = Router();

// Ensure VAPID details are set if the keys exist
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@notemaker.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// Get the public key so the client can subscribe
router.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Save a user's push subscription
router.post('/subscribe', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint) {
            res.status(400).json({ error: 'Invalid subscription object' });
            return;
        }

        // Store the subscription or update if it exists
        await pool.query(
            `INSERT INTO push_subscriptions (user_id, subscription_json) 
             VALUES ($1, $2)
             ON CONFLICT (user_id, subscription_json) DO NOTHING`,
            [req.userId, JSON.stringify(subscription)]
        );

        res.status(201).json({ message: 'Subscription saved successfully' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

export default router;
