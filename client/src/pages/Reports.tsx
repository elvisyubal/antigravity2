import React, { useState } from 'react';
import { reportsApi } from '../lib/api';
import { BarChart3, TrendingUp, Download, Users as UsersIcon } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6'];

const Reports: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [reportData, setReportData] = useState<any>(null);
    const [exporting, setExporting] = useState(false);

    const generateReport = async () => {
        if (!fechaInicio || !fechaFin) return;
        setLoading(true);
        try {
            const response = await reportsApi.getSales({
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            });
            setReportData(response.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const exportExcel = async () => {
        if (!fechaInicio || !fechaFin) return;
        setExporting(true);
        try {
            const response = await reportsApi.getSalesExcel({
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte_ventas_${fechaInicio}_${fechaFin}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error:', error);
            alert('Error al exportar Excel');
        } finally {
            setExporting(false);
        }
    };

    const formatCurrency = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Reportes Avanzados</h1>

            <div className="bg-white rounded-xl shadow-sm p-6 overflow-hidden">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-orange-500" />Filtro de Reporte</h2>
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <button onClick={generateReport} disabled={loading || !fechaInicio || !fechaFin} className="px-6 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 h-[42px] transition-all">
                        {loading ? 'Generando...' : 'Generar Reporte'}
                    </button>
                    <button onClick={exportExcel} disabled={exporting || !fechaInicio || !fechaFin} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 h-[42px] transition-all">
                        {exporting ? 'Exportando...' : <><Download size={18} /> Descargar Excel</>}
                    </button>
                </div>
            </div>

            {reportData && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border-b-4 border-orange-500">
                            <p className="text-gray-500 text-sm font-medium uppercase">Total Ingresos</p>
                            <p className="text-3xl font-bold text-orange-600 mt-1">{formatCurrency(reportData.resumen.totalVentas)}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border-b-4 border-blue-500">
                            <p className="text-gray-500 text-sm font-medium uppercase">Operaciones</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{reportData.resumen.cantidadVentas}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border-b-4 border-red-500">
                            <p className="text-gray-500 text-sm font-medium uppercase">Descuentos Aplicados</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(reportData.resumen.totalDescuentos)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Chart: Top Products */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-orange-500" />
                                Top 10 Productos más Vendidos
                            </h3>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={reportData.productosMasVendidos.map((p: any) => ({
                                            name: p.producto.nombre.substring(0, 15) + (p.producto.nombre.length > 15 ? '...' : ''),
                                            cantidad: p.cantidad,
                                            fullName: p.producto.nombre
                                        }))}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                                        <Tooltip
                                            formatter={(value: any) => [value, 'Cantidad']}
                                            labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                                        />
                                        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                                            {reportData.productosMasVendidos.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Chart: Sales by User */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <UsersIcon size={20} className="text-blue-500" />
                                Ventas por Cajero (Monto)
                            </h3>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={reportData.ventasPorCajero.map((u: any) => ({
                                            name: u.nombre,
                                            total: u.total
                                        }))}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(value) => `S/ ${value}`} />
                                        <Tooltip formatter={(value: any) => [formatCurrency(value), 'Total Vendido']} />
                                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Table Summary */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                            <h3 className="font-bold text-gray-700">Detalle de Productos</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reportData.productosMasVendidos.map((p: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-800 font-medium">{p.producto.nombre}</td>
                                            <td className="px-6 py-4 text-sm text-center text-gray-600">{p.cantidad}</td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-orange-600">{formatCurrency(p.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;

