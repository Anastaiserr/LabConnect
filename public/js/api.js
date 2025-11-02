// API функции для взаимодействия с сервером
const API = {
  async request(endpoint, options = {}) {
    const url = `/api${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сервера');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Аутентификация
  async register(userData) {
    return this.request('/register', {
      method: 'POST',
      body: userData
    });
  },

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: credentials
    });
  },

  async logout() {
    return this.request('/logout', {
      method: 'POST'
    });
  },

  async getCurrentUser() {
    return this.request('/user');
  }
};