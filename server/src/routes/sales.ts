import { Router } from 'express';
import { createSale, getSales, getSaleById, cancelSale } from '../controllers/salesController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createSale);
router.get('/', authenticateToken, getSales);
router.get('/:id', authenticateToken, getSaleById);
router.post('/:id/cancel', authenticateToken, requireRole('ADMIN'), cancelSale);

export default router;
