import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getExpiringProducts, getLowStockProducts } from '../controllers/productController';
import { downloadTemplate, importProducts } from '../controllers/importController';
import { authenticateToken, requireRole } from '../middleware/auth';
import multer from 'multer';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });
const router = Router();

router.get('/', authenticateToken, getProducts);
router.get('/expiring', authenticateToken, getExpiringProducts);
router.get('/low-stock', authenticateToken, getLowStockProducts);
router.get('/template', authenticateToken, requireRole('ADMIN'), downloadTemplate);
router.post('/import', authenticateToken, requireRole('ADMIN'), upload.single('file'), importProducts);
router.get('/:id', authenticateToken, getProductById);
router.post('/', authenticateToken, requireRole('ADMIN'), createProduct);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateProduct);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteProduct);

export default router;
