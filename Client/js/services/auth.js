import api from './api.js';
import state from '../state.js';

export const registerUser = async (name, email, password) => {
  const data = await api.post('/auth/register', { name, email, password });
  api.setToken(data.token);
  state.set('user', data.user);
  return data;
};

export const loginUser = async (email, password, rememberMe) => {
  const data = await api.post('/auth/login', { email, password, rememberMe });
  api.setToken(data.token);
  state.set('user', data.user);
  return data;
};

export const logoutUser = async () => {
  try {
    await api.get('/auth/logout');
  } catch (e) {
    // quiet logout
  }
  api.setToken(null);
  state.set('user', null);
  state.set('cart', { items: [] });
  state.set('wishlist', []);
};

export const loadCurrentUser = async () => {
  if (!api.getToken()) return null;
  try {
    const data = await api.get('/auth/me');
    state.set('user', data.data);
    return data.data;
  } catch (error) {
    api.setToken(null);
    state.set('user', null);
    return null;
  }
};

export const updateProfileDetails = async (name, email) => {
  const data = await api.put('/users/profile', { name, email });
  state.set('user', data.data);
  return data.data;
};

export const uploadProfileAvatar = async (formData) => {
  const data = await api.post('/users/profile/picture', formData);
  state.set('user', data.data);
  return data.data;
};

export const getAddressesList = async () => {
  const data = await api.get('/users/addresses');
  return data.data;
};

export const addNewAddress = async (addressData) => {
  const data = await api.post('/users/addresses', addressData);
  return data.data;
};

export const editAddress = async (id, addressData) => {
  const data = await api.put(`/users/addresses/${id}`, addressData);
  return data.data;
};

export const removeAddress = async (id) => {
  const data = await api.delete(`/users/addresses/${id}`);
  return data;
};

export const getAdminUsers = async (search = '') => {
  const data = await api.get(`/users?search=${search}`);
  return data.data;
};

export const removeUserAdmin = async (id) => {
  const data = await api.delete(`/users/${id}`);
  return data;
};

export const promoteUserAdmin = async (id) => {
  const data = await api.put(`/users/${id}/promote`);
  return data.data;
};

export const sendForgotPasswordEmail = async (email) => {
  return await api.post('/auth/forgotpassword', { email });
};

export const resetUserPassword = async (token, password) => {
  const data = await api.put('/auth/resetpassword', { token, password });
  api.setToken(data.token);
  state.set('user', data.user);
  return data;
};

export const verifyUserEmail = async (token) => {
  return await api.post('/auth/verify-email', { token });
};

export const changeUserPassword = async (currentPassword, newPassword) => {
  return await api.put('/auth/updatepassword', { currentPassword, newPassword });
};
