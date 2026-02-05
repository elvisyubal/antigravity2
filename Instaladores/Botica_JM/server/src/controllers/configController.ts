import { Request, Response } from 'express';
import prisma from '../db';
import { runBackup } from '../utils/backupService';

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

        if (configData.backup_frecuencia_dias) {
            configData.backup_frecuencia_dias = parseInt(configData.backup_frecuencia_dias);
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

export const triggerBackup = async (req: Request, res: Response) => {
    try {
        const path = await runBackup();
        res.json({ message: 'Backup completado con éxito', path });
    } catch (error) {
        console.error('Trigger backup error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: `Error al realizar el backup: ${errorMessage}` });
    }
};
