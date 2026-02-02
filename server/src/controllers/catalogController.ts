import { Request, Response } from 'express';
import prisma from '../db';

// ============ CATEGORIAS ============
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.categoria.findMany({
            include: {
                _count: {
                    select: { productos: true },
                },
            },
        });
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { nombre, descripcion } = req.body;
        const category = await prisma.categoria.create({
            data: { nombre, descripcion },
        });
        res.json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Error al crear categoría' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        const category = await prisma.categoria.update({
            where: { id: parseInt(id as string) },
            data: { nombre, descripcion },
        });
        res.json(category);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.categoria.delete({
            where: { id: parseInt(id as string) },
        });
        res.json({ message: 'Categoría eliminada' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
};

// ============ PROVEEDORES ============
export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await prisma.proveedor.findMany({
            include: {
                _count: {
                    select: { productos: true, compras: true },
                },
            },
        });
        res.json(suppliers);
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const { ruc, nombre, telefono, correo, direccion } = req.body;
        const supplier = await prisma.proveedor.create({
            data: { ruc, nombre, telefono, correo, direccion },
        });
        res.json(supplier);
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Error al crear proveedor' });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const supplier = await prisma.proveedor.update({
            where: { id: parseInt(id as string) },
            data,
        });
        res.json(supplier);
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.proveedor.delete({
            where: { id: parseInt(id as string) },
        });
        res.json({ message: 'Proveedor eliminado' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
};
