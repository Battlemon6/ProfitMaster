import axios from 'axios';

// 127.0.0.1 kullanımı localhost'tan daha stabildir
const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

export const uploadService = {
    uploadExcel: async (formData) => await api.post('/integrations/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const productService = {
    getAll: async () => await api.get('/products/'),
    create: async (data) => await api.post('/products/', data),
    update: async (id, data) => await api.put(`/products/${id}/`, data),
    delete: async (id) => await api.delete(`/products/${id}/`)
};

export const financeService = {
    getAll: async () => await api.get('/finance/transactions/'),
    // Manuel sepet girişi için tek kapı
    bulkCreate: async (data) => await api.post('/finance/transactions/bulk_create/', data),
    delete: async (id) => await api.delete(`/finance/transactions/${id}/`),
    bulkDelete: async (ids) => await api.post('/finance/transactions/bulk_delete/', { ids }),
    getDashboardStats: async (period = 'daily') => await api.get(`/finance/dashboard/?period=${period}`),
};

export const expenseService = {
    getAll: async () => await api.get('/finance/expenses/'),
    create: async (data) => await api.post('/finance/expenses/', data),
    delete: async (id) => await api.delete(`/finance/expenses/${id}/`),
    update: async (id, data) => await api.put(`/finance/expenses/${id}/`, data)
};

export const marketplaceService = {
    getAll: async () => await api.get('/integrations/list/')
};

export default api;