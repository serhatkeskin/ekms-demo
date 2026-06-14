import axios from 'services/axiosInstance';
import { SearchOptions, User } from 'types';

const API_PREFIX = '/search';

const searchApi = {
  search: async <T = unknown>(query: string, options: SearchOptions = {}): Promise<T> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => queryParams.append(key, String(item)));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      const response = await axios.get(`${API_PREFIX}/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error('Error performing search:', error);
      throw new Error(err.response?.data?.detail || 'Search failed');
    }
  },

  searchUsers: async (query: string, options: { limit?: number } = {}): Promise<User[]> => {
    try {
      if (!query) return [];

      const queryParams = new URLSearchParams();
      queryParams.append('q', query);

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(`${API_PREFIX}/user/search/?${queryParams.toString()}`);
      return response.data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
};

export default searchApi;
