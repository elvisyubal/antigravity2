"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catalogController_1 = require("../controllers/catalogController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Categorías
router.get('/categories', auth_1.authenticateToken, catalogController_1.getCategories);
router.post('/categories', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), catalogController_1.createCategory);
router.put('/categories/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), catalogController_1.updateCategory);
router.delete('/categories/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), catalogController_1.deleteCategory);
// Proveedores
router.get('/suppliers', auth_1.authenticateToken, catalogController_1.getSuppliers);
router.post('/suppliers', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), catalogController_1.createSupplier);
router.put('/suppliers/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), catalogController_1.updateSupplier);
router.delete('/suppliers/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), catalogController_1.deleteSupplier);
exports.default = router;
