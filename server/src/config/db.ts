import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit on serverless — just log the error
    if (!process.env.VERCEL) {
        process.exit(-1);
    }
});

export async function initializeDatabase(): Promise<void> {
    try {
        // First test the connection
        await pool.query('SELECT 1');
        console.log('✅ Database connected');

        // Try to run schema.sql (only works locally or if file is bundled)
        try {
            const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf-8');
                await pool.query(schema);
                console.log('✅ Database schema initialized');
            } else {
                console.log('ℹ️  schema.sql not found — skipping (run migrations manually on cloud DB)');
            }
        } catch (schemaError) {
            console.log('ℹ️  Schema already exists or could not be applied:', (schemaError as Error).message);
        }
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        throw error;
    }
}

export default pool;
