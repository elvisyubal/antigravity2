import { Router } from 'express';
import { getConfig, updateConfig, triggerBackup } from '../controllers/configController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getConfig);
router.put('/', authenticateToken, requireRole('ADMIN'), updateConfig);
router.post('/backup', authenticateToken, requireRole('ADMIN'), triggerBackup);

export default router;
