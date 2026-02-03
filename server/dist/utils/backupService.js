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
exports.initBackupCron = exports.runBackup = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../db"));
const runBackup = (manualPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield db_1.default.configuracion.findFirst();
        const backupPath = manualPath || (config === null || config === void 0 ? void 0 : config.backup_ruta) || 'C:\\Backups\\Botica_JM';
        if (!fs_1.default.existsSync(backupPath)) {
            fs_1.default.mkdirSync(backupPath, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup_botica_jm_${timestamp}.sql`;
        const fullPath = path_1.default.join(backupPath, fileName);
        // Parse DATABASE_URL
        const dbUrl = process.env.DATABASE_URL || '';
        const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
        const match = dbUrl.match(regex);
        if (!match)
            throw new Error('Cadenas de conexión DATABASE_URL inválida');
        const [_, user, password, host, port, dbname] = match;
        // Path a pg_dump (ajustado a la versión encontrada)
        const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';
        // El comando usa PGPASSWORD para evitar el prompt de contraseña
        const command = `set PGPASSWORD=${password} && "${pgDumpPath}" -h ${host} -p ${port} -U ${user} -F p -b -v -f "${fullPath}" ${dbname}`;
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(command, (error, stdout, stderr) => __awaiter(void 0, void 0, void 0, function* () {
                if (error) {
                    console.error('Error al ejecutar backup:', error);
                    reject(error);
                    return;
                }
                // Actualizar fecha de último backup
                yield db_1.default.configuracion.updateMany({
                    data: { ultimo_backup: new Date() }
                });
                resolve(fullPath);
            }));
        });
    }
    catch (error) {
        console.error('Error en servicio de backup:', error);
        throw error;
    }
});
exports.runBackup = runBackup;
const initBackupCron = () => {
    // Ejecutar cada hora para verificar si corresponde hacer backup
    node_cron_1.default.schedule('0 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        const config = yield db_1.default.configuracion.findFirst();
        if (!config || !config.backup_habilitado || !config.backup_ruta)
            return;
        const now = new Date();
        const [hours, minutes] = (config.backup_hora || "03:00").split(':').map(Number);
        // Verificar si es la hora configurada
        if (now.getHours() === hours) {
            const lastBackup = config.ultimo_backup ? new Date(config.ultimo_backup) : new Date(0);
            const diffDays = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= config.backup_frecuencia_dias) {
                console.log('Iniciando backup programado...');
                try {
                    yield (0, exports.runBackup)();
                    console.log('Backup programado completado con éxito.');
                }
                catch (error) {
                    console.error('Fallo en backup programado:', error);
                }
            }
        }
    }));
};
exports.initBackupCron = initBackupCron;
