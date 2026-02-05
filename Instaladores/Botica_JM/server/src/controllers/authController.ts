import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_botica_jm_2026';

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        console.log(`Intento de login para usuario: ${username}`);

        const user = await prisma.usuario.findUnique({
            where: { username },
        });

        if (!user || !user.activo) {
            console.log('Usuario no encontrado o inactivo');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`Validación de contraseña para ${username}: ${isValidPassword}`);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, rol: user.rol, permisos: user.permisos },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                username: user.username,
                rol: user.rol,
                permisos: user.permisos,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, username, password, rol, permisos } = req.body;

        const existingUser = await prisma.usuario.findUnique({
            where: { username },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.usuario.create({
            data: {
                nombre,
                username,
                password: hashedPassword,
                rol: rol || 'CAJERO',
                permisos: permisos || null,
            },
        });

        res.json({
            message: 'Usuario creado exitosamente',
            user: {
                id: newUser.id,
                nombre: newUser.nombre,
                username: newUser.username,
                rol: newUser.rol,
                permisos: newUser.permisos,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                username: true,
                rol: true,
                activo: true,
                permisos: true,
                fecha_creacion: true,
            },
            orderBy: {
                nombre: 'asc'
            }
        });
        console.log(`Get Users: ${users.length} usuarios encontrados`);
        // Log para depurar permisos del primer usuario no admin si existe
        const nonAdmin = users.find(u => u.rol !== 'ADMIN');
        if (nonAdmin) {
            console.log('Sample User Permissions:', JSON.stringify(nonAdmin.permisos, null, 2));
        }
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as any;
        const { nombre, username, password, rol, activo, permisos } = req.body;
        console.log('Update User Request Body:', JSON.stringify(req.body, null, 2));

        const updateData: any = {
            nombre,
            username,
            rol,
            activo,
            permisos
        };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                nombre: true,
                username: true,
                rol: true,
                activo: true,
                permisos: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as any;
        const userId = parseInt(id);

        // Verificar si el usuario tiene registros asociados (ventas, cajas)
        const hasSales = await prisma.venta.findFirst({ where: { usuario_id: userId } });
        const hasCash = await prisma.caja.findFirst({ where: { usuario_id: userId } });

        if (hasSales || hasCash) {
            return res.status(400).json({
                error: 'No se puede eliminar un usuario con historial. Desactívelo en su lugar.'
            });
        }

        await prisma.usuario.delete({
            where: { id: userId }
        });

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as any;
        const user = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const updatedUser = await prisma.usuario.update({
            where: { id: user.id },
            data: { activo: !user.activo },
            select: {
                id: true,
                nombre: true,
                username: true,
                rol: true,
                activo: true,
                permisos: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ error: 'Error al cambiar estado de usuario' });
    }
};
