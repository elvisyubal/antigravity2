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
exports.triggerBackup = exports.updateConfig = exports.getConfig = void 0;
const db_1 = __importDefault(require("../db"));
const backupService_1 = require("../utils/backupService");
const getConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let config = yield db_1.default.configuracion.findFirst();
        if (!config) {
            config = yield db_1.default.configuracion.create({
                data: {
                    nombre_botica: 'Botica J&M',
                    lema: '¡Tu salud es nuestra prioridad!',
                },
            });
        }
        res.json(config);
    }
    catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});
exports.getConfig = getConfig;
const updateConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const configData = req.body;
        if (configData.dias_vencimiento_alerta) {
            configData.dias_vencimiento_alerta = parseInt(configData.dias_vencimiento_alerta);
        }
        if (configData.backup_frecuencia_dias) {
            configData.backup_frecuencia_dias = parseInt(configData.backup_frecuencia_dias);
        }
        let config = yield db_1.default.configuracion.findFirst();
        if (config) {
            config = yield db_1.default.configuracion.update({
                where: { id: config.id },
                data: configData,
            });
        }
        else {
            config = yield db_1.default.configuracion.create({
                data: configData,
            });
        }
        res.json(config);
    }
    catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});
exports.updateConfig = updateConfig;
const triggerBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const path = yield (0, backupService_1.runBackup)();
        res.json({ message: 'Backup completado con éxito', path });
    }
    catch (error) {
        console.error('Trigger backup error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: `Error al realizar el backup: ${errorMessage}` });
    }
});
exports.triggerBackup = triggerBackup;
