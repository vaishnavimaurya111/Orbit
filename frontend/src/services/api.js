import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
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
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register/public', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  listUsers: (params) => api.get('/auth/users', { params }),
  toggleUser: (id) => api.patch(`/auth/users/${id}/toggle`),
  registerStaff: (data) => api.post('/auth/register', data),
};

// Customers
export const customerAPI = {
  list: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  toggle: (id) => api.patch(`/customers/${id}/toggle`),
};

// Products
export const productAPI = {
  list: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  archive: (id) => api.patch(`/products/${id}/archive`),
  listVariants: (productId) => api.get(`/products/${productId}/variants`),
  createVariant: (productId, data) => api.post(`/products/${productId}/variants`, data),
  updateVariant: (id, data) => api.put(`/products/variants/${id}`, data),
};

// Plans
export const planAPI = {
  list: (params) => api.get('/plans', { params }),
  getById: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  toggle: (id) => api.patch(`/plans/${id}/toggle`),
};

// Quotations
export const quotationAPI = {
  list: (params) => api.get('/quotations', { params }),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  updateStatus: (id, status) => api.patch(`/quotations/${id}/status`, { status }),
  convert: (id, data) => api.post(`/quotations/${id}/convert`, data),
};

// Subscriptions
export const subscriptionAPI = {
  list: (params) => api.get('/subscriptions', { params }),
  getById: (id) => api.get(`/subscriptions/${id}`),
  create: (data) => api.post('/subscriptions', data),
  transition: (id, action, data = {}) => api.patch(`/subscriptions/${id}/transition`, { action, ...data }),
};

// Billing
export const billingAPI = {
  run: () => api.post('/billing/run'),
  logs: () => api.get('/billing/logs'),
};

// Invoices
export const invoiceAPI = {
  list: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
};

// Payments
export const paymentAPI = {
  list: (params) => api.get('/payments', { params }),
  record: (data) => api.post('/payments', data),
};

// Taxes
export const taxAPI = {
  list: () => api.get('/taxes'),
  create: (data) => api.post('/taxes', data),
  update: (id, data) => api.put(`/taxes/${id}`, data),
  toggle: (id) => api.patch(`/taxes/${id}/toggle`),
};

// Discounts
export const discountAPI = {
  list: () => api.get('/discounts'),
  create: (data) => api.post('/discounts', data),
  update: (id, data) => api.put(`/discounts/${id}`, data),
  toggle: (id) => api.patch(`/discounts/${id}/toggle`),
  validate: (data) => api.post('/discounts/validate', data),
};

// Analytics
export const analyticsAPI = {
  dashboard: (params) => api.get('/analytics/dashboard', { params }),
  revenueChart: (params) => api.get('/analytics/revenue-chart', { params }),
  subscriptionChart: (params) => api.get('/analytics/subscription-chart', { params }),
  subscriptionStatus: () => api.get('/analytics/subscription-status'),
  mrrChart: (params) => api.get('/analytics/mrr-chart', { params }),
  paymentMethods: () => api.get('/analytics/payment-methods'),
  revenueReport: (params) => api.get('/analytics/reports/revenue', { params }),
  subscriptionReport: (params) => api.get('/analytics/reports/subscriptions', { params }),
  customerGrowth: () => api.get('/analytics/reports/customer-growth'),
  outstanding: () => api.get('/analytics/reports/outstanding'),
};
