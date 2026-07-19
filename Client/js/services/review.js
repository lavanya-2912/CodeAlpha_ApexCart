import api from './api.js';

export const fetchProductReviews = async (productId) => {
  const data = await api.get(`/reviews/product/${productId}`);
  return data.data;
};

export const submitReview = async (productId, rating, comment) => {
  return await api.post(`/reviews/product/${productId}`, { rating, comment });
};

export const editReviewById = async (id, reviewData) => {
  return await api.put(`/reviews/${id}`, reviewData);
};

export const deleteReviewById = async (id) => {
  return await api.delete(`/reviews/${id}`);
};
