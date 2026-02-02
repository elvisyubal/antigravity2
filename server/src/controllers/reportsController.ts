import { Request, Response } from 'express';
import prisma from '../db';
import ExcelJS from 'exceljs';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Ventas del día (usando fecha local del servidor)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const ventasHoy = await prisma.venta.findMany({
            where: {
                fecha: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                estado: 'COMPLETADO',
            },
        });

        const totalVentasHoy = ventasHoy.reduce((sum, venta) => sum + Number(venta.total), 0);
        const cantidadVentasHoy = ventasHoy.length;

        // Productos con bajo stock
        const productos = await prisma.producto.findMany({
            where: { estado: true },
        });
        const productosStockBajo = productos.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo)).length;

        // Configuración para alertas de vencimiento
        let config = await prisma.configuracion.findFirst();
        if (!config) {
            config = await prisma.configuracion.create({
                data: {
                    nombre_botica: 'Botica J&M',
                    lema: '¡Tu salud es nuestra prioridad!',
                    dias_vencimiento_alerta: 30,
                } as any,
            });
        }

        // Productos próximos a vencer
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + (config as any).dias_vencimiento_alerta);

        const productosVencer = await prisma.lote.count({
            where: {
                fecha_vencimiento: {
                    lte: futureDate,
                },
                stock_actual: {
                    gt: 0,
                },
            },
        });

        // Total deudores
        const totalDeudores = await prisma.cliente.count({
            where: {
                saldo_pendiente: {
                    gt: 0,
                },
            },
        });

        const deudaTotal = await prisma.cliente.aggregate({
            where: {
                saldo_pendiente: {
                    gt: 0,
                },
            },
            _sum: {
                saldo_pendiente: true,
            },
        });

        // Ventas por método de pago (últimos 7 días)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const ventasPorMetodo = await prisma.venta.groupBy({
            by: ['metodo_pago'],
            where: {
                fecha: {
                    gte: last7Days,
                },
                estado: 'COMPLETADO',
            },
            _sum: {
                total: true,
            },
            _count: true,
        });

        res.json({
            ventasHoy: {
                total: totalVentasHoy,
                cantidad: cantidadVentasHoy,
            },
            inventario: {
                stockBajo: productosStockBajo,
                proximosVencer: productosVencer,
                diasAlerta: (config as any).dias_vencimiento_alerta,
            },
            creditos: {
                deudores: totalDeudores,
                deudaTotal: deudaTotal._sum.saldo_pendiente || 0,
            },
            ventasPorMetodo,
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

export const getSalesReport = async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        const whereClause: any = {
            estado: 'COMPLETADO',
        };

        if (fecha_inicio && fecha_fin) {
            const [y1, m1, d1] = (fecha_inicio as string).split('-').map(Number);
            const [y2, m2, d2] = (fecha_fin as string).split('-').map(Number);

            const start = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);
            const end = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);

            whereClause.fecha = {
                gte: start,
                lte: end,
            };
        } else {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            whereClause.fecha = {
                gte: start,
                lte: end,
            };
        }

        const ventas = await prisma.venta.findMany({
            where: whereClause,
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
            },
        });

        const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
        const totalDescuentos = ventas.reduce((sum, v) => sum + Number(v.descuento), 0);

        // Productos más vendidos
        const productosVendidos: { [key: number]: { producto: any; cantidad: number; total: number } } = {};
        const ventasPorUsuario: { [key: number]: { nombre: string; total: number; cantidad: number } } = {};

        ventas.forEach((venta) => {
            // Agrupar por usuario
            const userId = venta.usuario_id;
            if (!ventasPorUsuario[userId]) {
                ventasPorUsuario[userId] = {
                    nombre: (venta as any).usuario?.nombre || 'SISTEMA',
                    total: 0,
                    cantidad: 0
                };
            }
            ventasPorUsuario[userId].total += Number(venta.total);
            ventasPorUsuario[userId].cantidad += 1;

            venta.detalles.forEach((detalle) => {
                if (!productosVendidos[detalle.producto_id]) {
                    productosVendidos[detalle.producto_id] = {
                        producto: detalle.producto,
                        cantidad: 0,
                        total: 0,
                    };
                }
                productosVendidos[detalle.producto_id].cantidad += detalle.cantidad;
                productosVendidos[detalle.producto_id].total += Number(detalle.subtotal);
            });
        });

        const productosMasVendidos = Object.values(productosVendidos)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10);

        const ventasPorCajero = Object.values(ventasPorUsuario)
            .sort((a, b) => b.total - a.total);

        res.json({
            resumen: {
                totalVentas,
                cantidadVentas: ventas.length,
                totalDescuentos,
            },
            productosMasVendidos,
            ventasPorCajero,
        });
    } catch (error) {
        console.error('Get sales report error:', error);
        res.status(500).json({ error: 'Error al generar reporte de ventas' });
    }
};

export const exportSalesReport = async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        const whereClause: any = {
            estado: 'COMPLETADO',
        };

        if (fecha_inicio && fecha_fin) {
            const [y1, m1, d1] = (fecha_inicio as string).split('-').map(Number);
            const [y2, m2, d2] = (fecha_fin as string).split('-').map(Number);
            const start = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);
            const end = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);
            whereClause.fecha = { gte: start, lte: end };
        }

        const ventas = await prisma.venta.findMany({
            where: whereClause,
            include: {
                detalles: { include: { producto: true } },
                cliente: true,
                usuario: true,
            },
            orderBy: { fecha: 'asc' },
        });

        const workbook = new ExcelJS.Workbook();

        // Hoja 1: Resumen
        const summarySheet = workbook.addWorksheet('Resumen');
        summarySheet.addRow(['REPORTE DE VENTAS - RESUMEN']);
        summarySheet.addRow(['Desde:', fecha_inicio || 'Inicio', 'Hasta:', fecha_fin || 'Fin']);
        summarySheet.addRow([]);

        // Calcular resúmenes para el Excel
        const prodSummary: any = {};
        const userSummary: any = {};
        let totalGeneral = 0;

        ventas.forEach(v => {
            totalGeneral += Number(v.total);
            const uId = v.usuario_id;
            if (!userSummary[uId]) userSummary[uId] = { nombre: v.usuario.nombre, total: 0 };
            userSummary[uId].total += Number(v.total);

            v.detalles.forEach(d => {
                if (!prodSummary[d.producto_id]) prodSummary[d.producto_id] = { nombre: d.producto.nombre, cant: 0, total: 0 };
                prodSummary[d.producto_id].cant += d.cantidad;
                prodSummary[d.producto_id].total += Number(d.subtotal);
            });
        });

        summarySheet.addRow(['TOTAL GENERAL VENTAS:', totalGeneral]);
        summarySheet.addRow([]);

        summarySheet.addRow(['TOP 10 PRODUCTOS']);
        summarySheet.addRow(['Producto', 'Cantidad', 'Monto Invertido/Generado']);
        Object.values(prodSummary)
            .sort((a: any, b: any) => b.cant - a.cant)
            .slice(0, 10)
            .forEach((p: any) => summarySheet.addRow([p.nombre, p.cant, p.total]));

        summarySheet.addRow([]);
        summarySheet.addRow(['VENTAS POR USUARIO']);
        summarySheet.addRow(['Cajero', 'Monto Total']);
        Object.values(userSummary)
            .sort((a: any, b: any) => b.total - a.total)
            .forEach((u: any) => summarySheet.addRow([u.nombre, u.total]));

        // Hoja 2: Detalle
        const worksheet = workbook.addWorksheet('Detalle de Ventas');
        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 20 },
            { header: 'Código', key: 'codigo', width: 15 },
            { header: 'Cliente', key: 'cliente', width: 25 },
            { header: 'Producto', key: 'producto', width: 30 },
            { header: 'Cantidad', key: 'cantidad', width: 10 },
            { header: 'Precio Unit.', key: 'precio', width: 12 },
            { header: 'Subtotal', key: 'subtotal', width: 12 },
            { header: 'Total Venta', key: 'total', width: 12 },
            { header: 'Método Pago', key: 'metodo', width: 15 },
            { header: 'Cajero', key: 'usuario', width: 20 },
        ];

        ventas.forEach((venta) => {
            venta.detalles.forEach((detalle, index) => {
                worksheet.addRow({
                    fecha: venta.fecha.toLocaleString(),
                    codigo: venta.codigo_venta,
                    cliente: venta.cliente ? `${venta.cliente.nombres} ${venta.cliente.apellidos || ''}` : 'CONTADO',
                    producto: detalle.producto.nombre,
                    cantidad: detalle.cantidad,
                    precio: Number(detalle.precio_unitario),
                    subtotal: Number(detalle.subtotal),
                    total: index === 0 ? Number(venta.total) : '',
                    metodo: venta.metodo_pago,
                    usuario: venta.usuario.nombre,
                });
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export sales report error:', error);
        res.status(500).json({ error: 'Error al exportar reporte de ventas' });
    }
};
