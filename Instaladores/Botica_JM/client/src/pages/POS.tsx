import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { productsApi, salesApi, clientsApi, cashApi, configApi } from '../lib/api';
import { db, syncProducts, syncClients, addOfflineSale } from '../lib/db';
import { printTicket } from '../lib/print';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    Smartphone,
    X,
    Check,
    Printer,
    ShoppingBag,
} from 'lucide-react';

interface Product {
    id: number;
    codigo: string;
    nombre: string;
    precio_venta: number;
    stock_actual: number;
    categoria?: { nombre: string };
    es_fraccionable: boolean;
    unidades_por_caja: number;
    precio_unidad?: number;
    estado: boolean;
}

interface CartItem {
    product: Product;
    cantidad: number;
    es_unidad: boolean;
}

interface Client {
    id: number;
    nombres: string;
    apellidos?: string;
    dni_ruc?: string;
    saldo_pendiente: number;
    tipo: string;
}

const POS: React.FC = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [descuento, setDescuento] = useState(0);
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [montoRecibido, setMontoRecibido] = useState(0);
    const [cashOpen, setCashOpen] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [saleComplete, setSaleComplete] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        loadData();
        checkCashRegister();
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await configApi.get();
            setConfig(res.data);
        } catch (error) { console.error(error); }
    };

    const loadData = async () => {
        try {
            const [productsRes, clientsRes] = await Promise.all([
                productsApi.getAll(),
                clientsApi.getAll(),
            ]);
            setProducts(productsRes.data);
            setClients(clientsRes.data);

            // Sync to offline DB
            await syncProducts(productsRes.data);
            await syncClients(clientsRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
            // Load from offline DB
            const offlineProducts = await db.products.toArray();
            const offlineClients = await db.clients.toArray();
            setProducts(offlineProducts.map(p => ({ ...p, id: p.serverId || p.id! } as any as Product)));
            setClients(offlineClients.map(c => ({ ...c, id: c.serverId || c.id! } as Client)));
        } finally {
            setLoading(false);
        }
    };

    const checkCashRegister = async () => {
        try {
            const response = await cashApi.getCurrent();
            setCashOpen(response.data.open);
        } catch (error) {
            console.error('Error checking cash register:', error);
        }
    };

    const filteredProducts = useMemo(() => {
        if (!search) return products.filter(p => p.stock_actual > 0 && p.estado !== false);
        const searchLower = search.toLowerCase();
        return products.filter(
            (p) =>
                p.stock_actual > 0 &&
                p.estado !== false &&
                (p.nombre.toLowerCase().includes(searchLower) ||
                    p.codigo.toLowerCase().includes(searchLower))
        );
    }, [products, search]);

    const addToCart = (product: Product, esUnidad: boolean = false) => {
        const totalUnitsInCart = cart
            .filter(item => item.product.id === product.id)
            .reduce((sum, item) => sum + (item.es_unidad ? item.cantidad : item.cantidad * product.unidades_por_caja), 0);

        const unidadesNecesarias = esUnidad ? 1 : product.unidades_por_caja;

        if (totalUnitsInCart + unidadesNecesarias <= product.stock_actual) {
            const existing = cart.find(
                (item) => item.product.id === product.id && item.es_unidad === esUnidad
            );

            if (existing) {
                setCart(
                    cart.map((item) =>
                        item.product.id === product.id && item.es_unidad === esUnidad
                            ? { ...item, cantidad: item.cantidad + 1 }
                            : item
                    )
                );
            } else {
                setCart([...cart, { product, cantidad: 1, es_unidad: esUnidad }]);
            }
        } else {
            alert('Stock insuficiente para agregar más de este producto');
        }
    };

    const updateQuantity = (productId: number, esUnidad: boolean, delta: number) => {
        setCart(
            cart
                .map((item) => {
                    if (item.product.id === productId && item.es_unidad === esUnidad) {
                        const newQty = item.cantidad + delta;
                        if (newQty <= 0) return null;

                        // Calcular stock ocupado por OTROS items del mismo producto en el carrito
                        const stockOtrosItems = cart
                            .filter(i => i.product.id === productId && (i.es_unidad !== esUnidad))
                            .reduce((sum, i) => sum + (i.es_unidad ? i.cantidad : i.cantidad * i.product.unidades_por_caja), 0);

                        const stockNuevoItem = esUnidad ? newQty : newQty * item.product.unidades_por_caja;

                        if (stockOtrosItems + stockNuevoItem > item.product.stock_actual) {
                            alert('No hay suficiente stock disponible');
                            return item;
                        }

                        return { ...item, cantidad: newQty };
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[]
        );
    };

    const removeFromCart = (productId: number, esUnidad: boolean) => {
        setCart(cart.filter((item) => !(item.product.id === productId && item.es_unidad === esUnidad)));
    };

    const subtotal = cart.reduce(
        (sum, item) => {
            const precio = item.es_unidad ? (item.product.precio_unidad || 0) : item.product.precio_venta;
            return sum + (Number(precio) * item.cantidad);
        },
        0
    );
    const total = subtotal - descuento;
    const cambio = montoRecibido - total;

    const processSale = async () => {
        if (!cashOpen) {
            alert('Debes abrir la caja antes de realizar ventas');
            return;
        }

        setProcessingPayment(true);

        const saleData = {
            cliente_id: selectedClient?.id,
            items: cart.map((item) => ({
                producto_id: item.product.id,
                cantidad: item.cantidad,
                precio_unitario: Number(item.es_unidad ? item.product.precio_unidad : item.product.precio_venta),
                es_unidad: item.es_unidad,
            })),
            metodo_pago: metodoPago,
            descuento,
            monto_pagado: metodoPago === 'CREDITO' ? montoRecibido : total,
        };

        try {
            const response = await salesApi.create(saleData);
            setSaleComplete(response.data);
        } catch (error) {
            // Save offline
            const codigo_venta = `VTA-OFF-${Date.now()}`;
            const offlineSale = {
                codigo_venta,
                ...saleData,
                subtotal,
                total,
                fecha: new Date(), // Usar objeto Date para cumplir con la interfaz
                usuario: user ? { nombre: user.nombre } : undefined,
                offline: true
            };
            await addOfflineSale(offlineSale as any);
            setSaleComplete(offlineSale);
        } finally {
            setProcessingPayment(false);
        }
    };

    const resetSale = () => {
        setCart([]);
        setDescuento(0);
        setSelectedClient(null);
        setMetodoPago('EFECTIVO');
        setMontoRecibido(0);
        setShowPaymentModal(false);
        setSaleComplete(null);
        loadData();
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
        <div className="h-[calc(100vh-8rem)] flex gap-4">
            {/* Products grid */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre o código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-orange-50 hover:bg-orange-100 rounded-xl p-4 text-left transition-all hover:shadow-md border border-orange-100 relative group"
                            >
                                <div className="w-full h-20 bg-orange-200 rounded-lg mb-3 flex items-center justify-center">
                                    <ShoppingBag className="text-orange-400" size={32} />
                                </div>
                                <h3 className="font-medium text-gray-800 truncate">{product.nombre}</h3>
                                <p className="text-sm text-gray-500 truncate">{product.categoria?.nombre}</p>

                                <div className="mt-3 space-y-2">
                                    <button
                                        onClick={() => addToCart(product, false)}
                                        className="w-full flex items-center justify-between px-3 py-1.5 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-gray-600">CAJA</span>
                                        <span className="font-bold text-orange-600">
                                            {formatCurrency(product.precio_venta)}
                                        </span>
                                    </button>

                                    {product.es_fraccionable && (
                                        <button
                                            onClick={() => addToCart(product, true)}
                                            className="w-full flex items-center justify-between px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <span className="text-xs font-bold text-blue-600">UNIDAD</span>
                                            <span className="font-bold text-blue-700">
                                                {formatCurrency(product.precio_unidad || 0)}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                <div className="mt-2 text-right">
                                    <span className="text-[10px] text-gray-400">
                                        Stock: {Math.floor(product.stock_actual / product.unidades_por_caja)} cj / {product.stock_actual % product.unidades_por_caja} un
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart */}
            <div className="w-96 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-orange-500 text-white">
                    <h2 className="text-lg font-bold">Carrito de Venta</h2>
                    {!cashOpen && (
                        <p className="text-sm text-orange-200 mt-1">⚠️ Caja cerrada</p>
                    )}
                </div>

                {/* Client selection */}
                <div className="p-3 border-b">
                    <select
                        value={selectedClient?.id || ''}
                        onChange={(e) => {
                            const client = clients.find((c) => c.id === parseInt(e.target.value));
                            setSelectedClient(client || null);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    >
                        <option value="">Cliente (opcional)</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.nombres} {client.apellidos} {client.dni_ruc ? `- ${client.dni_ruc}` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.product.id}
                                className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">
                                        {item.product.nombre}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.es_unidad ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {item.es_unidad ? 'UNIDAD' : 'CAJA'}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {formatCurrency(item.es_unidad ? (item.product.precio_unidad || 0) : item.product.precio_venta)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.product.id, item.es_unidad, -1)}
                                        className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="w-8 text-center font-bold">{item.cantidad}</span>
                                    <button
                                        onClick={() => updateQuantity(item.product.id, item.es_unidad, 1)}
                                        className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200"
                                    >
                                        <Plus size={16} />
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.product.id, item.es_unidad)}
                                        className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals */}
                <div className="p-4 border-t bg-gray-50 space-y-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">Descuento</span>
                        <input
                            type="number"
                            value={descuento}
                            onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                            className="flex-1 px-2 py-1 rounded border text-right"
                            min="0"
                            max={subtotal}
                        />
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                        <span>TOTAL</span>
                        <span className="text-orange-600">{formatCurrency(total)}</span>
                    </div>
                </div>

                {/* Payment button */}
                <div className="p-4">
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        COBRAR {formatCurrency(total)}
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {saleComplete ? (
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <Check size={40} className="text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    ¡Venta Completada!
                                </h2>
                                <p className="text-gray-500 mb-4">
                                    Código: {saleComplete.codigo_venta}
                                    {saleComplete.offline && ' (Offline)'}
                                </p>
                                {cambio > 0 && metodoPago === 'EFECTIVO' && (
                                    <p className="text-xl font-bold text-orange-600 mb-4">
                                        Cambio: {formatCurrency(cambio)}
                                    </p>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => printTicket(saleComplete, config)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Printer size={20} />
                                        Imprimir
                                    </button>
                                    <button
                                        onClick={resetSale}
                                        className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all"
                                    >
                                        Nueva Venta
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Cobrar</h2>
                                    <button onClick={() => setShowPaymentModal(false)}>
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="text-center">
                                        <p className="text-gray-500">Total a cobrar</p>
                                        <p className="text-4xl font-bold text-orange-600">
                                            {formatCurrency(total)}
                                        </p>
                                    </div>

                                    {/* Payment methods */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                                            { id: 'YAPE', label: 'Yape', icon: Smartphone },
                                            { id: 'PLIN', label: 'Plin', icon: Smartphone },
                                            { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                                            { id: 'TRANSFERENCIA', label: 'Transfer.', icon: CreditCard },
                                            { id: 'CREDITO', label: 'Crédito', icon: CreditCard },
                                        ].map((method) => (
                                            <button
                                                key={method.id}
                                                onClick={() => setMetodoPago(method.id)}
                                                className={`p-4 rounded-xl border-2 transition-all ${metodoPago === method.id
                                                    ? 'border-orange-500 bg-orange-50'
                                                    : 'border-gray-200 hover:border-orange-300'
                                                    }`}
                                            >
                                                <method.icon
                                                    size={24}
                                                    className={
                                                        metodoPago === method.id
                                                            ? 'text-orange-500 mx-auto'
                                                            : 'text-gray-400 mx-auto'
                                                    }
                                                />
                                                <p
                                                    className={`text-sm mt-2 font-medium ${metodoPago === method.id
                                                        ? 'text-orange-600'
                                                        : 'text-gray-600'
                                                        }`}
                                                >
                                                    {method.label}
                                                </p>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Amount received (for cash) */}
                                    {metodoPago === 'EFECTIVO' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Monto recibido
                                            </label>
                                            <input
                                                type="number"
                                                value={montoRecibido || ''}
                                                onChange={(e) =>
                                                    setMontoRecibido(parseFloat(e.target.value) || 0)
                                                }
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-xl text-center"
                                                placeholder="0.00"
                                            />
                                            {montoRecibido >= total && (
                                                <p className="text-center mt-2 text-lg font-bold text-green-600">
                                                    Cambio: {formatCurrency(cambio)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Credit payment */}
                                    {metodoPago === 'CREDITO' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Monto inicial (anticipo)
                                            </label>
                                            <input
                                                type="number"
                                                value={montoRecibido || ''}
                                                onChange={(e) =>
                                                    setMontoRecibido(parseFloat(e.target.value) || 0)
                                                }
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-xl text-center"
                                                placeholder="0.00"
                                                max={total}
                                            />
                                            <p className="text-center mt-2 text-lg font-bold text-orange-600">
                                                Saldo pendiente: {formatCurrency(total - montoRecibido)}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={processSale}
                                        disabled={
                                            processingPayment ||
                                            (metodoPago === 'EFECTIVO' && montoRecibido < total) ||
                                            (metodoPago === 'CREDITO' && !selectedClient)
                                        }
                                        className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingPayment ? 'Procesando...' : 'Confirmar Pago'}
                                    </button>

                                    {metodoPago === 'CREDITO' && !selectedClient && (
                                        <p className="text-center text-red-500 text-sm">
                                            Debes seleccionar un cliente para ventas a crédito
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
