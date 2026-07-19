import api from './api.js';
import state from '../state.js';

export const fetchWishlist = async () => {
  const user = state.get('user');
  if (user) {
    try {
      const data = await api.get('/wishlist');
      const products = data.data ? data.data.products : [];
      state.set('wishlist', products);
      return products;
    } catch (e) {
      console.error(e);
    }
  }

  const localWishlist = JSON.parse(localStorage.getItem('apexcart_guest_wishlist')) || [];
  state.set('wishlist', localWishlist);
  return localWishlist;
};

export const addItemToWishlist = async (product) => {
  const user = state.get('user');
  if (user) {
    const data = await api.post('/wishlist', { productId: product._id });
    await fetchWishlist();
    return data;
  }

  // Guest Wishlist
  const localWishlist = JSON.parse(localStorage.getItem('apexcart_guest_wishlist')) || [];
  if (!localWishlist.some(p => p._id === product._id)) {
    localWishlist.push(product);
    localStorage.setItem('apexcart_guest_wishlist', JSON.stringify(localWishlist));
    state.set('wishlist', localWishlist);
  }
  return { success: true };
};

export const removeWishlistItem = async (productId) => {
  const user = state.get('user');
  if (user) {
    const data = await api.delete(`/wishlist/${productId}`);
    await fetchWishlist();
    return data;
  }

  // Guest Wishlist
  let localWishlist = JSON.parse(localStorage.getItem('apexcart_guest_wishlist')) || [];
  localWishlist = localWishlist.filter(p => p._id !== productId);
  localStorage.setItem('apexcart_guest_wishlist', JSON.stringify(localWishlist));
  state.set('wishlist', localWishlist);
  return { success: true };
};
