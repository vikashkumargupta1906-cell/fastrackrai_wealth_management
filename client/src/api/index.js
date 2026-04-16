import axios from 'axios';

// Create Axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  //timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    // Add any auth token here if you implement authentication
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Log error details
    console.error('API Error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      method: originalRequest?.method?.toUpperCase(),
      message: error.message,
      data: error.response?.data,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login or refresh token
      console.warn('Unauthorized access - token may be expired');
      // window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.warn('Access forbidden - insufficient permissions');
    } else if (error.response?.status === 404) {
      // Not found
      console.warn('Resource not found');
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error occurred');
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('Request timeout');
    }

    return Promise.reject(error);
  }
);

// Household API methods
export const householdApi = {
  // Get all households
  getAll: () => api.get('/households'),
  
  // Get household by ID
  getById: (id) => api.get(`/households/${id}`),
  
  // Search households
  search: (query) => api.get(`/households/search?query=${encodeURIComponent(query)}`),
  
  // Update household
  update: (id, data) => api.put(`/households/${id}`, data),
  
  // Delete household
  delete: (id) => api.delete(`/households/${id}`),
};

// Insights API methods
export const insightsApi = {
  // Get all insights data
  getAll: () => api.get('/insights'),
  
  // Get top households
  getTopHouseholds: (limit = 10) => api.get(`/insights/top-households?limit=${limit}`),
};

// Upload API methods
export const uploadApi = {
  // Upload Excel file
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Upload audio file
  uploadAudio: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Utility functions
export const apiUtils = {
  // Check if network is available
  isOnline: () => navigator.onLine,
  
  // Format error message for display
  formatError: (error) => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    } else if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.message) {
      return error.message;
    } else {
      return 'An unexpected error occurred';
    }
  },
  
  // Handle API response consistently
  handleResponse: (response) => {
    return response.data;
  },
  
  // Retry failed request with exponential backoff
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();
        return response;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        console.log(`Retrying request (attempt ${attempt + 1}/${maxRetries})`);
      }
    }
  },
};

// Export the main API instance and all API methods
export default api;
