import api from './api.js';

export const fetchProducts = async (filters = {}) => {
  const queryParts = [];
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParts.push(`${key}=${encodeURIComponent(filters[key])}`);
    }
  });
  
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const data = await api.get(`/products${queryString}`);
  return data;
};

export const fetchProductById = async (id) => {
  const data = await api.get(`/products/${id}`);
  return data.data;
};

export const fetchLandingProducts = async () => {
  const data = await api.get('/products/landing/lists');
  return data.data;
};

export const fetchRelatedProducts = async (id) => {
  const data = await api.get(`/products/${id}/related`);
  return data.data;
};

export const fetchCategories = async () => {
  const data = await api.get('/categories');
  return data.data;
};

export const fetchBrands = async () => {
  const data = await api.get('/brands');
  return data.data;
};

// Admin Operations
export const createNewProduct = async (formData) => {
  return await api.post('/products', formData);
};

export const editProductById = async (id, formData) => {
  return await api.put(`/products/${id}`, formData);
};

export const removeProductById = async (id) => {
  return await api.delete(`/products/${id}`);
};

export const createCategoryAdmin = async (categoryData) => {
  return await api.post('/categories', categoryData);
};

export const removeCategoryAdmin = async (id) => {
  return await api.delete(`/categories/${id}`);
};

export const createBrandAdmin = async (brandData) => {
  return await api.post('/brands', brandData);
};

export const removeBrandAdmin = async (id) => {
  return await api.delete(`/brands/${id}`);
};
