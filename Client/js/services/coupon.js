import api from './api.js';

export const validateCouponCode = async (code) => {
  const data = await api.post('/coupons/validate', { code });
  return data.data;
};

// Admin Operations
export const fetchCouponsAdmin = async () => {
  const data = await api.get('/coupons');
  return data.data;
};

export const createCouponAdmin = async (couponData) => {
  return await api.post('/coupons', couponData);
};

export const deleteCouponAdmin = async (id) => {
  return await api.delete(`/coupons/${id}`);
};
