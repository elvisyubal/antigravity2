import { Router } from 'express';
import { getDashboardStats, getSalesReport, exportSalesReport } from '../controllers/reportsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticateToken, getDashboardStats);
router.get('/sales', authenticateToken, getSalesReport);
router.get('/export-excel', authenticateToken, exportSalesReport);

export default router;
