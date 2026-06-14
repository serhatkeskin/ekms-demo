import axios from 'services/axiosInstance';

const API_PREFIX = '/users';

const userApi = {
  getProfile: async (): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/profile/`);
    return response.data;
  },

  updateProfile: async (profileData: any): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/profile/update/`, profileData);
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/profile/change_password/`, {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  },

  uploadAvatar: async (imageFile: File): Promise<any> => {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    const response = await axios.post(`${API_PREFIX}/profile/avatar/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateSettings: async (settings: any): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/profile/settings/`, settings);
    return response.data;
  },

  getUserProjects: async (): Promise<any> => {
    const response = await axios.get(`/projects/memberships/?user=current`);
    return response.data;
  },

  getUsers: async (page = 1, size = 10): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/listusers/?page=${page}&page_size=${size}`);
    const raw = response.data;
    return {
      content: {
        data: {
          results: raw.results || [],
          count: raw.count || 0,
          page: { total: Math.ceil((raw.count || 0) / size) || 1 },
        },
      },
    };
  },

  getPermissions: async (): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/permissions/`);
    return response.data;
  },

  getUserPermissions: async (_userId: number): Promise<any> => {
    return { content: { data: { results: [] } } };
  },

  updateUser: async (userId: number, userData: any): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/listusers/${userId}/`, userData);
    return response.data;
  },

  updateUserPermissions: async (_userId: number, _permissionIds: number[]): Promise<any> => {
    return { content: { data: { results: [] } } };
  },

  changeUserPassword: async (userId: number, newPassword: string): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/users/${userId}/change-password/`, { new_password: newPassword });
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await axios.delete(`${API_PREFIX}/listusers/${userId}/`);
  },

  createUser: async (userData: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/listusers/`, userData);
    return response.data;
  }
};

export default userApi;
