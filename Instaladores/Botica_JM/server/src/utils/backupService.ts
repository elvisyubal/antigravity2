import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import prisma from '../db';

export const runBackup = async (manualPath?: string) => {
    try {
        const config = await prisma.configuracion.findFirst();
        const backupPath = manualPath || config?.backup_ruta || 'C:\\Backups\\Botica_JM';

        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup_botica_jm_${timestamp}.sql`;
        const fullPath = path.join(backupPath, fileName);

        // Parse DATABASE_URL
        const dbUrl = process.env.DATABASE_URL || '';
        const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
        const match = dbUrl.match(regex);

        if (!match) throw new Error('Cadena de conexión DATABASE_URL inválida');

        let [_, user, password, host, port, dbname] = match;

        // Decodificar password por si tiene caracteres especiales
        password = decodeURIComponent(password);

        // FORZAR IPv4 para evitar el error de localhost (::1) de la captura
        if (host === 'localhost') host = '127.0.0.1';

        // Path a pg_dump (ajustado a la versión encontrada)
        const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';

        // El comando usa comillas para PGPASSWORD para máxima compatibilidad en Windows
        const command = `set "PGPASSWORD=${password}" && "${pgDumpPath}" -h ${host} -p ${port} -U ${user} -F p -b -v -f "${fullPath}" ${dbname}`;

        console.log('Ejecutando comando de backup en host:', host);

        return new Promise((resolve, reject) => {
            exec(command, async (error, stdout, stderr) => {
                if (error) {
                    console.error('Error al ejecutar backup (stderr):', stderr);
                    console.error('Error al ejecutar backup (error):', error);
                    reject(new Error(`pg_dump falló: ${stderr || error.message}`));
                    return;
                }

                // Actualizar fecha de último backup
                await prisma.configuracion.updateMany({
                    data: { ultimo_backup: new Date() }
                });

                resolve(fullPath);
            });
        });
    } catch (error) {
        console.error('Error en servicio de backup:', error);
        throw error;
    }
};

export const initBackupCron = () => {
    cron.schedule('0 * * * *', async () => {
        const config = await prisma.configuracion.findFirst();
        if (!config || !config.backup_habilitado || !config.backup_ruta) return;

        const now = new Date();
        const [hours, minutes] = (config.backup_hora || "03:00").split(':').map(Number);

        if (now.getHours() === hours) {
            const lastBackup = config.ultimo_backup ? new Date(config.ultimo_backup) : new Date(0);
            const diffDays = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= config.backup_frecuencia_dias) {
                try {
                    await runBackup();
                } catch (error) {
                    console.error('Fallo en backup programado:', error);
                }
            }
        }
    });
};
