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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLowStockProducts = exports.getExpiringProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const db_1 = __importDefault(require("../db"));
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield db_1.default.producto.findMany({
            where: { estado: true },
            include: {
                categoria: true,
                proveedor: true,
                lotes: true,
            },
        });
        res.json(products);
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});
exports.getProducts = getProducts;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield db_1.default.producto.findFirst({
            where: {
                id: parseInt(id),
                estado: true
            },
            include: {
                categoria: true,
                proveedor: true,
                lotes: true,
            },
        });
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(product);
    }
    catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});
exports.getProductById = getProductById;
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { codigo, nombre, descripcion, categoria_id, proveedor_id, precio_compra, precio_venta, stock_minimo, lote, es_fraccionable, unidades_por_caja, precio_unidad, } = req.body;
        const product = yield db_1.default.producto.create({
            data: {
                codigo,
                nombre,
                descripcion,
                categoria_id,
                proveedor_id,
                precio_compra,
                precio_venta,
                stock_minimo: stock_minimo || 5,
                stock_actual: 0,
                es_fraccionable: !!es_fraccionable,
                unidades_por_caja: unidades_por_caja ? parseInt(unidades_por_caja) : 1,
                precio_unidad: precio_unidad ? parseFloat(precio_unidad) : null,
            },
        });
        // Si se proporciona información de lote, crear el registro
        if (lote) {
            yield db_1.default.lote.create({
                data: {
                    producto_id: product.id,
                    codigo_lote: lote.codigo_lote,
                    fecha_vencimiento: new Date(lote.fecha_vencimiento),
                    stock_inicial: lote.cantidad,
                    stock_actual: lote.cantidad,
                },
            });
            // Actualizar el stock del producto
            yield db_1.default.producto.update({
                where: { id: product.id },
                data: { stock_actual: lote.cantidad },
            });
        }
        const productWithRelations = yield db_1.default.producto.findUnique({
            where: { id: product.id },
            include: {
                categoria: true,
                proveedor: true,
                lotes: true,
            },
        });
        res.json(productWithRelations);
    }
    catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});
exports.createProduct = createProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const _a = req.body, { categoria, proveedor, lotes, stock_inicial, codigo_lote, fecha_vencimiento } = _a, productData = __rest(_a, ["categoria", "proveedor", "lotes", "stock_inicial", "codigo_lote", "fecha_vencimiento"]);
        const product = yield db_1.default.producto.update({
            where: { id: parseInt(id) },
            data: Object.assign(Object.assign({}, productData), { unidades_por_caja: productData.unidades_por_caja ? parseInt(productData.unidades_por_caja) : undefined, precio_unidad: productData.precio_unidad ? parseFloat(productData.precio_unidad) : undefined, precio_compra: productData.precio_compra ? parseFloat(productData.precio_compra) : undefined, precio_venta: productData.precio_venta ? parseFloat(productData.precio_venta) : undefined, categoria_id: productData.categoria_id ? parseInt(productData.categoria_id) : undefined, proveedor_id: productData.proveedor_id ? parseInt(productData.proveedor_id) : undefined }),
            include: {
                categoria: true,
                proveedor: true,
                lotes: true,
            },
        });
        // Actualizar o crear información de lote
        if (codigo_lote || fecha_vencimiento) {
            const firstLote = product.lotes[0];
            if (firstLote) {
                yield db_1.default.lote.update({
                    where: { id: firstLote.id },
                    data: {
                        codigo_lote: codigo_lote || firstLote.codigo_lote,
                        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : firstLote.fecha_vencimiento,
                    },
                });
            }
            else {
                // Si no tiene lotes (por error en creación o migración), lo creamos con el stock actual
                yield db_1.default.lote.create({
                    data: {
                        producto_id: product.id,
                        codigo_lote: codigo_lote || 'L-001',
                        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        stock_inicial: product.stock_actual,
                        stock_actual: product.stock_actual,
                    },
                });
            }
        }
        res.json(product);
    }
    catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield db_1.default.producto.update({
            where: { id: parseInt(id) },
            data: { estado: false },
        });
        res.json({ message: 'Producto desactivado exitosamente' });
    }
    catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Error al desactivar producto' });
    }
});
exports.deleteProduct = deleteProduct;
const getExpiringProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const daysAhead = parseInt(req.query.days) || 30;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const expiringBatches = yield db_1.default.lote.findMany({
            where: {
                fecha_vencimiento: {
                    lte: futureDate,
                },
                stock_actual: {
                    gt: 0,
                },
                producto: {
                    estado: true
                }
            },
            include: {
                producto: {
                    include: {
                        categoria: true,
                    },
                },
            },
            orderBy: {
                fecha_vencimiento: 'asc',
            },
        });
        res.json(expiringBatches);
    }
    catch (error) {
        console.error('Get expiring products error:', error);
        res.status(500).json({ error: 'Error al obtener productos por vencer' });
    }
});
exports.getExpiringProducts = getExpiringProducts;
const getLowStockProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield db_1.default.producto.findMany({
            where: {
                estado: true,
            },
            include: {
                categoria: true,
                proveedor: true,
            },
        });
        // Filter products where stock_actual <= stock_minimo
        const lowStockProducts = products.filter(p => p.stock_actual <= p.stock_minimo);
        res.json(lowStockProducts);
    }
    catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({ error: 'Error al obtener productos con bajo stock' });
    }
});
exports.getLowStockProducts = getLowStockProducts;
