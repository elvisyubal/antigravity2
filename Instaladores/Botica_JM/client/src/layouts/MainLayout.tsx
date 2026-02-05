import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Wifi,
    WifiOff,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Info,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart, requiredPermission: { module: 'Ventas', action: 'crear' } },
    { name: 'Ventas', href: '/sales', icon: BarChart3, requiredPermission: { module: 'Ventas', action: 'ver' } },
    { name: 'Productos', href: '/products', icon: Package, requiredPermission: { module: 'Productos', action: 'ver' } },
    { name: 'Clientes', href: '/clients', icon: Users, requiredPermission: { module: 'Clientes', action: 'ver' } },
    { name: 'Créditos', href: '/credits', icon: CreditCard, requiredPermission: { module: 'Clientes', action: 'ver' } },
    { name: 'Caja', href: '/cash', icon: DollarSign, requiredPermission: { module: 'Caja', action: 'ver' } },
    { name: 'Reportes', href: '/reports', icon: BarChart3, requiredPermission: { module: 'Reportes', action: 'ver' } },
    { name: 'Configuración', href: '/settings', icon: Settings, requiredPermission: { module: 'Configuracion', action: 'ver' } },
    { name: 'Acerca de', href: '/about', icon: Info },
];

const MainLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { user, logout, hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredNavigation = navigation.filter((item) => {
        if (!item.requiredPermission) return true;
        return hasPermission(item.requiredPermission.module, item.requiredPermission.action);
    });

    return (
        <div className="min-h-screen bg-orange-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-orange-500 to-orange-600 transform transition-all duration-300 lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } ${isCollapsed ? 'w-20' : 'w-64'}`}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-orange-400 shrink-0">
                    {!isCollapsed && <h1 className="text-xl font-bold text-white">Botica J&M</h1>}
                    {isCollapsed && <ShoppingCart className="text-white mx-auto" size={24} />}
                    <button
                        className="lg:hidden text-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                    {!sidebarOpen && (
                        <button
                            className="hidden lg:flex text-white hover:bg-orange-400 p-1 rounded-lg"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {filteredNavigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                title={isCollapsed ? item.name : ''}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-white text-orange-600 shadow-lg'
                                    : 'text-white/90 hover:bg-orange-400'
                                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={20} className="shrink-0" />
                                {!isCollapsed && <span className="font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-orange-400 shrink-0">
                    <div className={`flex items-center gap-3 px-4 py-2 text-white/90 mb-2 ${isCollapsed ? 'justify-center px-0' : ''}`}>
                        <div className="w-10 h-10 shrink-0 rounded-full bg-orange-400 flex items-center justify-center font-bold">
                            {user?.nombre?.charAt(0) || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user?.nombre}</p>
                                <p className="text-sm opacity-75">{user?.rol}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? 'Cerrar Sesión' : ''}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-white/90 hover:bg-orange-400 transition-all ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            className="lg:hidden p-2 rounded-lg hover:bg-orange-100"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={24} className="text-orange-600" />
                        </button>

                        <div className="flex items-center gap-4">
                            <div
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isOnline
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}
                            >
                                {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                                {isOnline ? 'En línea' : 'Sin conexión'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
