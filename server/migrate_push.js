const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        console.log('Altering reminders table...');
        await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS is_notified BOOLEAN DEFAULT FALSE;`);

        console.log('Creating push_subscriptions table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                subscription_json JSONB NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, subscription_json)
            );
        `);
        console.log('Migration complete.');
    } catch (e) {
        console.error('Migration failed', e);
    } finally {
        pool.end();
    }
}

migrate();
