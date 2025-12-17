import axios from 'axios';

// Backend Adresi
const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

// 1. Upload Servisi
export const uploadService = {
    uploadExcel: async (formData) => {
        return await api.post('/integrations/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// 2. Dashboard Servisi (Bunu eklediğinizden emin olun)
export const dashboardService = {
    getStats: async () => {
        return await api.get('/finance/dashboard/');
    }
};
// ... önceki kodlar ...

export const productService = {
    getAll: async () => {
        return await api.get('/products/');
    },
    create: async (data) => {
        return await api.post('/products/', data);
    },
    update: async (id, data) => {
        return await api.put(`/products/${id}/`, data);
    },
    // --- YENİ EKLENEN KISIM (Inline Edit İçin) ---
    patch: async (id, partialData) => {
        return await api.patch(`/products/${id}/`, partialData);
    },
    // ---------------------------------------------
    delete: async (id) => {
        return await api.delete(`/products/${id}/`);
    }
};
export const financeService = {
    // Tümünü Getir
    getAll: async () => {
        return await api.get('/finance/transactions/');
    },
    create: async (data) => {
        return await api.post('/finance/transactions/', data);
    },
    delete: async (id) => {
        return await api.delete(`/finance/transactions/${id}/`);
    },
    bulkDelete: async (ids) => {
        return await api.post('/finance/transactions/bulk_delete/', { ids });
    },
    getDashboardStats: async (period = 'daily') => {
        return await api.get(`/finance/dashboard/?period=${period}`);
    },
};
export const expenseService = {
    getAll: async () => {
        return await api.get('/finance/expenses/');
    },
    create: async (data) => {
        return await api.post('/finance/expenses/', data);
    },
    delete: async (id) => {
        return await api.delete(`/finance/expenses/${id}/`);
    },
    update: async (id, data) => {
        return await api.put(`/finance/expenses/${id}/`, data);
    }
};

export const marketplaceService = {
    getAll: async () => {
        return await api.get('/integrations/list/');
    }
};

export default api;