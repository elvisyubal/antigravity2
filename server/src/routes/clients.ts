import { Router } from 'express';
import {
    getClients,
    getClientById,
    createClient,
    updateClient,
    addPayment,
    getDebtors,
} from '../controllers/clientController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getClients);
router.get('/debtors', authenticateToken, getDebtors);
router.get('/:id', authenticateToken, getClientById);
router.post('/', authenticateToken, createClient);
router.put('/:id', authenticateToken, updateClient);
router.post('/payments', authenticateToken, addPayment);

export default router;
