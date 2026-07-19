// Global Client State Management - Observer Pattern

class GlobalState {
  constructor() {
    this.state = {
      user: null,
      cart: { items: [] },
      wishlist: [],
      recentlyViewed: JSON.parse(localStorage.getItem('recentlyViewed')) || [],
      searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
      theme: localStorage.getItem('theme') || 'light',
    };

    // Subscriptions registry
    this.listeners = {};
  }

  // Retrieve current state values
  get(key) {
    return this.state[key];
  }

  // Update state values and dispatch event notifications
  set(key, value) {
    this.state[key] = value;
    this.dispatch(key, value);

    // Sync specific states to localStorage
    if (key === 'theme') {
      localStorage.setItem('theme', value);
      document.documentElement.setAttribute('data-bs-theme', value);
    } else if (key === 'recentlyViewed') {
      localStorage.setItem('recentlyViewed', JSON.stringify(value));
    } else if (key === 'searchHistory') {
      localStorage.setItem('searchHistory', JSON.stringify(value));
    }
  }

  // Register a subscription callback for specific state keys
  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    
    // Immediately execute callback with current value
    callback(this.state[key]);

    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  // Notify all subscribers of state modifications
  dispatch(key, value) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => {
        try {
          callback(value);
        } catch (e) {
          console.error(`Error executing subscriber callback for ${key}:`, e);
        }
      });
    }
  }

  // Add a product to recently viewed list (max 5 items)
  addRecentlyViewed(product) {
    let list = this.state.recentlyViewed.filter(p => p._id !== product._id);
    list.unshift(product); // Add to front
    if (list.length > 5) {
      list.pop(); // Remove oldest
    }
    this.set('recentlyViewed', list);
  }

  // Add query to search history
  addSearchQuery(query) {
    if (!query || !query.trim()) return;
    let history = this.state.searchHistory.filter(q => q.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    if (history.length > 10) {
      history.pop();
    }
    this.set('searchHistory', history);
  }

  // Clear search history
  clearSearchHistory() {
    this.set('searchHistory', []);
  }

  // Check role helper
  isAdmin() {
    return this.state.user && this.state.user.role === 'admin';
  }

  isCustomer() {
    return this.state.user && this.state.user.role === 'customer';
  }
}

const state = new GlobalState();
export default state;
