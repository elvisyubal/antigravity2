import { Request, Response } from 'express';
import prisma from '../db';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.producto.findMany({
            where: { estado: true },
            include: {
                categoria: true,
                proveedor: true,
                lotes: true,
            },
        });
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.producto.findFirst({
            where: {
                id: parseInt(id as string),
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
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const {
            codigo,
            nombre,
            descripcion,
            categoria_id,
            proveedor_id,
            precio_compra,
            precio_venta,
            stock_minimo,
            lote,
            es_fraccionable,
            unidades_por_caja,
            precio_unidad,
        } = req.body;

        const product = await prisma.producto.create({
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
        let stockEnUnidades = 0;
        if (lote) {
            const unidadesCaja = product.unidades_por_caja || 1;
            stockEnUnidades = product.es_fraccionable ? lote.cantidad * unidadesCaja : lote.cantidad;

            await prisma.lote.create({
                data: {
                    producto_id: product.id,
                    codigo_lote: lote.codigo_lote,
                    fecha_vencimiento: new Date(lote.fecha_vencimiento),
                    stock_inicial: stockEnUnidades,
                    stock_actual: stockEnUnidades,
                },
            });

            // Actualizar el stock del producto
            await prisma.producto.update({
                where: { id: product.id },
                data: { stock_actual: stockEnUnidades },
            });
        }

        const productWithRelations = await prisma.producto.findUnique({
            where: { id: product.id },
            include: {
                categoria: true,
                proveedor: true,
                lotes: true,
            },
        });

        res.json(productWithRelations);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            categoria,
            proveedor,
            lotes,
            stock_inicial,
            codigo_lote,
            fecha_vencimiento,
            ...productData
        } = req.body;

        const product = await prisma.producto.update({
            where: { id: parseInt(id as string) },
            data: {
                ...productData,
                unidades_por_caja: productData.unidades_por_caja ? parseInt(productData.unidades_por_caja) : undefined,
                precio_unidad: productData.precio_unidad ? parseFloat(productData.precio_unidad) : undefined,
                precio_compra: productData.precio_compra ? parseFloat(productData.precio_compra) : undefined,
                precio_venta: productData.precio_venta ? parseFloat(productData.precio_venta) : undefined,
                categoria_id: productData.categoria_id ? parseInt(productData.categoria_id) : undefined,
                proveedor_id: productData.proveedor_id ? parseInt(productData.proveedor_id) : undefined,
            },
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
                await prisma.lote.update({
                    where: { id: firstLote.id },
                    data: {
                        codigo_lote: codigo_lote || firstLote.codigo_lote,
                        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : firstLote.fecha_vencimiento,
                    },
                });
            } else {
                // Si no tiene lotes (por error en creación o migración), lo creamos con el stock actual
                await prisma.lote.create({
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
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.producto.update({
            where: { id: parseInt(id as string) },
            data: { estado: false },
        });

        res.json({ message: 'Producto desactivado exitosamente' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Error al desactivar producto' });
    }
};

export const getExpiringProducts = async (req: Request, res: Response) => {
    try {
        const daysAhead = parseInt(req.query.days as string) || 30;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const expiringBatches = await prisma.lote.findMany({
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
    } catch (error) {
        console.error('Get expiring products error:', error);
        res.status(500).json({ error: 'Error al obtener productos por vencer' });
    }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.producto.findMany({
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
    } catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({ error: 'Error al obtener productos con bajo stock' });
    }
};

export const addBatchToProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { codigo_lote, fecha_vencimiento, cantidad, es_unidad } = req.body;

        const product = await prisma.producto.findUnique({
            where: { id: parseInt(id as string) }
        });

        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const unidadesCaja = product.unidades_por_caja || 1;
        // Si el producto es fraccionable y NO se marcó como ingreso de unidades, se multiplica por unidadesCaja
        const stockEnUnidades = (product.es_fraccionable && !es_unidad) ? Number(cantidad) * unidadesCaja : Number(cantidad);

        // Crear el lote
        const newLote = await prisma.lote.create({
            data: {
                producto_id: product.id,
                codigo_lote: codigo_lote || `L-${Date.now()}`,
                fecha_vencimiento: new Date(fecha_vencimiento),
                stock_inicial: stockEnUnidades,
                stock_actual: stockEnUnidades,
            }
        });

        // Actualizar stock del producto
        await prisma.producto.update({
            where: { id: product.id },
            data: {
                stock_actual: {
                    increment: stockEnUnidades
                }
            }
        });

        res.json({ message: 'Stock agregado exitosamente', lote: newLote });
    } catch (error) {
        console.error('Add batch error:', error);
        res.status(500).json({ error: 'Error al agregar lote' });
    }
};
