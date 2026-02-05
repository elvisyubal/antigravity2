import React, { useEffect, useState } from 'react';
import { reportsApi } from '../lib/api';
import { Link } from 'react-router-dom';
import {
    ShoppingCart,
    Package,
    AlertTriangle,
    Users,
    TrendingUp,
    Calendar,
} from 'lucide-react';

interface DashboardStats {
    ventasHoy: {
        total: number;
        cantidad: number;
    };
    inventario: {
        stockBajo: number;
        proximosVencer: number;
        diasAlerta: number;
    };
    creditos: {
        deudores: number;
        deudaTotal: number;
    };
    ventasPorMetodo: Array<{
        metodo_pago: string;
        _sum: { total: number };
        _count: number;
    }>;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await reportsApi.getDashboard();
            setStats(response.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={20} />
                    <span>{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Ventas Hoy</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {formatCurrency(stats?.ventasHoy.total || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {stats?.ventasHoy.cantidad || 0} transacciones
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                            <ShoppingCart className="text-orange-600" size={28} />
                        </div>
                    </div>
                </div>

                <Link to="/products?filter=low-stock" className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Stock Bajo</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {stats?.inventario.stockBajo || 0}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">productos</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Package className="text-yellow-600" size={28} />
                        </div>
                    </div>
                </Link>

                <Link to="/products?filter=expiring" className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Por Vencer</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {stats?.inventario.proximosVencer || 0}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">en {stats?.inventario.diasAlerta || 30} días</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={28} />
                        </div>
                    </div>
                </Link>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Deuda Total</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {formatCurrency(stats?.creditos.deudaTotal || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {stats?.creditos.deudores || 0} deudores
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="text-blue-600" size={28} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales by payment method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Ventas por Método de Pago (Últimos 7 días)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats?.ventasPorMetodo.map((item: any) => (
                        <div
                            key={item.metodo_pago}
                            className="bg-orange-50 rounded-lg p-4 text-center"
                        >
                            <p className="text-sm font-medium text-gray-600">{item.metodo_pago}</p>
                            <p className="text-lg font-bold text-orange-600 mt-1">
                                {formatCurrency(item._sum.total || 0)}
                            </p>
                            <p className="text-xs text-gray-500">{item._count} ventas</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
