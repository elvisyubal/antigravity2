import { Request, Response } from 'express';
import prisma from '../db';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export const downloadTemplate = async (req: Request, res: Response) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Plantilla Productos');

        worksheet.columns = [
            { header: 'CODIGO_BARRAS', key: 'codigo', width: 20 },
            { header: 'NOMBRE_PRODUCTO', key: 'nombre', width: 35 },
            { header: 'CATEGORIA', key: 'categoria', width: 20 },
            { header: 'PRECIO_COMPRA', key: 'precio_compra', width: 15 },
            { header: 'PRECIO_VENTA', key: 'precio_venta', width: 15 },
            { header: 'ES_FRACCIONABLE_SI_NO', key: 'es_fraccionable', width: 25 },
            { header: 'UNIDADES_POR_CAJA', key: 'unidades_caja', width: 20 },
            { header: 'PRECIO_UNIDAD', key: 'precio_unidad', width: 15 },
            { header: 'STOCK_INICIAL', key: 'stock_actual', width: 15 },
            { header: 'STOCK_MINIMO', key: 'stock_minimo', width: 15 },
            { header: 'CODIGO_LOTE', key: 'lote', width: 15 },
            { header: 'VENCIMIENTO_AAAA_MM_DD', key: 'vencimiento', width: 20 },
            { header: 'DESCRIPCION', key: 'descripcion', width: 30 },
        ];

        // Example row
        worksheet.addRow({
            codigo: '7750123456789',
            nombre: 'Paracetamol 500mg',
            categoria: 'Analgesicos',
            precio_compra: 10.50,
            precio_venta: 15.00,
            es_fraccionable: 'SI',
            unidades_caja: 100,
            precio_unidad: 0.20,
            stock_actual: 50,
            stock_minimo: 10,
            lote: 'LT100',
            vencimiento: '2026-12-31',
            descripcion: 'Caja de 100 unidades',
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=' + 'Plantilla_Productos_BoticaJM.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Download template error:', error);
        res.status(500).json({ error: 'Error al generar la plantilla' });
    }
};

export const importProducts = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.getWorksheet(1);

        const productsToCreate = [];
        const errors = [];

        // Leer filas saltando la cabecera
        for (let i = 2; i <= (worksheet?.rowCount || 0); i++) {
            const row = worksheet?.getRow(i);
            if (!row || !row.getCell(1).value) continue;

            const rowData = {
                codigo: row.getCell(1).text.trim(),
                nombre: row.getCell(2).text.trim(),
                categoriaName: row.getCell(3).text.trim(),
                precio_compra: parseFloat(row.getCell(4).text) || 0,
                precio_venta: parseFloat(row.getCell(5).text) || 0,
                es_fraccionable: row.getCell(6).text.toUpperCase() === 'SI',
                unidades_por_caja: parseInt(row.getCell(7).text) || 1,
                precio_unidad: parseFloat(row.getCell(8).text) || null,
                stock_actual: parseInt(row.getCell(9).text) || 0,
                stock_minimo: parseInt(row.getCell(10).text) || 5,
                lote_codigo: row.getCell(11).text.trim(),
                vencimiento: row.getCell(12).text.trim(),
                descripcion: row.getCell(13).text.trim(),
            };

            try {
                // 1. Manejar Categoría
                let categoria = await prisma.categoria.findFirst({
                    where: { nombre: { equals: rowData.categoriaName, mode: 'insensitive' } }
                });

                if (!categoria) {
                    categoria = await prisma.categoria.create({
                        data: { nombre: rowData.categoriaName }
                    });
                }

                // 2. Crear Producto
                const product = await prisma.producto.create({
                    data: {
                        codigo: rowData.codigo,
                        nombre: rowData.nombre,
                        descripcion: rowData.descripcion,
                        categoria_id: categoria.id,
                        precio_compra: rowData.precio_compra,
                        precio_venta: rowData.precio_venta,
                        stock_actual: rowData.stock_actual,
                        stock_minimo: rowData.stock_minimo,
                        es_fraccionable: rowData.es_fraccionable,
                        unidades_por_caja: rowData.unidades_por_caja,
                        precio_unidad: rowData.precio_unidad,
                    }
                });

                // 3. Crear Lote Inicial
                if (rowData.stock_actual > 0) {
                    await prisma.lote.create({
                        data: {
                            producto_id: product.id,
                            codigo_lote: rowData.lote_codigo || 'LOTE-INI',
                            fecha_vencimiento: rowData.vencimiento ? new Date(rowData.vencimiento) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                            stock_inicial: rowData.stock_actual,
                            stock_actual: rowData.stock_actual,
                        }
                    });
                }

                productsToCreate.push(product);
            } catch (err: any) {
                console.error(`Error en fila ${i}:`, err.message);
                errors.push({ fila: i, error: err.message });
            }
        }

        // Limpiar archivo temporal
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Importación finalizada',
            creados: productsToCreate.length,
            errores: errors
        });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Error interno al procesar el archivo' });
    }
};
