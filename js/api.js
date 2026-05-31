/**
 * Lohar Auto Garage — Centralized API Client
 * All API calls go through this module
 */

const API_BASE = '/api';

// Get stored token
const getToken = () => localStorage.getItem('lag_token') || '';

// Get session ID for guest cart
const getSessionId = () => {
  let sid = localStorage.getItem('lag_session');
  if (!sid) { sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('lag_session', sid); }
  return sid;
};

// Core fetch wrapper
const apiRequest = async (method, endpoint, data = null, isFormData = false) => {
  const headers = { 'x-session-id': getSessionId() };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const options = { method, headers, credentials: 'include' };
  if (data) options.body = isFormData ? data : JSON.stringify(data);

  const res = await fetch(API_BASE + endpoint, options);
  const json = await res.json().catch(() => ({ success: false, message: 'Server error' }));
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
};

const api = {
  get: (endpoint) => apiRequest('GET', endpoint),
  post: (endpoint, data) => apiRequest('POST', endpoint, data),
  put: (endpoint, data) => apiRequest('PUT', endpoint, data),
  patch: (endpoint, data) => apiRequest('PATCH', endpoint, data),
  delete: (endpoint) => apiRequest('DELETE', endpoint),
  postForm: (endpoint, formData) => apiRequest('POST', endpoint, formData, true),
  putForm: (endpoint, formData) => apiRequest('PUT', endpoint, formData, true),
};

// ===== AUTH =====
window.AuthAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  firebase: (idToken) => api.post('/auth/firebase', { idToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  addAddress: (data) => api.put('/auth/me/address', data),
  deleteAddress: (id) => api.delete(`/auth/me/address/${id}`),
  logout: () => api.post('/auth/logout'),
};

// ===== PRODUCTS =====
window.ProductsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/products${q ? '?' + q : ''}`);
  },
  get: (slug) => api.get(`/products/${slug}`),
  create: (formData) => api.postForm('/products', formData),
  update: (id, formData) => api.putForm(`/products/${id}`, formData),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, stock) => api.patch(`/products/${id}/stock`, { stock }),
};

// ===== CART =====
window.CartAPI = {
  get: () => api.get('/cart'),
  add: (productId, qty = 1) => api.post('/cart/add', { productId, qty }),
  update: (productId, qty) => api.put('/cart/update', { productId, qty }),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete('/cart/clear'),
  merge: (sessionId, userId) => api.post('/cart/merge', { sessionId, userId }),
};

// ===== WISHLIST =====
window.WishlistAPI = {
  get: () => api.get('/wishlist'),
  toggle: (productId) => api.post(`/wishlist/toggle/${productId}`),
};

// ===== ORDERS =====
window.OrdersAPI = {
  list: (params = {}) => api.get(`/orders?${new URLSearchParams(params)}`),
  get: (orderId) => api.get(`/orders/${orderId}`),
  cancel: (orderId, reason) => api.post(`/orders/${orderId}/cancel`, { reason }),
  invoiceUrl: (orderId) => `/api/orders/${orderId}/invoice`,
  createPaymentOrder: (data) => api.post('/payment/create-order', data),
  verifypayment: (data) => api.post('/payment/verify', data),
  codOrder: (orderData) => api.post('/payment/cod', { orderData }),
};

// ===== COUPONS =====
window.CouponsAPI = {
  validate: (code, orderAmount) => api.post('/coupons/validate', { code, orderAmount }),
  list: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// ===== REVIEWS =====
window.ReviewsAPI = {
  forProduct: (productId) => api.get(`/reviews/product/${productId}`),
  submit: (data) => api.post('/reviews', data),
  list: (params = {}) => api.get(`/reviews?${new URLSearchParams(params)}`),
  approve: (id, approve = true) => api.put(`/reviews/${id}/approve`, { approve }),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ===== DEALER =====
window.DealerAPI = {
  submit: (data) => api.post('/dealer/inquiry', data),
  list: (params = {}) => api.get(`/dealer?${new URLSearchParams(params)}`),
  update: (id, data) => api.put(`/dealer/${id}`, data),
};

// ===== ADMIN =====
window.AdminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  customers: (params = {}) => api.get(`/admin/customers?${new URLSearchParams(params)}`),
  allOrders: (params = {}) => api.get(`/orders/admin/all?${new URLSearchParams(params)}`),
  updateOrderStatus: (orderId, status, note) => api.put(`/orders/${orderId}/status`, { status, note }),
  toggleCustomer: (id, isActive) => api.patch(`/admin/customers/${id}/status`, { isActive }),
};

// ===== HELPERS =====
window.saveToken = (token) => { if (token) localStorage.setItem('lag_token', token); };
window.clearToken = () => localStorage.removeItem('lag_token');
window.isLoggedIn = () => !!localStorage.getItem('lag_token');

// Store/retrieve user info
window.saveUser = (user) => localStorage.setItem('lag_user', JSON.stringify(user));
window.getUser = () => { try { return JSON.parse(localStorage.getItem('lag_user')); } catch { return null; } };
window.clearUser = () => localStorage.removeItem('lag_user');
