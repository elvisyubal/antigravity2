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
exports.getCashRegisterHistory = exports.getCurrentCashRegister = exports.closeCashRegister = exports.openCashRegister = void 0;
const db_1 = __importDefault(require("../db"));
const openCashRegister = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { monto_inicial } = req.body;
        // Verificar si ya hay una caja abierta para el usuario
        const existingOpen = yield db_1.default.caja.findFirst({
            where: {
                usuario_id: req.userId,
                estado: 'ABIERTA',
            },
        });
        if (existingOpen) {
            return res.status(400).json({ error: 'Ya tienes una caja abierta' });
        }
        const caja = yield db_1.default.caja.create({
            data: {
                usuario_id: req.userId,
                monto_inicial,
            },
        });
        res.json(caja);
    }
    catch (error) {
        console.error('Open cash register error:', error);
        res.status(500).json({ error: 'Error al abrir caja' });
    }
});
exports.openCashRegister = openCashRegister;
const closeCashRegister = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { monto_final, observaciones } = req.body;
        const caja = yield db_1.default.caja.findUnique({
            where: { id: parseInt(id) },
        });
        if (!caja || caja.estado !== 'ABIERTA') {
            return res.status(400).json({ error: 'Caja no encontrada o ya cerrada' });
        }
        // Calcular ventas del período
        const ventas = yield db_1.default.venta.findMany({
            where: {
                fecha: {
                    gte: caja.fecha_apertura,
                },
                usuario_id: req.userId,
                estado: 'COMPLETADO',
            },
        });
        const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
        const montoEsperado = Number(caja.monto_inicial) + totalVentas;
        const diferencia = monto_final - montoEsperado;
        const cajaActualizada = yield db_1.default.caja.update({
            where: { id: parseInt(id) },
            data: {
                fecha_cierre: new Date(),
                monto_final,
                diferencia,
                estado: 'CERRADA',
                observaciones,
            },
        });
        res.json({
            caja: cajaActualizada,
            resumen: {
                montoInicial: caja.monto_inicial,
                totalVentas,
                montoEsperado,
                montoFinal: monto_final,
                diferencia,
            },
        });
    }
    catch (error) {
        console.error('Close cash register error:', error);
        res.status(500).json({ error: 'Error al cerrar caja' });
    }
});
exports.closeCashRegister = closeCashRegister;
const getCurrentCashRegister = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const caja = yield db_1.default.caja.findFirst({
            where: {
                usuario_id: req.userId,
                estado: 'ABIERTA',
            },
            include: {
                movimientos: true,
            },
        });
        if (!caja) {
            return res.json({ open: false });
        }
        // Calcular totales de ventas desde apertura
        const ventas = yield db_1.default.venta.findMany({
            where: {
                fecha: {
                    gte: caja.fecha_apertura,
                },
                usuario_id: req.userId,
                estado: 'COMPLETADO',
            },
        });
        const ventasPorMetodo = ventas.reduce((acc, v) => {
            acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + Number(v.total);
            return acc;
        }, {});
        res.json({
            open: true,
            caja,
            totales: {
                ventas: ventas.reduce((sum, v) => sum + Number(v.total), 0),
                cantidadVentas: ventas.length,
                porMetodo: ventasPorMetodo,
            },
        });
    }
    catch (error) {
        console.error('Get current cash register error:', error);
        res.status(500).json({ error: 'Error al obtener estado de caja' });
    }
});
exports.getCurrentCashRegister = getCurrentCashRegister;
const getCashRegisterHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cajas = yield db_1.default.caja.findMany({
            include: {
                usuario: {
                    select: { nombre: true, username: true },
                },
            },
            orderBy: {
                fecha_apertura: 'desc',
            },
            take: 50,
        });
        res.json(cajas);
    }
    catch (error) {
        console.error('Get cash register history error:', error);
        res.status(500).json({ error: 'Error al obtener historial de cajas' });
    }
});
exports.getCashRegisterHistory = getCashRegisterHistory;
