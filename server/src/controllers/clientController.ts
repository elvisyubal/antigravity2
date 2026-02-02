import { Request, Response } from 'express';
import prisma from '../db';

export const getClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.cliente.findMany({
            orderBy: {
                nombres: 'asc',
            },
        });
        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};

export const getClientById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const client = await prisma.cliente.findUnique({
            where: { id: parseInt(id as string) },
            include: {
                ventas: {
                    include: {
                        detalles: true,
                    },
                },
                pagos_credito: true,
            },
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(client);
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
};

export const createClient = async (req: Request, res: Response) => {
    try {
        const clientData = req.body;

        const client = await prisma.cliente.create({
            data: clientData,
        });

        res.json(client);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

export const updateClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const clientData = req.body;

        const client = await prisma.cliente.update({
            where: { id: parseInt(id as string) },
            data: clientData,
        });

        res.json(client);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

export const addPayment = async (req: Request, res: Response) => {
    try {
        const { cliente_id, monto, observacion } = req.body;

        const payment = await prisma.pagoCredito.create({
            data: {
                cliente_id,
                monto,
                observacion,
            },
        });

        // Actualizar saldo pendiente del cliente
        await prisma.cliente.update({
            where: { id: cliente_id },
            data: {
                saldo_pendiente: {
                    decrement: monto,
                },
            },
        });

        res.json(payment);
    } catch (error) {
        console.error('Add payment error:', error);
        res.status(500).json({ error: 'Error al registrar pago' });
    }
};

export const getDebtors = async (req: Request, res: Response) => {
    try {
        const debtors = await prisma.cliente.findMany({
            where: {
                saldo_pendiente: {
                    gt: 0,
                },
            },
            include: {
                pagos_credito: {
                    orderBy: {
                        fecha: 'desc',
                    },
                    take: 5,
                },
                ventas: {
                    where: {
                        metodo_pago: 'CREDITO',
                        estado: 'COMPLETADO'
                    },
                    include: {
                        detalles: {
                            include: {
                                producto: true
                            }
                        }
                    },
                    orderBy: {
                        fecha: 'desc'
                    }
                }
            },
            orderBy: {
                saldo_pendiente: 'desc',
            },
        });

        res.json(debtors);
    } catch (error) {
        console.error('Get debtors error:', error);
        res.status(500).json({ error: 'Error al obtener deudores' });
    }
};
