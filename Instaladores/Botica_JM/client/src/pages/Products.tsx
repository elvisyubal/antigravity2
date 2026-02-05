import React, { useEffect, useState } from 'react';
import { productsApi, catalogApi, configApi } from '../lib/api';
import { useLocation } from 'react-router-dom';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    AlertTriangle,
    Package,
    PlusCircle,
    X,
    FileDown,
    Upload,
} from 'lucide-react';

interface Product {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    categoria_id: number;
    categoria?: { nombre: string };
    proveedor_id?: number;
    proveedor?: { nombre: string };
    precio_compra: number;
    precio_venta: number;
    stock_actual: number;
    stock_minimo: number;
    estado: boolean;
    es_fraccionable: boolean;
    unidades_por_caja: number;
    precio_unidad?: number;
    lotes?: Array<{
        id: number;
        codigo_lote: string;
        fecha_vencimiento: string;
        stock_actual: number;
    }>;
}

interface Category {
    id: number;
    nombre: string;
}

const Products: React.FC = () => {
    const location = useLocation();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState<number | ''>('');
    const [alertDays, setAlertDays] = useState(30);
    const [showModal, setShowModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [batchData, setBatchData] = useState({
        codigo_lote: '',
        fecha_vencimiento: '',
        cantidad: '0',
        esUnidad: false
    });
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);


    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria_id: '',
        precio_compra: '',
        precio_venta: '',
        stock_minimo: '5',
        stock_inicial: '0',
        codigo_lote: '',
        fecha_vencimiento: '',
        es_fraccionable: false,
        unidades_por_caja: '1',
        precio_unidad: '',
    });

    useEffect(() => {
        loadData();
    }, [location.search]);

    const loadData = async () => {
        try {
            const [productsRes, categoriesRes, configRes] = await Promise.all([
                productsApi.getAll(),
                catalogApi.getCategories(),
                configApi.get().catch(() => ({ data: { dias_vencimiento_alerta: 30 } })),
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
            setAlertDays(Number(configRes.data.dias_vencimiento_alerta || 30));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter((p: Product) => {
        const queryParams = new URLSearchParams(location.search);
        const urlFilter = queryParams.get('filter');

        const matchesSearch =
            !search ||
            p.nombre.toLowerCase().includes(search.toLowerCase()) ||
            p.codigo.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
            !filterCategory || p.categoria_id === filterCategory;

        let matchesUrlFilter = true;
        if (urlFilter === 'low-stock') {
            matchesUrlFilter = p.stock_actual <= p.stock_minimo;
        } else if (urlFilter === 'expiring') {
            const thresholdDays = alertDays;
            const thresholdDate = new Date();
            thresholdDate.setDate(thresholdDate.getDate() + thresholdDays);
            matchesUrlFilter = p.lotes?.some((lote: any) => {
                const vence = new Date(lote.fecha_vencimiento);
                return vence <= thresholdDate && vence >= new Date() && lote.stock_actual > 0;
            }) || false;
        }

        return p.estado !== false && matchesSearch && matchesCategory && matchesUrlFilter;
    });

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                codigo: product.codigo,
                nombre: product.nombre,
                descripcion: product.descripcion || '',
                categoria_id: String(product.categoria_id),
                precio_compra: String(product.precio_compra),
                precio_venta: String(product.precio_venta),
                stock_minimo: String(product.stock_minimo),
                stock_inicial: String(product.stock_actual), // Solo referencia
                codigo_lote: product.lotes?.[0]?.codigo_lote || '',
                fecha_vencimiento: product.lotes?.[0]?.fecha_vencimiento ? product.lotes[0].fecha_vencimiento.split('T')[0] : '',
                es_fraccionable: product.es_fraccionable,
                unidades_por_caja: String(product.unidades_por_caja),
                precio_unidad: product.precio_unidad ? String(product.precio_unidad) : '',
            });
        } else {
            setEditingProduct(null);
            setFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                categoria_id: '',
                precio_compra: '',
                precio_venta: '',
                stock_minimo: '5',
                stock_inicial: '0',
                codigo_lote: '',
                fecha_vencimiento: '',
                es_fraccionable: false,
                unidades_por_caja: '1',
                precio_unidad: '',
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                categoria_id: parseInt(formData.categoria_id),
                precio_compra: parseFloat(formData.precio_compra),
                precio_venta: parseFloat(formData.precio_venta),
                stock_minimo: parseInt(formData.stock_minimo),
                unidades_por_caja: parseInt(formData.unidades_por_caja),
                precio_unidad: formData.precio_unidad ? parseFloat(formData.precio_unidad) : null,
            };

            // Para nuevos productos, enviamos lote si hay información o stock
            if (!editingProduct && (formData.stock_inicial !== '0' || formData.codigo_lote || formData.fecha_vencimiento)) {
                (data as any).lote = {
                    codigo_lote: formData.codigo_lote || 'L-001',
                    fecha_vencimiento: formData.fecha_vencimiento || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                    cantidad: parseInt(formData.stock_inicial || '0'),
                };
            }

            if (editingProduct) {
                await productsApi.update(editingProduct.id, data);
            } else {
                await productsApi.create(data);
            }

            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar el producto');
        }
    };

    const handleBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        try {
            const data = {
                codigo_lote: batchData.codigo_lote,
                fecha_vencimiento: batchData.fecha_vencimiento,
                cantidad: parseInt(batchData.cantidad),
                es_unidad: batchData.esUnidad
            };
            await productsApi.addStock(selectedProduct.id, data);
            setShowBatchModal(false);
            loadData();
        } catch (error) {
            console.error('Error adding stock:', error);
            alert('Error al agregar stock');
        }
    };

    const deleteProduct = async (id: number) => {
        if (!confirm('¿Estás seguro de desactivar este producto?')) return;
        try {
            await productsApi.delete(id);
            loadData();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await productsApi.getTemplate();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Plantilla_Productos_BoticaJM.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Error al descargar la plantilla');
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        try {
            const res = await productsApi.import(importFile);
            alert(`Importación completada: ${res.data.creados} productos creados.`);
            if (res.data.errores.length > 0) {
                console.error('Errores en importación:', res.data.errores);
                alert(`Hubo ${res.data.errores.length} errores. Revisa la consola.`);
            }
            setShowImportModal(false);
            setImportFile(null);
            loadData();
        } catch (error: any) {
            console.error('Error importing:', error);
            alert(error.response?.data?.error || 'Error al importar');
        } finally {
            setImporting(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                    >
                        <Upload size={20} />
                        Importar Excel
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium"
                    >
                        <Plus size={20} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : '')}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="">Todas las categorías</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Products table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-orange-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Código</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Producto</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Categoría</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">P. Compra</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">P. Venta</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Stock</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono">{product.codigo}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <Package className="text-orange-500" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{product.nombre}</p>
                                                {product.descripcion && (
                                                    <p className="text-xs text-gray-500 truncate max-w-xs">
                                                        {product.descripcion}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {product.categoria?.nombre}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                        {formatCurrency(product.precio_compra)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">
                                        {formatCurrency(product.precio_venta)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${product.stock_actual <= product.stock_minimo
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}
                                        >
                                            {product.stock_actual <= product.stock_minimo && (
                                                <AlertTriangle size={12} />
                                            )}
                                            {product.stock_actual}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setBatchData({
                                                        codigo_lote: '',
                                                        fecha_vencimiento: '',
                                                        cantidad: '0',
                                                        esUnidad: !product.es_fraccionable
                                                    });
                                                    setShowBatchModal(true);
                                                }}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                title="Ingreso de Mercadería"
                                            >
                                                <PlusCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => openModal(product)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.codigo}
                                        onChange={(e) =>
                                            setFormData({ ...formData, codigo: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoría
                                    </label>
                                    <select
                                        value={formData.categoria_id}
                                        onChange={(e) =>
                                            setFormData({ ...formData, categoria_id: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombre: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) =>
                                        setFormData({ ...formData, descripcion: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        P. Compra
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_compra}
                                        onChange={(e) =>
                                            setFormData({ ...formData, precio_compra: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        P. Venta
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_venta}
                                        onChange={(e) =>
                                            setFormData({ ...formData, precio_venta: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock Mín. (Unidades)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.stock_minimo}
                                        onChange={(e) =>
                                            setFormData({ ...formData, stock_minimo: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                {!editingProduct && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock Inicial ({formData.es_fraccionable ? 'Cajas' : 'Físico'})
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.stock_inicial}
                                            onChange={(e) =>
                                                setFormData({ ...formData, stock_inicial: e.target.value })
                                            }
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 font-bold text-orange-600"
                                            placeholder="0"
                                            required
                                        />
                                        <p className="text-[10px] text-gray-500">
                                            {formData.es_fraccionable ? `Equivale a ${parseInt(formData.stock_inicial || '0') * (parseInt(formData.unidades_por_caja || '1'))} unidades` : ''}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="es_fraccionable"
                                        checked={formData.es_fraccionable}
                                        onChange={(e) => setFormData({ ...formData, es_fraccionable: e.target.checked })}
                                        className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="es_fraccionable" className="text-sm font-bold text-blue-800">
                                        Venta Fraccionada (Unidades/Pastillas)
                                    </label>
                                </div>

                                {formData.es_fraccionable && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Unidades por Caja
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.unidades_por_caja}
                                                onChange={(e) => setFormData({ ...formData, unidades_por_caja: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Precio por Unidad
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.precio_unidad}
                                                onChange={(e) => setFormData({ ...formData, precio_unidad: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-orange-50 rounded-xl space-y-4">
                                <h3 className="font-bold text-orange-800 text-sm">
                                    Información de Lote
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {editingProduct ? 'Stock Actual' : 'Stock a Ingresar'}
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.stock_inicial}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 italic"
                                            disabled
                                        />
                                        <p className="text-[10px] text-gray-500">El stock se sincroniza con el campo superior.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Código Lote
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.codigo_lote}
                                            onChange={(e) =>
                                                setFormData({ ...formData, codigo_lote: e.target.value })
                                            }
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                            placeholder="L-001"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha Vencimiento
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.fecha_vencimiento}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fecha_vencimiento: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all"
                                >
                                    {editingProduct ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 bg-green-600 text-white flex items-center justify-between">
                            <h2 className="text-xl font-bold">Importar Productos</h2>
                            <button onClick={() => setShowImportModal(false)}><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-blue-50 rounded-xl">
                                <p className="text-sm text-blue-800 mb-3">
                                    Para importar productos, primero descarga la plantilla, llénala con la información necesaria y súbela aquí.
                                </p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center gap-2 text-blue-600 font-bold hover:underline"
                                >
                                    <FileDown size={18} />
                                    Descargar Plantilla Excel
                                </button>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <Upload className="text-gray-400" size={40} />
                                    <span className="text-sm font-medium text-gray-600">
                                        {importFile ? importFile.name : 'Haz clic para seleccionar archivo Excel'}
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={!importFile || importing}
                                    onClick={handleImport}
                                    className={`flex-1 py-3 text-white font-bold rounded-lg transition-all ${!importFile || importing ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {importing ? 'Importando...' : 'Iniciar Importación'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Entry Modal */}
            {showBatchModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 bg-green-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PlusCircle size={20} />
                                <h2 className="text-xl font-bold">Ingreso de Mercadería</h2>
                            </div>
                            <button onClick={() => setShowBatchModal(false)}><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-bold">Producto</p>
                                <p className="text-sm font-medium text-gray-800">{selectedProduct.nombre}</p>
                                <p className="text-[10px] text-gray-400">Stock Actual: {selectedProduct.stock_actual} unidades</p>
                            </div>

                            <form onSubmit={handleBatchSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Lote</label>
                                    <input
                                        type="text"
                                        value={batchData.codigo_lote}
                                        onChange={(e) => setBatchData({ ...batchData, codigo_lote: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
                                        placeholder="Ej: L-102030"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cant. ({selectedProduct.es_fraccionable ? 'Cajas' : 'Físico'})</label>
                                        <input
                                            type="number"
                                            value={batchData.cantidad}
                                            onChange={(e) => setBatchData({ ...batchData, cantidad: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 font-bold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                                        <input
                                            type="date"
                                            value={batchData.fecha_vencimiento}
                                            onChange={(e) => setBatchData({ ...batchData, fecha_vencimiento: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                </div>
                                {selectedProduct.es_fraccionable && (
                                    <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                                        <input
                                            type="checkbox"
                                            id="modal_es_unidad"
                                            checked={batchData.esUnidad}
                                            onChange={(e) => setBatchData({ ...batchData, esUnidad: e.target.checked })}
                                            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="modal_es_unidad" className="text-sm font-bold text-blue-800">
                                            Ingresando Unidades Sueltas (Pastillas)
                                        </label>
                                    </div>
                                )}

                                {selectedProduct.es_fraccionable && (
                                    <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-100 italic">
                                        * Se sumarán {batchData.esUnidad ? parseInt(batchData.cantidad || '0') : parseInt(batchData.cantidad || '0') * selectedProduct.unidades_por_caja} unidades al stock.
                                    </p>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowBatchModal(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                                    >
                                        Confirmar Ingreso
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
