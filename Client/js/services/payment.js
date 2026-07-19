import api from './api.js';

export const createCheckoutSession = async (checkoutData) => {
  return await api.post('/payments/checkout', checkoutData);
};

export const fetchPaymentStatus = async (sessionId) => {
  const data = await api.get(`/payments/status/${sessionId}`);
  return data;
};
