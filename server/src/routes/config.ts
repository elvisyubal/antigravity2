import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/configController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getConfig);
router.put('/', authenticateToken, updateConfig);

export default router;
