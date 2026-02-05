import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getExpiringProducts, getLowStockProducts, addBatchToProduct } from '../controllers/productController';
import { downloadTemplate, importProducts } from '../controllers/importController';
import { authenticateToken, requireRole } from '../middleware/auth';
import multer from 'multer';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });
const router = Router();

router.get('/', authenticateToken, requireRole('ADMIN'), getProducts);
router.get('/expiring', authenticateToken, requireRole('ADMIN'), getExpiringProducts);
router.get('/low-stock', authenticateToken, requireRole('ADMIN'), getLowStockProducts);
router.get('/template', authenticateToken, requireRole('ADMIN'), downloadTemplate);
router.post('/import', authenticateToken, requireRole('ADMIN'), upload.single('file'), importProducts);
router.get('/:id', authenticateToken, requireRole('ADMIN'), getProductById);
router.post('/', authenticateToken, requireRole('ADMIN'), createProduct);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateProduct);
router.post('/:id/add-batch', authenticateToken, requireRole('ADMIN'), addBatchToProduct);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteProduct);

export default router;
