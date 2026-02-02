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
exports.getDebtors = exports.addPayment = exports.updateClient = exports.createClient = exports.getClientById = exports.getClients = void 0;
const db_1 = __importDefault(require("../db"));
const getClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clients = yield db_1.default.cliente.findMany({
            orderBy: {
                nombres: 'asc',
            },
        });
        res.json(clients);
    }
    catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});
exports.getClients = getClients;
const getClientById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const client = yield db_1.default.cliente.findUnique({
            where: { id: parseInt(id) },
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
    }
    catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});
exports.getClientById = getClientById;
const createClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clientData = req.body;
        const client = yield db_1.default.cliente.create({
            data: clientData,
        });
        res.json(client);
    }
    catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});
exports.createClient = createClient;
const updateClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const clientData = req.body;
        const client = yield db_1.default.cliente.update({
            where: { id: parseInt(id) },
            data: clientData,
        });
        res.json(client);
    }
    catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});
exports.updateClient = updateClient;
const addPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cliente_id, monto, observacion } = req.body;
        const payment = yield db_1.default.pagoCredito.create({
            data: {
                cliente_id,
                monto,
                observacion,
            },
        });
        // Actualizar saldo pendiente del cliente
        yield db_1.default.cliente.update({
            where: { id: cliente_id },
            data: {
                saldo_pendiente: {
                    decrement: monto,
                },
            },
        });
        res.json(payment);
    }
    catch (error) {
        console.error('Add payment error:', error);
        res.status(500).json({ error: 'Error al registrar pago' });
    }
});
exports.addPayment = addPayment;
const getDebtors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const debtors = yield db_1.default.cliente.findMany({
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
    }
    catch (error) {
        console.error('Get debtors error:', error);
        res.status(500).json({ error: 'Error al obtener deudores' });
    }
});
exports.getDebtors = getDebtors;
