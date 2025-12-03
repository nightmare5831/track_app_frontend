import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;
const REQUEST_TIMEOUT = API_CONFIG.TIMEOUT; 

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper function to add timeout to fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is not responding');
    }
    throw error;
  }
};

const Request = {
  async Get(url: string) {
    try {
      const headers = await getHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Return the error message from the backend if available
        return { error: responseData.error || `HTTP error! status: ${response.status}` };
      }

      return responseData;
    } catch (error: any) {
      console.error('GET request failed:', error);
      return { error: error.message || 'Network request failed' };
    }
  },

  async Post(url: string, data: any) {
    try {
      const headers = await getHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Return the error message from the backend if available
        return { error: responseData.error || `HTTP error! status: ${response.status}` };
      }

      return responseData;
    } catch (error: any) {
      console.error('POST request failed:', error);
      return { error: error.message || 'Network request failed' };
    }
  },

  async Put(url: string, data: any) {
    try {
      const headers = await getHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Return the error message from the backend if available
        return { error: responseData.error || `HTTP error! status: ${response.status}` };
      }

      return responseData;
    } catch (error: any) {
      console.error('PUT request failed:', error);
      return { error: error.message || 'Network request failed' };
    }
  },

  async Delete(url: string) {
    try {
      const headers = await getHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Return the error message from the backend if available
        return { error: responseData.error || `HTTP error! status: ${response.status}` };
      }

      return responseData;
    } catch (error: any) {
      console.error('DELETE request failed:', error);
      return { error: error.message || 'Network request failed' };
    }
  },

  async GetRaw(url: string) {
    try {
      const headers = await getHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers,
      });
      return response;
    } catch (error: any) {
      console.error('GetRaw request failed:', error);
      throw error;
    }
  },
};

export default Request;
