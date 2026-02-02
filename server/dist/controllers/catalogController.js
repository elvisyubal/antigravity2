"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSuppliers = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const db_1 = __importDefault(require("../db"));
// ============ CATEGORIAS ============
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield db_1.default.categoria.findMany({
            include: {
                _count: {
                    select: { productos: true },
                },
            },
        });
        res.json(categories);
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});
exports.getCategories = getCategories;
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nombre, descripcion } = req.body;
        const category = yield db_1.default.categoria.create({
            data: { nombre, descripcion },
        });
        res.json(category);
    }
    catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Error al crear categoría' });
    }
});
exports.createCategory = createCategory;
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        const category = yield db_1.default.categoria.update({
            where: { id: parseInt(id) },
            data: { nombre, descripcion },
        });
        res.json(category);
    }
    catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
});
exports.updateCategory = updateCategory;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield db_1.default.categoria.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Categoría eliminada' });
    }
    catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});
exports.deleteCategory = deleteCategory;
// ============ PROVEEDORES ============
const getSuppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const suppliers = yield db_1.default.proveedor.findMany({
            include: {
                _count: {
                    select: { productos: true, compras: true },
                },
            },
        });
        res.json(suppliers);
    }
    catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});
exports.getSuppliers = getSuppliers;
const createSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ruc, nombre, telefono, correo, direccion } = req.body;
        const supplier = yield db_1.default.proveedor.create({
            data: { ruc, nombre, telefono, correo, direccion },
        });
        res.json(supplier);
    }
    catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Error al crear proveedor' });
    }
});
exports.createSupplier = createSupplier;
const updateSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        const supplier = yield db_1.default.proveedor.update({
            where: { id: parseInt(id) },
            data,
        });
        res.json(supplier);
    }
    catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
});
exports.updateSupplier = updateSupplier;
const deleteSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield db_1.default.proveedor.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Proveedor eliminado' });
    }
    catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
});
exports.deleteSupplier = deleteSupplier;
