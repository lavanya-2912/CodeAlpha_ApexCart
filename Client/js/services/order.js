import api from './api.js';

export const placeOrder = async (orderData) => {
  return await api.post('/orders', orderData);
};

export const fetchMyOrders = async () => {
  const data = await api.get('/orders/myorders');
  return data.data;
};

export const fetchOrderDetails = async (id) => {
  const data = await api.get(`/orders/${id}`);
  return data.data;
};

export const cancelOrderById = async (id) => {
  const data = await api.put(`/orders/${id}/cancel`);
  return data.data;
};

export const requestOrderReturn = async (id) => {
  const data = await api.put(`/orders/${id}/return`);
  return data.data;
};

// Admin operations
export const fetchAllOrdersAdmin = async () => {
  const data = await api.get('/orders');
  return data.data;
};

export const updateOrderStatusAdmin = async (id, statusData) => {
  const data = await api.put(`/orders/${id}/status`, statusData);
  return data.data;
};

export const fetchAdminDashboardStats = async () => {
  const data = await api.get('/orders/admin/stats');
  return data.data;
};

export const getInvoiceDownloadUrl = (id) => {
  const token = api.getToken();
  // Provide raw URL endpoint with token attached as query string if needed, 
  // but standard browser downloads can fetch using Bearer token, or we can open with token query param.
  // Let's implement download helper on the click handler in frontend using Fetch, 
  // which is much safer and supports headers!
  return `/api/v1/orders/${id}/invoice`;
};
