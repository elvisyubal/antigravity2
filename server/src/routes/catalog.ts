import { Router } from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} from '../controllers/catalogController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Categorías
router.get('/categories', authenticateToken, getCategories);
router.post('/categories', authenticateToken, requireRole('ADMIN'), createCategory);
router.put('/categories/:id', authenticateToken, requireRole('ADMIN'), updateCategory);
router.delete('/categories/:id', authenticateToken, requireRole('ADMIN'), deleteCategory);

// Proveedores
router.get('/suppliers', authenticateToken, getSuppliers);
router.post('/suppliers', authenticateToken, requireRole('ADMIN'), createSupplier);
router.put('/suppliers/:id', authenticateToken, requireRole('ADMIN'), updateSupplier);
router.delete('/suppliers/:id', authenticateToken, requireRole('ADMIN'), deleteSupplier);

export default router;
