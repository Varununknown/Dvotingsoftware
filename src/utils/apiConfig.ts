// API Configuration for Production and Development
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://dvotingsoftware.onrender.com/api');

export const apiConfig = {
  baseURL: API_BASE_URL,
  
  // Helper function to get full API URL
  getURL: (endpoint: string) => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
  },
  
  // Helper function to make API calls
  fetch: async (endpoint: string, options?: RequestInit) => {
    const url = apiConfig.getURL(endpoint);
    console.log(`🌐 API Call: ${url}`);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, mergedOptions);
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

// Export for easy debugging
console.log('🔧 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE
});