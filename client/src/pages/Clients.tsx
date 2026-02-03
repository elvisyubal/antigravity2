import React, { useEffect, useState } from 'react';
import { clientsApi } from '../lib/api';
import { Search, Plus, Edit, X, Users, Phone } from 'lucide-react';

interface Client {
    id: number;
    dni_ruc?: string;
    nombres: string;
    apellidos?: string;
    telefono?: string;
    direccion?: string;
    tipo: string;
    limite_credito?: number;
    saldo_pendiente: number;
}

const Clients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [formData, setFormData] = useState({
        dni_ruc: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        direccion: '',
        tipo: 'CONTADO',
        limite_credito: '',
    });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const response = await clientsApi.getAll();
            setClients(response.data);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(
        (c) =>
            !search ||
            c.nombres.toLowerCase().includes(search.toLowerCase()) ||
            c.dni_ruc?.includes(search)
    );

    const openModal = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                dni_ruc: client.dni_ruc || '',
                nombres: client.nombres,
                apellidos: client.apellidos || '',
                telefono: client.telefono || '',
                direccion: client.direccion || '',
                tipo: client.tipo,
                limite_credito: client.limite_credito ? String(client.limite_credito) : '',
            });
        } else {
            setEditingClient(null);
            setFormData({
                dni_ruc: '',
                nombres: '',
                apellidos: '',
                telefono: '',
                direccion: '',
                tipo: 'CONTADO',
                limite_credito: '',
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                limite_credito: formData.limite_credito
                    ? parseFloat(formData.limite_credito)
                    : null,
            };

            if (editingClient) {
                await clientsApi.update(editingClient.id, data);
            } else {
                await clientsApi.create(data);
            }

            setShowModal(false);
            loadClients();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar el cliente');
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
                <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre o DNI/RUC..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-96 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
            </div>

            {/* Clients grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                    <div
                        key={client.id}
                        className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Users className="text-orange-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        {client.nombres} {client.apellidos}
                                    </h3>
                                    {client.dni_ruc && (
                                        <p className="text-sm text-gray-500">{client.dni_ruc}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => openModal(client)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                                <Edit size={18} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-2">
                            {client.telefono && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone size={14} />
                                    {client.telefono}
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${client.tipo === 'CREDITO'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {client.tipo}
                                </span>
                                {client.saldo_pendiente > 0 && (
                                    <span className="text-sm font-medium text-red-600">
                                        Debe: {formatCurrency(Number(client.saldo_pendiente))}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Client Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                            <button onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        DNI/RUC
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.dni_ruc}
                                        onChange={(e) =>
                                            setFormData({ ...formData, dni_ruc: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo
                                    </label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tipo: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="CONTADO">Contado</option>
                                        <option value="CREDITO">Crédito</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombres
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nombres}
                                        onChange={(e) =>
                                            setFormData({ ...formData, nombres: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Apellidos
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.apellidos}
                                        onChange={(e) =>
                                            setFormData({ ...formData, apellidos: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) =>
                                            setFormData({ ...formData, telefono: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                {formData.tipo === 'CREDITO' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Límite Crédito
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.limite_credito}
                                            onChange={(e) =>
                                                setFormData({ ...formData, limite_credito: e.target.value })
                                            }
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={formData.direccion}
                                    onChange={(e) =>
                                        setFormData({ ...formData, direccion: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
                                />
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
                                    {editingClient ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
