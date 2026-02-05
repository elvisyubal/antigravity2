import React, { useState, useEffect } from 'react';
import { salesApi, configApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { printTicket } from '../lib/print';
import {
    Search,
    Printer,
    Eye,
    XCircle,
    FileText
} from 'lucide-react';

interface Sale {
    id: number;
    codigo_venta: string;
    fecha: string;
    total: number;
    metodo_pago: string;
    estado: string;
    cliente?: { nombres: string; apellidos?: string };
    usuario: { nombre: string };
    detalles: any[];
}
const Sales: React.FC = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [config, setConfig] = useState<any>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        loadSales();
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await configApi.get();
            setConfig(res.data);
        } catch (error) { console.error(error); }
    };

    const loadSales = async () => {
        setLoading(true);
        try {
            const response = await salesApi.getAll({
                fecha_inicio: fechaInicio || undefined,
                fecha_fin: fechaFin || undefined
            });
            setSales(response.data);
        } catch (error) {
            console.error('Error loading sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);
    const formatDate = (d: string) => new Date(d).toLocaleString('es-PE');

    const handlePrint = (sale: Sale) => {
        printTicket(sale, config);
    };

    const handleCancelSale = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que deseas anular esta venta? Esta acción no se puede deshacer.')) return;

        setCancelling(true);
        try {
            await salesApi.cancel(id);
            alert('Venta anulada exitosamente');
            setSelectedSale(null);
            loadSales();
        } catch (error: any) {
            console.error('Error cancelling sale:', error);
            alert(error.response?.data?.error || 'Error al anular la venta');
        } finally {
            setCancelling(false);
        }
    };

    const filteredSales = sales.filter(s =>
        s.codigo_venta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.cliente?.nombres || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Historial de Ventas</h1>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar venta o cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full md:w-64"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                        <button
                            onClick={loadSales}
                            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cód. Venta</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Método Pago</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No se encontraron ventas</td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-orange-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800">{sale.codigo_venta}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sale.fecha)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {sale.cliente ? `${sale.cliente.nombres} ${sale.cliente.apellidos || ''}` : 'CONTADO'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-orange-600">{formatCurrency(sale.total)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{sale.metodo_pago}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.estado === 'COMPLETADO' ? 'bg-green-100 text-green-700' :
                                                sale.estado === 'ANULADO' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {sale.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedSale(sale)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver Detalles"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(sale)}
                                                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                    title="Imprimir Ticket"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                {user?.rol === 'ADMIN' && sale.estado !== 'ANULADO' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelSale(sale.id);
                                                        }}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Anular Venta"
                                                        disabled={cancelling}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalle */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between bg-orange-500 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText /> Detalle de Venta {selectedSale.codigo_venta}
                            </h2>
                            <button onClick={() => setSelectedSale(null)} className="hover:bg-white/20 p-1 rounded-full">
                                <XCircle />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Fecha y Hora</p>
                                    <p className="font-medium">{formatDate(selectedSale.fecha)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Cajero</p>
                                    <p className="font-medium">{selectedSale.usuario.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Cliente</p>
                                    <p className="font-medium">{selectedSale.cliente ? `${selectedSale.cliente.nombres} ${selectedSale.cliente.apellidos || ''}` : 'CONTADO'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Método de Pago</p>
                                    <p className="font-medium">{selectedSale.metodo_pago}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold border-b pb-2 mb-3">Productos</h3>
                                <div className="space-y-3">
                                    {selectedSale.detalles.map((d: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{d.producto.nombre}</p>
                                                <p className="text-sm text-gray-500">{d.cantidad} x {formatCurrency(d.precio_unitario)}</p>
                                            </div>
                                            <p className="font-bold">{formatCurrency(d.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center text-lg">
                                    <p className="font-bold text-gray-800">TOTAL</p>
                                    <p className="text-2xl font-black text-orange-600">{formatCurrency(selectedSale.total)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedSale(null)}
                                className="px-6 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => handlePrint(selectedSale)}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 flex items-center gap-2"
                            >
                                <Printer size={18} /> Imprimir Ticket
                            </button>
                            {user?.rol === 'ADMIN' && selectedSale.estado !== 'ANULADO' && (
                                <button
                                    onClick={() => handleCancelSale(selectedSale.id)}
                                    disabled={cancelling}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <XCircle size={18} /> {cancelling ? 'Anulando...' : 'Anular Venta'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
