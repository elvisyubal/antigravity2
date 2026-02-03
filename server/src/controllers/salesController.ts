import { Request, Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const createSale = async (req: AuthRequest, res: Response) => {
    try {
        const {
            cliente_id,
            items,
            metodo_pago,
            descuento,
            monto_pagado,
            fecha_limite,
        } = req.body;

        // Calcular totales
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.precio_unitario * item.cantidad;
        }

        const total = subtotal - (descuento || 0);

        // Generar código único de venta
        const codigo_venta = `VTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Crear la venta
        const venta = await prisma.venta.create({
            data: {
                codigo_venta,
                usuario_id: req.userId!,
                cliente_id: cliente_id || null,
                subtotal,
                descuento: descuento || 0,
                total,
                metodo_pago,
                monto_pagado: monto_pagado || total,
                fecha_limite: fecha_limite ? new Date(fecha_limite) : null,
                detalles: {
                    create: items.map((item: any) => ({
                        producto_id: item.producto_id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal: item.precio_unitario * item.cantidad,
                        es_unidad: !!item.es_unidad,
                    })),
                },
            },
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
                cliente: true,
                usuario: {
                    select: {
                        nombre: true,
                        username: true,
                    },
                },
            },
        });

        // Actualizar stock de productos y lotes
        for (const item of items) {
            const product = await prisma.producto.findUnique({
                where: { id: item.producto_id },
                include: {
                    lotes: {
                        where: { stock_actual: { gt: 0 } },
                        orderBy: { fecha_vencimiento: 'asc' }
                    }
                }
            });

            if (!product) continue;

            // Cantidad a descontar en unidades mínimas
            let cantidadRestante = item.es_unidad ? item.cantidad : item.cantidad * product.unidades_por_caja;
            const totalADescontar = cantidadRestante;

            // Descontar de lotes (priorizando vencimiento más cercano)
            for (const lote of product.lotes) {
                if (cantidadRestante <= 0) break;

                const aDescontarEnLote = Math.min(lote.stock_actual, cantidadRestante);

                await prisma.lote.update({
                    where: { id: lote.id },
                    data: {
                        stock_actual: {
                            decrement: aDescontarEnLote
                        }
                    }
                });

                cantidadRestante -= aDescontarEnLote;
            }

            // Actualizar stock general del producto
            await prisma.producto.update({
                where: { id: item.producto_id },
                data: {
                    stock_actual: {
                        decrement: totalADescontar,
                    },
                },
            });
        }

        // Si es crédito, actualizar saldo del cliente
        if (metodo_pago === 'CREDITO' && cliente_id) {
            const saldoPendiente = total - (monto_pagado || 0);
            await prisma.cliente.update({
                where: { id: cliente_id },
                data: {
                    saldo_pendiente: {
                        increment: saldoPendiente,
                    },
                },
            });
        }

        res.json(venta);
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Error al crear venta' });
    }
};

export const getSales = async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        const whereClause: any = {};

        if (fecha_inicio && fecha_fin) {
            whereClause.fecha = {
                gte: new Date(fecha_inicio as string),
                lte: new Date(fecha_fin as string),
            };
        }

        const sales = await prisma.venta.findMany({
            where: whereClause,
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
                cliente: true,
                usuario: {
                    select: {
                        nombre: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                fecha: 'desc',
            },
        });

        res.json(sales);
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Error al obtener ventas' });
    }
};

export const getSaleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const sale = await prisma.venta.findUnique({
            where: { id: parseInt(id as string) },
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
                cliente: true,
                usuario: {
                    select: {
                        nombre: true,
                        username: true,
                    },
                },
            },
        });

        if (!sale) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        res.json(sale);
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Error al obtener venta' });
    }
};

export const cancelSale = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const sale = await prisma.venta.findUnique({
            where: { id: parseInt(id as string) },
            include: {
                detalles: true,
            },
        });

        if (!sale) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Devolver stock
        for (const detalle of sale.detalles) {
            const product = await prisma.producto.findUnique({
                where: { id: detalle.producto_id },
                include: { lotes: { orderBy: { fecha_vencimiento: 'asc' } } }
            });
            if (!product) continue;

            const cantidadDevolver = detalle.es_unidad ? detalle.cantidad : detalle.cantidad * product.unidades_por_caja;

            // Devolver al primer lote disponible (o crear uno si no existe, aunque debería existir)
            if (product.lotes.length > 0) {
                await prisma.lote.update({
                    where: { id: product.lotes[0].id },
                    data: {
                        stock_actual: {
                            increment: cantidadDevolver
                        }
                    }
                });
            }

            await prisma.producto.update({
                where: { id: detalle.producto_id },
                data: {
                    stock_actual: {
                        increment: cantidadDevolver,
                    },
                },
            });
        }

        // Si era crédito, actualizar saldo del cliente
        if (sale.metodo_pago === 'CREDITO' && sale.cliente_id) {
            const saldoPendiente = Number(sale.total) - Number(sale.monto_pagado || 0);
            await prisma.cliente.update({
                where: { id: sale.cliente_id },
                data: {
                    saldo_pendiente: {
                        decrement: saldoPendiente,
                    },
                },
            });
        }

        // Anular venta
        await prisma.venta.update({
            where: { id: parseInt(id as string) },
            data: {
                estado: 'ANULADO',
            },
        });

        res.json({ message: 'Venta anulada exitosamente' });
    } catch (error) {
        console.error('Cancel sale error:', error);
        res.status(500).json({ error: 'Error al anular venta' });
    }
};
