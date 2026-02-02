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
exports.exportSalesReport = exports.getSalesReport = exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../db"));
const exceljs_1 = __importDefault(require("exceljs"));
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ventas del día (usando fecha local del servidor)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const ventasHoy = yield db_1.default.venta.findMany({
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
        const productos = yield db_1.default.producto.findMany({
            where: { estado: true },
        });
        const productosStockBajo = productos.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo)).length;
        // Configuración para alertas de vencimiento
        let config = yield db_1.default.configuracion.findFirst();
        if (!config) {
            config = yield db_1.default.configuracion.create({
                data: {
                    nombre_botica: 'Botica J&M',
                    lema: '¡Tu salud es nuestra prioridad!',
                    dias_vencimiento_alerta: 30,
                },
            });
        }
        // Productos próximos a vencer
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + config.dias_vencimiento_alerta);
        const productosVencer = yield db_1.default.lote.count({
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
        const totalDeudores = yield db_1.default.cliente.count({
            where: {
                saldo_pendiente: {
                    gt: 0,
                },
            },
        });
        const deudaTotal = yield db_1.default.cliente.aggregate({
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
        const ventasPorMetodo = yield db_1.default.venta.groupBy({
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
                diasAlerta: config.dias_vencimiento_alerta,
            },
            creditos: {
                deudores: totalDeudores,
                deudaTotal: deudaTotal._sum.saldo_pendiente || 0,
            },
            ventasPorMetodo,
        });
    }
    catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});
exports.getDashboardStats = getDashboardStats;
const getSalesReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const whereClause = {
            estado: 'COMPLETADO',
        };
        if (fecha_inicio && fecha_fin) {
            const [y1, m1, d1] = fecha_inicio.split('-').map(Number);
            const [y2, m2, d2] = fecha_fin.split('-').map(Number);
            const start = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);
            const end = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);
            whereClause.fecha = {
                gte: start,
                lte: end,
            };
        }
        else {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            whereClause.fecha = {
                gte: start,
                lte: end,
            };
        }
        const ventas = yield db_1.default.venta.findMany({
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
        const productosVendidos = {};
        const ventasPorUsuario = {};
        ventas.forEach((venta) => {
            var _a;
            // Agrupar por usuario
            const userId = venta.usuario_id;
            if (!ventasPorUsuario[userId]) {
                ventasPorUsuario[userId] = {
                    nombre: ((_a = venta.usuario) === null || _a === void 0 ? void 0 : _a.nombre) || 'SISTEMA',
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
    }
    catch (error) {
        console.error('Get sales report error:', error);
        res.status(500).json({ error: 'Error al generar reporte de ventas' });
    }
});
exports.getSalesReport = getSalesReport;
const exportSalesReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const whereClause = {
            estado: 'COMPLETADO',
        };
        if (fecha_inicio && fecha_fin) {
            const [y1, m1, d1] = fecha_inicio.split('-').map(Number);
            const [y2, m2, d2] = fecha_fin.split('-').map(Number);
            const start = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);
            const end = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);
            whereClause.fecha = { gte: start, lte: end };
        }
        const ventas = yield db_1.default.venta.findMany({
            where: whereClause,
            include: {
                detalles: { include: { producto: true } },
                cliente: true,
                usuario: true,
            },
            orderBy: { fecha: 'asc' },
        });
        const workbook = new exceljs_1.default.Workbook();
        // Hoja 1: Resumen
        const summarySheet = workbook.addWorksheet('Resumen');
        summarySheet.addRow(['REPORTE DE VENTAS - RESUMEN']);
        summarySheet.addRow(['Desde:', fecha_inicio || 'Inicio', 'Hasta:', fecha_fin || 'Fin']);
        summarySheet.addRow([]);
        // Calcular resúmenes para el Excel
        const prodSummary = {};
        const userSummary = {};
        let totalGeneral = 0;
        ventas.forEach(v => {
            totalGeneral += Number(v.total);
            const uId = v.usuario_id;
            if (!userSummary[uId])
                userSummary[uId] = { nombre: v.usuario.nombre, total: 0 };
            userSummary[uId].total += Number(v.total);
            v.detalles.forEach(d => {
                if (!prodSummary[d.producto_id])
                    prodSummary[d.producto_id] = { nombre: d.producto.nombre, cant: 0, total: 0 };
                prodSummary[d.producto_id].cant += d.cantidad;
                prodSummary[d.producto_id].total += Number(d.subtotal);
            });
        });
        summarySheet.addRow(['TOTAL GENERAL VENTAS:', totalGeneral]);
        summarySheet.addRow([]);
        summarySheet.addRow(['TOP 10 PRODUCTOS']);
        summarySheet.addRow(['Producto', 'Cantidad', 'Monto Invertido/Generado']);
        Object.values(prodSummary)
            .sort((a, b) => b.cant - a.cant)
            .slice(0, 10)
            .forEach((p) => summarySheet.addRow([p.nombre, p.cant, p.total]));
        summarySheet.addRow([]);
        summarySheet.addRow(['VENTAS POR USUARIO']);
        summarySheet.addRow(['Cajero', 'Monto Total']);
        Object.values(userSummary)
            .sort((a, b) => b.total - a.total)
            .forEach((u) => summarySheet.addRow([u.nombre, u.total]));
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
        yield workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('Export sales report error:', error);
        res.status(500).json({ error: 'Error al exportar reporte de ventas' });
    }
});
exports.exportSalesReport = exportSalesReport;
