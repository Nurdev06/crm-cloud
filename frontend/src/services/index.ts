import api from '@/lib/api'

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  register: (data: any) => api.post('/auth/register', data).then(r => r.data),
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export const analyticsService = {
  dashboard: () => api.get('/analytics/dashboard').then(r => r.data),
  revenueTrend: (months = 12) => api.get(`/analytics/revenue/trend?months=${months}`).then(r => r.data),
  ordersByStatus: () => api.get('/analytics/orders/by-status').then(r => r.data),
  leadsPipeline: () => api.get('/analytics/leads/pipeline').then(r => r.data),
  topProducts: (limit = 10) => api.get(`/analytics/products/top?limit=${limit}`).then(r => r.data),
  customerGrowth: (months = 6) => api.get(`/analytics/customers/growth?months=${months}`).then(r => r.data),
}

// ─── Customers ─────────────────────────────────────────────────────────────
export const customerService = {
  list: (params?: any) => api.get('/customers', { params }).then(r => r.data),
  get: (id: number) => api.get(`/customers/${id}`).then(r => r.data),
  create: (data: any) => api.post('/customers', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/customers/${id}`).then(r => r.data),
  stats: () => api.get('/customers/stats/summary').then(r => r.data),
}

// ─── Leads ─────────────────────────────────────────────────────────────────
export const leadService = {
  list: (params?: any) => api.get('/leads', { params }).then(r => r.data),
  create: (data: any) => api.post('/leads', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/leads/${id}`, data).then(r => r.data),
  convert: (id: number, customerId: number) =>
    api.patch(`/leads/${id}/convert?customer_id=${customerId}`).then(r => r.data),
}

// ─── Opportunities ─────────────────────────────────────────────────────────
export const opportunityService = {
  list: (params?: any) => api.get('/opportunities', { params }).then(r => r.data),
  create: (data: any) => api.post('/opportunities', data).then(r => r.data),
  updateStage: (id: number, stage: string) =>
    api.patch(`/opportunities/${id}/stage?stage=${stage}`).then(r => r.data),
}

// ─── Products ──────────────────────────────────────────────────────────────
export const productService = {
  list: (params?: any) => api.get('/products', { params }).then(r => r.data),
  get: (id: number) => api.get(`/products/${id}`).then(r => r.data),
  create: (data: any) => api.post('/products', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data).then(r => r.data),
}

// ─── Inventory ─────────────────────────────────────────────────────────────
export const inventoryService = {
  list: (params?: any) => api.get('/inventory', { params }).then(r => r.data),
  adjust: (id: number, quantity: number, notes?: string) =>
    api.patch(`/inventory/${id}/adjust?quantity=${quantity}${notes ? `&notes=${notes}` : ''}`).then(r => r.data),
}

// ─── Orders ────────────────────────────────────────────────────────────────
export const orderService = {
  list: (params?: any) => api.get('/orders', { params }).then(r => r.data),
  get: (id: number) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data: any) => api.post('/orders', data).then(r => r.data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/status?new_status=${status}`).then(r => r.data),
  stats: () => api.get('/orders/stats/summary').then(r => r.data),
}

// ─── Deliveries ────────────────────────────────────────────────────────────
export const deliveryService = {
  list: (params?: any) => api.get('/deliveries', { params }).then(r => r.data),
  get: (id: number) => api.get(`/deliveries/${id}`).then(r => r.data),
  create: (data: any) => api.post('/deliveries', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/deliveries/${id}`, data).then(r => r.data),
}

// ─── Invoices ──────────────────────────────────────────────────────────────
export const invoiceService = {
  list: (params?: any) => api.get('/invoices', { params }).then(r => r.data),
  get: (id: number) => api.get(`/invoices/${id}`).then(r => r.data),
  create: (data: any) => api.post('/invoices', data).then(r => r.data),
  recordPayment: (id: number, amount: number, notes?: string) =>
    api.post(`/invoices/${id}/payment`, { amount, notes }).then(r => r.data),
  stats: () => api.get('/invoices/stats/summary').then(r => r.data),
}

// ─── Support ───────────────────────────────────────────────────────────────
export const supportService = {
  list: (params?: any) => api.get('/support', { params }).then(r => r.data),
  get: (id: number) => api.get(`/support/${id}`).then(r => r.data),
  create: (data: any) => api.post('/support', data).then(r => r.data),
  addResponse: (id: number, data: any) => api.post(`/support/${id}/responses`, data).then(r => r.data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/support/${id}/status?new_status=${status}`).then(r => r.data),
}

// ─── Users ─────────────────────────────────────────────────────────────────
export const userService = {
  list: (params?: any) => api.get('/users', { params }).then(r => r.data),
  get: (id: number) => api.get(`/users/${id}`).then(r => r.data),
  create: (data: any) => api.post('/users', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/users/${id}`).then(r => r.data),
}
