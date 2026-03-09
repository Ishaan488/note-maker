import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export async function initializeDatabase(): Promise<void> {
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    try {
        await pool.query(schema);
        console.log('✅ Database schema initialized');
    } catch (error) {
        console.error('❌ Failed to initialize database schema:', error);
        throw error;
    }
}

export default pool;
