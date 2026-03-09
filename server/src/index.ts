import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/db';
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import tasksRoutes from './routes/tasks';
import goalsRoutes from './routes/goals';
import remindersRoutes from './routes/reminders';
import dailyReviewRoutes from './routes/daily-review';
import notificationsRoutes from './routes/notifications';
import { startCronJobs } from './services/cron';

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(null, true); // Allow all for now; tighten in production
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/daily-review', dailyReviewRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database on cold start
initializeDatabase().catch(err => console.error('DB init error:', err));

// Start cron jobs only when running as a persistent server (not on Vercel)
if (!process.env.VERCEL) {
    startCronJobs();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT as number, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
}

// Export for Vercel serverless
export default app;
