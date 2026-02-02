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
exports.toggleUserStatus = exports.deleteUser = exports.updateUser = exports.getUsers = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_botica_jm_2026';
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        console.log(`Intento de login para usuario: ${username}`);
        const user = yield db_1.default.usuario.findUnique({
            where: { username },
        });
        if (!user || !user.activo) {
            console.log('Usuario no encontrado o inactivo');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const isValidPassword = yield bcryptjs_1.default.compare(password, user.password);
        console.log(`Validación de contraseña para ${username}: ${isValidPassword}`);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                username: user.username,
                rol: user.rol,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});
exports.login = login;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nombre, username, password, rol } = req.body;
        const existingUser = yield db_1.default.usuario.findUnique({
            where: { username },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield db_1.default.usuario.create({
            data: {
                nombre,
                username,
                password: hashedPassword,
                rol: rol || 'CAJERO',
            },
        });
        res.json({
            message: 'Usuario creado exitosamente',
            user: {
                id: newUser.id,
                nombre: newUser.nombre,
                username: newUser.username,
                rol: newUser.rol,
            },
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});
exports.register = register;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield db_1.default.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                username: true,
                rol: true,
                activo: true,
                fecha_creacion: true,
            },
            orderBy: {
                nombre: 'asc'
            }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});
exports.getUsers = getUsers;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { nombre, username, password, rol, activo } = req.body;
        const updateData = {
            nombre,
            username,
            rol,
            activo
        };
        if (password && password.trim() !== '') {
            updateData.password = yield bcryptjs_1.default.hash(password, 10);
        }
        const updatedUser = yield db_1.default.usuario.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                nombre: true,
                username: true,
                rol: true,
                activo: true
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        // Verificar si el usuario tiene registros asociados (ventas, cajas)
        const hasSales = yield db_1.default.venta.findFirst({ where: { usuario_id: userId } });
        const hasCash = yield db_1.default.caja.findFirst({ where: { usuario_id: userId } });
        if (hasSales || hasCash) {
            return res.status(400).json({
                error: 'No se puede eliminar un usuario con historial. Desactívelo en su lugar.'
            });
        }
        yield db_1.default.usuario.delete({
            where: { id: userId }
        });
        res.json({ message: 'Usuario eliminado exitosamente' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});
exports.deleteUser = deleteUser;
const toggleUserStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield db_1.default.usuario.findUnique({ where: { id: parseInt(id) } });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const updatedUser = yield db_1.default.usuario.update({
            where: { id: user.id },
            data: { activo: !user.activo },
            select: {
                id: true,
                nombre: true,
                username: true,
                rol: true,
                activo: true
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ error: 'Error al cambiar estado de usuario' });
    }
});
exports.toggleUserStatus = toggleUserStatus;
