import cron from 'node-cron';
import pool from '../config/db';
import webpush from 'web-push';

export function startCronJobs() {
    console.log('Starting background cron jobs...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            // Find reminders that are due and haven't been notified yet
            const dueReminders = await pool.query(`
                SELECT r.id, r.user_id, r.title, r.entity_type, r.entity_id 
                FROM reminders r
                WHERE r.remind_at <= NOW()
                AND r.is_notified = FALSE
                AND r.is_read = FALSE
            `);

            if (dueReminders.rows.length === 0) return;

            console.log(`Found ${dueReminders.rows.length} due reminders. Sending push notifications...`);

            for (const reminder of dueReminders.rows) {
                // Get all subscriptions for this user
                const subs = await pool.query(
                    'SELECT subscription_json FROM push_subscriptions WHERE user_id = $1',
                    [reminder.user_id]
                );

                const payload = JSON.stringify({
                    title: '🔔 Note Maker Reminder',
                    body: reminder.title,
                    url: reminder.entity_id ? `/note/${reminder.entity_id}` : '/reminders'
                });

                let pushSuccess = false;

                // Send to all registered devices for this user
                for (const row of subs.rows) {
                    try {
                        const subscription = row.subscription_json;
                        await webpush.sendNotification(subscription, payload);
                        pushSuccess = true;
                    } catch (err: any) {
                        // If subscription is expired/invalid (410), we can ideally delete it.
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await pool.query(
                                'DELETE FROM push_subscriptions WHERE user_id = $1 AND subscription_json = $2',
                                [reminder.user_id, row.subscription_json]
                            );
                        } else {
                            console.error('Push send error:', err);
                        }
                    }
                }

                // Mark as notified in the database so we don't spam them, even if they had no subscriptions
                await pool.query(
                    'UPDATE reminders SET is_notified = TRUE WHERE id = $1',
                    [reminder.id]
                );
            }
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
}
