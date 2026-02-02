import React, { useEffect, useState } from 'react';
import { clientsApi } from '../lib/api';
import { CreditCard, Plus, DollarSign, AlertTriangle, X, Eye, FileText, ShoppingBag } from 'lucide-react';

interface Debtor {
    id: number;
    nombres: string;
    apellidos?: string;
    dni_ruc?: string;
    telefono?: string;
    saldo_pendiente: number;
    limite_credito?: number;
    pagos_credito: Array<{
        id: number;
        monto: number;
        fecha: string;
        observacion?: string;
    }>;
    ventas: Array<{
        id: number;
        codigo_venta: string;
        fecha: string;
        total: number;
        detalles: Array<{
            producto: { nombre: string };
            cantidad: number;
            precio_unitario: number;
            subtotal: number;
        }>;
    }>;
}

const Credits: React.FC = () => {
    const [debtors, setDebtors] = useState<Debtor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailDebtor, setDetailDebtor] = useState<Debtor | null>(null);

    useEffect(() => {
        loadDebtors();
    }, []);

    const loadDebtors = async () => {
        try {
            const response = await clientsApi.getDebtors();
            setDebtors(response.data);
        } catch (error) {
            console.error('Error loading debtors:', error);
        } finally {
            setLoading(false);
        }
    };

    const openPaymentModal = (debtor: Debtor) => {
        setSelectedDebtor(debtor);
        setPaymentAmount('');
        setPaymentNote('');
        setShowPaymentModal(true);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDebtor) return;

        setProcessing(true);
        try {
            await clientsApi.addPayment({
                cliente_id: selectedDebtor.id,
                monto: parseFloat(paymentAmount),
                observacion: paymentNote || undefined,
            });
            setShowPaymentModal(false);
            loadDebtors();
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Error al registrar el pago');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const totalDeuda = debtors.reduce((sum, d) => sum + d.saldo_pendiente, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Créditos y Cobranzas</h1>
            </div>

            {/* Summary card */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-orange-100">Deuda Total Pendiente</p>
                        <p className="text-4xl font-bold mt-2">{formatCurrency(totalDeuda)}</p>
                        <p className="text-orange-200 mt-1">{debtors.length} clientes con deuda</p>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                        <CreditCard size={40} />
                    </div>
                </div>
            </div>

            {/* Debtors list */}
            <div className="space-y-4">
                {debtors.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No hay clientes con deuda pendiente</p>
                    </div>
                ) : (
                    debtors.map((debtor) => (
                        <div
                            key={debtor.id}
                            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                                        <AlertTriangle className="text-red-600" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-lg">
                                            {debtor.nombres} {debtor.apellidos}
                                        </h3>
                                        <p className="text-gray-500">
                                            {debtor.dni_ruc} {debtor.telefono && `• ${debtor.telefono}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-red-600">
                                            {formatCurrency(debtor.saldo_pendiente)}
                                        </p>
                                        {debtor.limite_credito && (
                                            <p className="text-sm text-gray-500">
                                                Límite: {formatCurrency(debtor.limite_credito)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setDetailDebtor(debtor);
                                                setShowDetailModal(true);
                                            }}
                                            className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all border border-blue-100"
                                            title="Ver detalle de deuda"
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <button
                                            onClick={() => openPaymentModal(debtor)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-sm"
                                        >
                                            <Plus size={20} />
                                            Abonar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent payments */}
                            {debtor.pagos_credito.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm font-medium text-gray-600 mb-2">Últimos abonos:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {debtor.pagos_credito.slice(0, 3).map((pago) => (
                                            <div
                                                key={pago.id}
                                                className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                                            >
                                                {formatCurrency(pago.monto)} - {formatDate(pago.fecha)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedDebtor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 bg-green-500 text-white flex items-center justify-between">
                            <h2 className="text-xl font-bold">Registrar Abono</h2>
                            <button onClick={() => setShowPaymentModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handlePayment} className="p-6 space-y-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-600">
                                    {selectedDebtor.nombres} {selectedDebtor.apellidos}
                                </p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    Deuda: {formatCurrency(selectedDebtor.saldo_pendiente)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monto del abono
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-xl text-center focus:ring-2 focus:ring-green-500"
                                    placeholder="0.00"
                                    max={selectedDebtor.saldo_pendiente}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observación (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
                                    placeholder="Ej: Pago parcial"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                                >
                                    {processing ? 'Procesando...' : 'Registrar Pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && detailDebtor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText size={24} />
                                Detalle de Deuda: {detailDebtor.nombres}
                            </h2>
                            <button onClick={() => setShowDetailModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="flex justify-between items-end border-b pb-4">
                                <div>
                                    <p className="text-gray-500 text-sm">Cliente</p>
                                    <p className="text-xl font-bold">{detailDebtor.nombres} {detailDebtor.apellidos}</p>
                                    <p className="text-gray-500">{detailDebtor.dni_ruc || 'Sin DNI/RUC'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500 text-sm">Saldo Pendiente</p>
                                    <p className="text-3xl font-black text-red-600">{formatCurrency(detailDebtor.saldo_pendiente)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <ShoppingBag size={18} />
                                    Ventas al Crédito Recientes
                                </h3>

                                {detailDebtor.ventas.length === 0 ? (
                                    <p className="text-center py-4 text-gray-500 italic">No hay ventas recientes registradas</p>
                                ) : (
                                    <div className="space-y-4">
                                        {detailDebtor.ventas.map((venta) => (
                                            <div key={venta.id} className="border rounded-xl p-4 bg-gray-50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase">
                                                            {venta.codigo_venta}
                                                        </span>
                                                        <p className="text-xs text-gray-500 mt-1">{formatDate(venta.fecha)}</p>
                                                    </div>
                                                    <p className="font-bold text-gray-800">{formatCurrency(venta.total)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {venta.detalles.map((det, idx) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                <span className="font-bold text-gray-400">{det.cantidad}x</span> {det.producto.nombre}
                                                            </span>
                                                            <span className="text-gray-500">{formatCurrency(det.subtotal)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Credits;
