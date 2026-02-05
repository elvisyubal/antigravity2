import React, { useEffect, useState } from 'react';
import { cashApi } from '../lib/api';
import { Lock, Unlock, Clock, X } from 'lucide-react';

const Cash: React.FC = () => {
    const [currentCash, setCurrentCash] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [montoInicial, setMontoInicial] = useState('');
    const [montoFinal, setMontoFinal] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [currentRes, historyRes] = await Promise.all([cashApi.getCurrent(), cashApi.getHistory()]);
            setCurrentCash(currentRes.data);
            setHistory(historyRes.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleOpenCash = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await cashApi.open(parseFloat(montoInicial));
            setShowOpenModal(false);
            loadData();
        } catch (error: any) { alert(error.response?.data?.error || 'Error'); }
        finally { setProcessing(false); }
    };

    const handleCloseCash = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCash?.caja) return;
        setProcessing(true);
        try {
            await cashApi.close(currentCash.caja.id, { monto_final: parseFloat(montoFinal), observaciones });
            setShowCloseModal(false);
            loadData();
        } catch (error: any) { alert(error.response?.data?.error || 'Error'); }
        finally { setProcessing(false); }
    };

    const formatCurrency = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);
    const formatDateTime = (d: string) => new Date(d).toLocaleString('es-PE');

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Caja</h1>

            <div className={`rounded-xl p-6 ${currentCash?.open ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                            {currentCash?.open ? <Unlock size={32} /> : <Lock size={32} />}
                        </div>
                        <div>
                            <p className="text-xl font-bold">{currentCash?.open ? 'Caja Abierta' : 'Caja Cerrada'}</p>
                            {currentCash?.open && currentCash.caja && (
                                <p className="text-white/80">Inicial: {formatCurrency(currentCash.caja.monto_inicial)}</p>
                            )}
                        </div>
                    </div>
                    {currentCash?.open ? (
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-3xl font-bold">{formatCurrency(currentCash.totales?.ventas || 0)}</p>
                                <p className="text-white/80 text-sm">{currentCash.totales?.cantidadVentas || 0} ventas</p>
                            </div>
                            <button onClick={() => setShowCloseModal(true)} className="px-6 py-3 bg-white text-red-600 font-bold rounded-lg">Cerrar Caja</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowOpenModal(true)} className="px-6 py-3 bg-white text-green-600 font-bold rounded-lg">Abrir Caja</button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b"><h2 className="text-lg font-semibold flex items-center gap-2"><Clock size={20} />Historial</h2></div>
                <table className="w-full">
                    <thead className="bg-orange-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm">Fecha</th>
                            <th className="px-4 py-3 text-right text-sm">Inicial</th>
                            <th className="px-4 py-3 text-right text-sm">Final</th>
                            <th className="px-4 py-3 text-center text-sm">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {history.map((c) => (
                            <tr key={c.id}>
                                <td className="px-4 py-3 text-sm">{formatDateTime(c.fecha_apertura)}</td>
                                <td className="px-4 py-3 text-sm text-right">{formatCurrency(c.monto_inicial)}</td>
                                <td className="px-4 py-3 text-sm text-right">{c.monto_final ? formatCurrency(c.monto_final) : '-'}</td>
                                <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${c.estado === 'ABIERTA' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{c.estado}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showOpenModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-4 bg-green-500 text-white flex justify-between"><h2 className="text-xl font-bold">Abrir Caja</h2><button onClick={() => setShowOpenModal(false)}><X size={24} /></button></div>
                        <form onSubmit={handleOpenCash} className="p-6 space-y-4">
                            <input type="number" step="0.01" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-xl text-center" placeholder="Monto inicial" required />
                            <div className="flex gap-3"><button type="button" onClick={() => setShowOpenModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg">Cancelar</button><button type="submit" disabled={processing} className="flex-1 py-3 bg-green-500 text-white rounded-lg">{processing ? '...' : 'Abrir'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showCloseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-4 bg-red-500 text-white flex justify-between"><h2 className="text-xl font-bold">Cerrar Caja</h2><button onClick={() => setShowCloseModal(false)}><X size={24} /></button></div>
                        <form onSubmit={handleCloseCash} className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-center"><p className="text-3xl font-bold text-orange-600">{formatCurrency(currentCash?.totales?.ventas || 0)}</p></div>
                            <input type="number" step="0.01" value={montoFinal} onChange={(e) => setMontoFinal(e.target.value)} className="w-full px-4 py-3 rounded-lg border text-xl text-center" placeholder="Conteo físico" required />
                            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-3 py-2 rounded-lg border" rows={2} placeholder="Observaciones" />
                            <div className="flex gap-3"><button type="button" onClick={() => setShowCloseModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg">Cancelar</button><button type="submit" disabled={processing} className="flex-1 py-3 bg-red-500 text-white rounded-lg">{processing ? '...' : 'Cerrar'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cash;
