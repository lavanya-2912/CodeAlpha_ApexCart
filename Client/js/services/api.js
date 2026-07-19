import state from '../state.js';

const BASE_URL = '/api/v1';

class ApiClient {
  constructor() {
    this.tokenKey = 'apexcart_token';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  // Handle network request base
  async request(endpoint, options = {}) {
    const token = this.getToken();

    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Check if form data (multipart) is being transmitted
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Automatically handle JWT expiries / invalidates
        if (response.status === 401 && token) {
          this.setToken(null);
          state.set('user', null);
          state.set('cart', { items: [] });
          state.set('wishlist', []);
          window.location.hash = '/login';
        }
        
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient();
export default api;
