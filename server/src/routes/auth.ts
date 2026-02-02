import { Router } from 'express';
import { login, register, getUsers, updateUser, deleteUser, toggleUserStatus } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, requireRole('ADMIN'), register);
router.get('/users', authenticateToken, requireRole('ADMIN'), getUsers);
router.put('/users/:id', authenticateToken, requireRole('ADMIN'), updateUser);
router.delete('/users/:id', authenticateToken, requireRole('ADMIN'), deleteUser);
router.patch('/users/:id/toggle', authenticateToken, requireRole('ADMIN'), toggleUserStatus);

export default router;
