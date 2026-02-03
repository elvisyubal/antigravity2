import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import salesRoutes from './routes/sales';
import clientRoutes from './routes/clients';
import catalogRoutes from './routes/catalog';
import cashRoutes from './routes/cash';
import reportsRoutes from './routes/reports';
import configRoutes from './routes/config';
import { initBackupCron } from './utils/backupService';

dotenv.config();

// Iniciar cron de backups
initBackupCron();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    credentials: false, // JWT is in headers, not cookies
}));
app.use(helmet());
app.use(morgan('dev'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Botica J&M API is running', version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/config', configRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
