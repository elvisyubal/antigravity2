import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuario.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            nombre: 'Administrador',
            username: 'admin',
            password: hashedPassword,
            rol: 'ADMIN',
        },
    });
    console.log('Created admin user:', admin.username);

    // Create cajero user
    const cajeroPassword = await bcrypt.hash('cajero123', 10);
    const cajero = await prisma.usuario.upsert({
        where: { username: 'cajero' },
        update: {},
        create: {
            nombre: 'Cajero Principal',
            username: 'cajero',
            password: cajeroPassword,
            rol: 'CAJERO',
        },
    });
    console.log('Created cajero user:', cajero.username);

    // Create categories
    const categories = [
        { nombre: 'Medicamentos', descripcion: 'Medicamentos generales' },
        { nombre: 'Vitaminas', descripcion: 'Suplementos vitamínicos' },
        { nombre: 'Cuidado Personal', descripcion: 'Productos de higiene y cuidado' },
        { nombre: 'Bebés', descripcion: 'Productos para bebés' },
        { nombre: 'Primeros Auxilios', descripcion: 'Botiquín y emergencias' },
    ];

    for (const cat of categories) {
        await prisma.categoria.upsert({
            where: { nombre: cat.nombre },
            update: {},
            create: cat,
        });
    }
    console.log('Created categories');

    // Create supplier
    const supplier = await prisma.proveedor.upsert({
        where: { ruc: '20123456789' },
        update: {},
        create: {
            ruc: '20123456789',
            nombre: 'Distribuidora Farmacéutica S.A.',
            telefono: '01-555-1234',
            correo: 'ventas@distrifarm.com',
            direccion: 'Av. Industrial 123, Lima',
        },
    });
    console.log('Created supplier:', supplier.nombre);

    // Get category IDs
    const medicamentos = await prisma.categoria.findUnique({ where: { nombre: 'Medicamentos' } });
    const vitaminas = await prisma.categoria.findUnique({ where: { nombre: 'Vitaminas' } });
    const cuidado = await prisma.categoria.findUnique({ where: { nombre: 'Cuidado Personal' } });

    // Create products
    const products = [
        { codigo: '7751234567890', nombre: 'Paracetamol 500mg', descripcion: 'Tabletas x 100', categoria_id: medicamentos!.id, proveedor_id: supplier.id, precio_compra: 15.00, precio_venta: 25.00, stock_actual: 50, stock_minimo: 10 },
        { codigo: '7751234567891', nombre: 'Ibuprofeno 400mg', descripcion: 'Tabletas x 50', categoria_id: medicamentos!.id, proveedor_id: supplier.id, precio_compra: 12.00, precio_venta: 20.00, stock_actual: 30, stock_minimo: 10 },
        { codigo: '7751234567892', nombre: 'Amoxicilina 500mg', descripcion: 'Cápsulas x 21', categoria_id: medicamentos!.id, proveedor_id: supplier.id, precio_compra: 18.00, precio_venta: 32.00, stock_actual: 25, stock_minimo: 5 },
        { codigo: '7751234567893', nombre: 'Vitamina C 1000mg', descripcion: 'Tabletas efervescentes x 10', categoria_id: vitaminas!.id, proveedor_id: supplier.id, precio_compra: 8.00, precio_venta: 15.00, stock_actual: 40, stock_minimo: 10 },
        { codigo: '7751234567894', nombre: 'Multivitamínico', descripcion: 'Tabletas x 30', categoria_id: vitaminas!.id, proveedor_id: supplier.id, precio_compra: 25.00, precio_venta: 45.00, stock_actual: 20, stock_minimo: 5 },
        { codigo: '7751234567895', nombre: 'Alcohol 70%', descripcion: 'Frasco 250ml', categoria_id: cuidado!.id, proveedor_id: supplier.id, precio_compra: 4.00, precio_venta: 8.00, stock_actual: 60, stock_minimo: 15 },
        { codigo: '7751234567896', nombre: 'Algodón 100g', descripcion: 'Bolsa', categoria_id: cuidado!.id, proveedor_id: supplier.id, precio_compra: 3.00, precio_venta: 6.00, stock_actual: 45, stock_minimo: 10 },
        { codigo: '7751234567897', nombre: 'Omeprazol 20mg', descripcion: 'Cápsulas x 14', categoria_id: medicamentos!.id, proveedor_id: supplier.id, precio_compra: 10.00, precio_venta: 18.00, stock_actual: 35, stock_minimo: 8 },
    ];

    for (const prod of products) {
        const existing = await prisma.producto.findUnique({ where: { codigo: prod.codigo } });
        if (!existing) {
            await prisma.producto.create({ data: prod });
        }
    }
    console.log('Created products');

    // Create a sample client
    await prisma.cliente.upsert({
        where: { dni_ruc: '12345678' },
        update: {},
        create: {
            dni_ruc: '12345678',
            nombres: 'Juan',
            apellidos: 'Pérez García',
            telefono: '987654321',
            direccion: 'Av. Principal 456',
            tipo: 'CREDITO',
            limite_credito: 500.00,
            saldo_pendiente: 0,
        },
    });
    console.log('Created sample client');

    console.log('Seed completed!');
    console.log('\n=== Credenciales de acceso ===');
    console.log('Admin: admin / admin123');
    console.log('Cajero: cajero / cajero123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
