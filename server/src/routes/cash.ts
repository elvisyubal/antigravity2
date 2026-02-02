import { Router } from 'express';
import {
    openCashRegister,
    closeCashRegister,
    getCurrentCashRegister,
    getCashRegisterHistory,
} from '../controllers/cashController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/open', authenticateToken, openCashRegister);
router.post('/:id/close', authenticateToken, closeCashRegister);
router.get('/current', authenticateToken, getCurrentCashRegister);
router.get('/history', authenticateToken, getCashRegisterHistory);

export default router;
