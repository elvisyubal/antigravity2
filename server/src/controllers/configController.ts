import { Request, Response } from 'express';
import prisma from '../db';

export const getConfig = async (req: Request, res: Response) => {
    try {
        let config = await prisma.configuracion.findFirst();
        if (!config) {
            config = await prisma.configuracion.create({
                data: {
                    nombre_botica: 'Botica J&M',
                    lema: '¡Tu salud es nuestra prioridad!',
                },
            });
        }
        res.json(config);
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
};

export const updateConfig = async (req: Request, res: Response) => {
    try {
        const configData = req.body;

        if (configData.dias_vencimiento_alerta) {
            configData.dias_vencimiento_alerta = parseInt(configData.dias_vencimiento_alerta);
        }

        let config = await prisma.configuracion.findFirst();

        if (config) {
            config = await prisma.configuracion.update({
                where: { id: config.id },
                data: configData,
            });
        } else {
            config = await prisma.configuracion.create({
                data: configData,
            });
        }
        res.json(config);
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};
