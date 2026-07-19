import api from './api.js';
import state from '../state.js';

// Sync current cart from DB or Local Storage
export const fetchCart = async () => {
  const user = state.get('user');
  if (user) {
    try {
      const data = await api.get('/cart');
      state.set('cart', data.data);
      return data.data;
    } catch (e) {
      console.error('Error fetching cart from API:', e);
    }
  }
  
  // Guest cart from localStorage
  const localCart = JSON.parse(localStorage.getItem('apexcart_guest_cart')) || { items: [] };
  state.set('cart', localCart);
  return localCart;
};

export const addItemToCart = async (product, quantity = 1) => {
  const user = state.get('user');
  if (user) {
    const data = await api.post('/cart', { productId: product._id, quantity });
    await fetchCart(); // Refresh cart
    return data;
  }

  // Guest Cart Logic
  const localCart = JSON.parse(localStorage.getItem('apexcart_guest_cart')) || { items: [] };
  const existingItemIndex = localCart.items.findIndex(
    item => item.product._id === product._id || item.product === product._id
  );

  if (existingItemIndex > -1) {
    localCart.items[existingItemIndex].quantity += quantity;
  } else {
    localCart.items.push({ product: product, quantity, saveForLater: false });
  }

  localStorage.setItem('apexcart_guest_cart', JSON.stringify(localCart));
  state.set('cart', localCart);
  return { success: true, guest: true };
};

export const updateCartItemQty = async (itemId, quantity) => {
  const user = state.get('user');
  if (user) {
    const data = await api.put(`/cart/items/${itemId}`, { quantity });
    await fetchCart();
    return data;
  }

  // Guest Qty update (here itemId is product._id)
  const localCart = JSON.parse(localStorage.getItem('apexcart_guest_cart')) || { items: [] };
  const item = localCart.items.find(item => item.product._id === itemId || item.product === itemId);
  if (item) {
    item.quantity = quantity;
    localStorage.setItem('apexcart_guest_cart', JSON.stringify(localCart));
    state.set('cart', localCart);
  }
  return { success: true, guest: true };
};

export const removeCartItem = async (itemId) => {
  const user = state.get('user');
  if (user) {
    const data = await api.delete(`/cart/items/${itemId}`);
    await fetchCart();
    return data;
  }

  // Guest item remove (here itemId is product._id)
  const localCart = JSON.parse(localStorage.getItem('apexcart_guest_cart')) || { items: [] };
  localCart.items = localCart.items.filter(
    item => (item.product._id !== itemId && item.product !== itemId)
  );

  localStorage.setItem('apexcart_guest_cart', JSON.stringify(localCart));
  state.set('cart', localCart);
  return { success: true, guest: true };
};

export const toggleCartItemSaveForLater = async (itemId) => {
  const user = state.get('user');
  if (user) {
    const data = await api.put(`/cart/items/${itemId}/save-for-later`);
    await fetchCart();
    return data;
  }

  // Guest save for later toggle
  const localCart = JSON.parse(localStorage.getItem('apexcart_guest_cart')) || { items: [] };
  const item = localCart.items.find(item => item.product._id === itemId || item.product === itemId);
  if (item) {
    item.saveForLater = !item.saveForLater;
    localStorage.setItem('apexcart_guest_cart', JSON.stringify(localCart));
    state.set('cart', localCart);
  }
  return { success: true, guest: true };
};

export const syncGuestCartOnLogin = async () => {
  const localCart = JSON.parse(localStorage.getItem('apexcart_guest_cart'));
  if (localCart && localCart.items.length > 0) {
    try {
      const itemsToSync = localCart.items.map(item => ({
        product: item.product._id || item.product,
        quantity: item.quantity
      }));
      
      await api.post('/cart/sync', { items: itemsToSync });
      localStorage.removeItem('apexcart_guest_cart');
    } catch (e) {
      console.error('Failed to sync guest cart:', e);
    }
  }
  await fetchCart();
};
