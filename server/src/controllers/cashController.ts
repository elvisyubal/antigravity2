import { Request, Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const openCashRegister = async (req: AuthRequest, res: Response) => {
    try {
        const { monto_inicial } = req.body;

        // Verificar si ya hay una caja abierta para el usuario
        const existingOpen = await prisma.caja.findFirst({
            where: {
                usuario_id: req.userId!,
                estado: 'ABIERTA',
            },
        });

        if (existingOpen) {
            return res.status(400).json({ error: 'Ya tienes una caja abierta' });
        }

        const caja = await prisma.caja.create({
            data: {
                usuario_id: req.userId!,
                monto_inicial,
            },
        });

        res.json(caja);
    } catch (error) {
        console.error('Open cash register error:', error);
        res.status(500).json({ error: 'Error al abrir caja' });
    }
};

export const closeCashRegister = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { monto_final, observaciones } = req.body;

        const caja = await prisma.caja.findUnique({
            where: { id: parseInt(id as string) },
        });

        if (!caja || caja.estado !== 'ABIERTA') {
            return res.status(400).json({ error: 'Caja no encontrada o ya cerrada' });
        }

        // Calcular ventas del período
        const ventas = await prisma.venta.findMany({
            where: {
                fecha: {
                    gte: caja.fecha_apertura,
                },
                usuario_id: req.userId!,
                estado: 'COMPLETADO',
            },
        });

        const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
        const montoEsperado = Number(caja.monto_inicial) + totalVentas;
        const diferencia = monto_final - montoEsperado;

        const cajaActualizada = await prisma.caja.update({
            where: { id: parseInt(id as string) },
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
    } catch (error) {
        console.error('Close cash register error:', error);
        res.status(500).json({ error: 'Error al cerrar caja' });
    }
};

export const getCurrentCashRegister = async (req: AuthRequest, res: Response) => {
    try {
        const caja = await prisma.caja.findFirst({
            where: {
                usuario_id: req.userId!,
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
        const ventas = await prisma.venta.findMany({
            where: {
                fecha: {
                    gte: caja.fecha_apertura,
                },
                usuario_id: req.userId!,
                estado: 'COMPLETADO',
            },
        });

        const ventasPorMetodo = ventas.reduce((acc: any, v) => {
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
    } catch (error) {
        console.error('Get current cash register error:', error);
        res.status(500).json({ error: 'Error al obtener estado de caja' });
    }
};

export const getCashRegisterHistory = async (req: Request, res: Response) => {
    try {
        const cajas = await prisma.caja.findMany({
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
    } catch (error) {
        console.error('Get cash register history error:', error);
        res.status(500).json({ error: 'Error al obtener historial de cajas' });
    }
};
