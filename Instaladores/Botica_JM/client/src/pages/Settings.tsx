import React, { useState, useEffect } from 'react';
import { catalogApi, authApi, configApi } from '../lib/api';
import { Plus, Edit, Trash2, X, Users, Tag, Truck, Building2, Save, Power, PowerOff, Database, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MODULES = ['Productos', 'Ventas', 'Clientes', 'Reportes', 'Caja', 'Configuracion'];
const ACTIONS = ['ver', 'crear', 'editar', 'eliminar', 'anular', 'admin'];

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('categories');
    const [categories, setCategories] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [formData, setFormData] = useState<any>({});

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        try {
            if (tab === 'categories') { const res = await catalogApi.getCategories(); setCategories(res.data); }
            else if (tab === 'suppliers') { const res = await catalogApi.getSuppliers(); setSuppliers(res.data); }
            else if (tab === 'users') { const res = await authApi.getUsers(); setUsers(res.data); }
            else if (tab === 'pharmacy' || tab === 'database') { const res = await configApi.get(); setFormData(res.data); }
        } catch (error) { console.error(error); }
    };

    const openModal = (type: string, data?: any) => {
        setModalType(type);
        if (type === 'user') {
            setFormData({
                ...data,
                permisos: data?.permisos || {}
            });
        } else {
            setFormData(data || (type === 'user' ? { permisos: {} } : {}));
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalType === 'category') {
                if (formData.id) await catalogApi.updateCategory(formData.id, formData);
                else await catalogApi.createCategory(formData);
            } else if (modalType === 'supplier') {
                if (formData.id) await catalogApi.updateSupplier(formData.id, formData);
                else await catalogApi.createSupplier(formData);
            } else if (modalType === 'user') {
                // Asegurarse de enviar permisos
                const dataToSend = {
                    ...formData,
                    permisos: formData.permisos || {}
                };
                if (formData.id) await authApi.updateUser(formData.id, dataToSend);
                else await authApi.register(dataToSend);
            } else if (tab === 'pharmacy' || tab === 'database') {
                await configApi.update(formData);
                alert('Configuración actualizada');
            }
            setShowModal(false);
            loadData();
        } catch (error: any) { alert(error.response?.data?.error || 'Error'); }
    };

    const handleDelete = async (type: string, id: number) => {
        if (!confirm('¿Eliminar?')) return;
        try {
            if (type === 'category') await catalogApi.deleteCategory(id);
            else if (type === 'supplier') await catalogApi.deleteSupplier(id);
            else if (type === 'user') await authApi.deleteUser(id);
            loadData();
        } catch (error: any) { alert(error.response?.data?.error || 'Error'); }
    };

    const handleToggleUser = async (user: any) => {
        try {
            await authApi.toggleUserStatus(user.id);
            loadData();
        } catch (error) { console.error(error); }
    };

    const togglePermission = (modulo: string, accion: string) => {
        setFormData((prev: any) => {
            const permisos = prev.permisos || {};
            const accionesModulo = permisos[modulo] || [];

            let nuevasAcciones;
            if (accionesModulo.includes(accion)) {
                nuevasAcciones = accionesModulo.filter((a: string) => a !== accion);
            } else {
                nuevasAcciones = [...accionesModulo, accion];
            }

            return {
                ...prev,
                permisos: {
                    ...permisos,
                    [modulo]: nuevasAcciones
                }
            };
        });
    };

    if (user?.rol !== 'ADMIN') return <div className="text-center p-12 text-gray-500">Acceso denegado</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>

            <div className="flex gap-2 border-b overflow-x-auto">
                {[
                    { id: 'categories', label: 'Categorías', icon: Tag },
                    { id: 'suppliers', label: 'Proveedores', icon: Truck },
                    { id: 'users', label: 'Usuarios', icon: Users },
                    { id: 'pharmacy', label: 'Botica', icon: Building2 },
                    { id: 'database', label: 'Base de Datos', icon: Database },
                ].map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap ${tab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}>
                        <t.icon size={18} />{t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                {tab === 'categories' && (
                    <>
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-semibold">Categorías</h2>
                            <button onClick={() => openModal('category')} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg"><Plus size={18} />Nueva</button>
                        </div>
                        <div className="space-y-2">
                            {categories.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div><p className="font-medium">{c.nombre}</p><p className="text-sm text-gray-500">{c.descripcion}</p></div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal('category', c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete('category', c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {tab === 'suppliers' && (
                    <>
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-semibold">Proveedores</h2>
                            <button onClick={() => openModal('supplier')} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg"><Plus size={18} />Nuevo</button>
                        </div>
                        <div className="space-y-2">
                            {suppliers.map((s) => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div><p className="font-medium">{s.nombre}</p><p className="text-sm text-gray-500">RUC: {s.ruc} • {s.telefono}</p></div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal('supplier', s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete('supplier', s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {tab === 'users' && (
                    <>
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-semibold">Usuarios</h2>
                            <button onClick={() => openModal('user')} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg"><Plus size={18} />Nuevo</button>
                        </div>
                        <div className="space-y-2">
                            {users.map((u) => (
                                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.activo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium">{u.nombre}</p>
                                            <p className="text-sm text-gray-500">@{u.username} • {u.rol}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                        <div className="flex gap-1 ml-4">
                                            <button
                                                onClick={() => handleToggleUser(u)}
                                                className={`p-2 rounded-lg transition-colors ${u.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                title={u.activo ? "Inhabilitar" : "Activar"}
                                            >
                                                {u.activo ? <PowerOff size={18} /> : <Power size={18} />}
                                            </button>
                                            <button
                                                onClick={() => openModal('user', u)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete('user', u.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {tab === 'database' && (
                    <div className="max-w-2xl">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Database className="text-orange-600" size={24} />
                            Configuración de Backups (Copias de Seguridad)
                        </h2>
                        <div className="space-y-6">
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-orange-900">Backup Automático</h3>
                                    <p className="text-sm text-orange-700">Programar copias de seguridad automáticas del sistema.</p>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, backup_habilitado: !formData.backup_habilitado })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.backup_habilitado ? 'bg-orange-500' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.backup_habilitado ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruta de destino (Carpeta en el servidor)</label>
                                    <input
                                        type="text"
                                        placeholder="C:\Backups\Botica_JM"
                                        value={formData.backup_ruta || ''}
                                        onChange={(e) => setFormData({ ...formData, backup_ruta: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 italic">* El servidor debe tener permisos de escritura en esta ruta.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia (Cada cuántos días)</label>
                                    <input
                                        type="number"
                                        value={formData.backup_frecuencia_dias || 1}
                                        onChange={(e) => setFormData({ ...formData, backup_frecuencia_dias: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de ejecución</label>
                                    <input
                                        type="time"
                                        value={formData.backup_hora || '03:00'}
                                        onChange={(e) => setFormData({ ...formData, backup_hora: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all shadow-md"
                                >
                                    <Save size={20} /> Guardar Configuración
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!confirm('¿Desea realizar un backup ahora? Esto podría tardar unos segundos.')) return;
                                        try {
                                            const res = await configApi.triggerBackup();
                                            alert(res.data.message + '\nUbicación: ' + res.data.path);
                                            loadData();
                                        } catch (err: any) {
                                            alert(err.response?.data?.error || 'Error al generar backup');
                                        }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md"
                                >
                                    <Download size={20} /> Generar Backup Ahora
                                </button>
                            </div>

                            {formData.ultimo_backup && (
                                <p className="text-center text-sm text-gray-500">
                                    Último backup realizado: <span className="font-bold text-gray-700">{new Date(formData.ultimo_backup).toLocaleString()}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'pharmacy' && (
                    <div className="max-w-2xl">
                        <h2 className="text-lg font-semibold mb-6">Información de la Botica</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                                    <input type="text" value={formData.nombre_botica || ''} onChange={(e) => setFormData({ ...formData, nombre_botica: e.target.value })} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                                    <input type="text" value={formData.ruc || ''} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lema o Slogan</label>
                                <input type="text" value={formData.lema || ''} onChange={(e) => setFormData({ ...formData, lema: e.target.value })} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input type="text" value={formData.direccion || ''} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input type="text" value={formData.telefono || ''} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                    <input type="email" value={formData.correo || ''} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cierre de Ticket (Pie de página)</label>
                                <textarea value={formData.pie_pagina_ticket || ''} onChange={(e) => setFormData({ ...formData, pie_pagina_ticket: e.target.value })} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" rows={2} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Días para alerta de vencimiento</label>
                                <input type="number" value={formData.dias_vencimiento_alerta || 30} onChange={(e) => setFormData({ ...formData, dias_vencimiento_alerta: e.target.value })} className="w-32 px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500" min="1" />
                                <p className="text-xs text-gray-500 mt-1">Los productos que venzan en este rango de días aparecerán en las alertas del dashboard.</p>
                            </div>
                            <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all shadow-md">
                                <Save size={20} /> Guardar Cambios
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`bg-white rounded-2xl w-full ${modalType === 'user' ? 'max-w-4xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
                        <div className="p-4 bg-orange-500 text-white flex justify-between sticky top-0 z-10">
                            <h2 className="text-xl font-bold">{modalType === 'category' ? 'Categoría' : modalType === 'supplier' ? 'Proveedor' : 'Usuario'}</h2>
                            <button onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {modalType === 'category' && (
                                <>
                                    <input type="text" placeholder="Nombre" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 rounded-lg border" required />
                                    <input type="text" placeholder="Descripción" value={formData.descripcion || ''} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-3 py-2 rounded-lg border" />
                                </>
                            )}
                            {modalType === 'supplier' && (
                                <>
                                    <input type="text" placeholder="RUC" value={formData.ruc || ''} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} className="w-full px-3 py-2 rounded-lg border" required />
                                    <input type="text" placeholder="Nombre" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 rounded-lg border" required />
                                    <input type="text" placeholder="Teléfono" value={formData.telefono || ''} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="w-full px-3 py-2 rounded-lg border" />
                                </>
                            )}
                            {modalType === 'user' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-700">Datos Generales</h3>
                                        <input type="text" placeholder="Nombre completo" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 rounded-lg border" required />
                                        <input type="text" placeholder="Usuario" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 rounded-lg border" required />
                                        <input type="password" placeholder={formData.id ? "Nueva contraseña (opcional)" : "Contraseña"} value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border" required={!formData.id} />
                                        <select value={formData.rol || 'CAJERO'} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} className="w-full px-3 py-2 rounded-lg border">
                                            <option value="CAJERO">Cajero</option>
                                            <option value="VENDEDOR">Vendedor</option>
                                            <option value="ADMIN">Administrador</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-700">Permisos Personalizados</h3>
                                        <p className="text-xs text-gray-500 mb-2">Seleccione las acciones permitidas para este usuario por módulo.</p>
                                        <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-4">
                                            {MODULES.map(modulo => (
                                                <div key={modulo}>
                                                    <h4 className="font-bold text-sm text-gray-800 mb-2 border-b">{modulo}</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {ACTIONS.map(accion => (
                                                            <label key={accion} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(formData.permisos?.[modulo] || []).includes(accion)}
                                                                    onChange={() => togglePermission(modulo, accion)}
                                                                    className="rounded text-orange-500 focus:ring-orange-500"
                                                                />
                                                                <span className="capitalize">{accion === 'admin' ? 'Admin Total' : accion}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4 border-t"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-lg">Guardar</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
