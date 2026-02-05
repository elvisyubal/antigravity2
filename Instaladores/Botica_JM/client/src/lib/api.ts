import axios from 'axios';

const API_URL = 'http://127.0.0.1:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth
export const authApi = {
    login: (data: { username: string; password: string }) =>
        api.post('/auth/login', data),
    register: (data: { nombre: string; username: string; password: string; rol: string }) =>
        api.post('/auth/register', data),
    getUsers: () => api.get('/auth/users'),
    updateUser: (id: number, data: any) => api.put(`/auth/users/${id}`, data),
    deleteUser: (id: number) => api.delete(`/auth/users/${id}`),
    toggleUserStatus: (id: number) => api.patch(`/auth/users/${id}/toggle`),
};

// Products
export const productsApi = {
    getAll: () => api.get('/products'),
    getById: (id: number) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: number, data: any) => api.put(`/products/${id}`, data),
    delete: (id: number) => api.delete(`/products/${id}`),
    getExpiring: (days?: number) => api.get(`/products/expiring?days=${days || 30}`),
    getLowStock: () => api.get('/products/low-stock'),
    getTemplate: () => api.get('/products/template', { responseType: 'blob' }),
    import: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/products/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    addStock: (id: number, data: any) => api.post(`/products/${id}/add-batch`, data),
};

// Sales
export const salesApi = {
    create: (data: any) => api.post('/sales', data),
    getAll: (params?: { fecha_inicio?: string; fecha_fin?: string }) =>
        api.get('/sales', { params }),
    getById: (id: number) => api.get(`/sales/${id}`),
    cancel: (id: number) => api.post(`/sales/${id}/cancel`),
};

// Clients
export const clientsApi = {
    getAll: () => api.get('/clients'),
    getById: (id: number) => api.get(`/clients/${id}`),
    create: (data: any) => api.post('/clients', data),
    update: (id: number, data: any) => api.put(`/clients/${id}`, data),
    addPayment: (data: { cliente_id: number; monto: number; observacion?: string }) =>
        api.post('/clients/payments', data),
    getDebtors: () => api.get('/clients/debtors'),
};

// Catalog
export const catalogApi = {
    getCategories: () => api.get('/catalog/categories'),
    createCategory: (data: { nombre: string; descripcion?: string }) =>
        api.post('/catalog/categories', data),
    updateCategory: (id: number, data: any) => api.put(`/catalog/categories/${id}`, data),
    deleteCategory: (id: number) => api.delete(`/catalog/categories/${id}`),
    getSuppliers: () => api.get('/catalog/suppliers'),
    createSupplier: (data: any) => api.post('/catalog/suppliers', data),
    updateSupplier: (id: number, data: any) => api.put(`/catalog/suppliers/${id}`, data),
    deleteSupplier: (id: number) => api.delete(`/catalog/suppliers/${id}`),
};

// Cash
export const cashApi = {
    open: (monto_inicial: number) => api.post('/cash/open', { monto_inicial }),
    close: (id: number, data: { monto_final: number; observaciones?: string }) =>
        api.post(`/cash/${id}/close`, data),
    getCurrent: () => api.get('/cash/current'),
    getHistory: () => api.get('/cash/history'),
};

// Reports
export const reportsApi = {
    getDashboard: () => api.get('/reports/dashboard'),
    getSales: (params?: { fecha_inicio?: string; fecha_fin?: string }) =>
        api.get('/reports/sales', { params }),
    getSalesExcel: (params?: { fecha_inicio?: string; fecha_fin?: string }) =>
        api.get('/reports/export-excel', { params, responseType: 'blob' }),
};

// Config
export const configApi = {
    get: () => api.get('/config'),
    update: (data: any) => api.put('/config', data),
    triggerBackup: () => api.post('/config/backup'),
};
