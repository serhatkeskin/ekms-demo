import axios from 'services/axiosInstance';

const API_PREFIX = '/projects';

const w = (data: any) => ({ content: data });
const wl = (data: any) => ({ content: { data } });

const projectsApi = {
  getAllProjects: async (options: any = { size: 1000 }): Promise<any> => {
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]: any) => {
      if (value !== undefined && value !== null) queryParams.append(key, String(value));
    });
    const response = await axios.get(`${API_PREFIX}/projects/?${queryParams.toString()}`);
    return wl(response.data);
  },

  getProject: async (projectSlug: string): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/projects/${projectSlug}`);
    return w(response.data);
  },

  createProject: async (projectData: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/projects/`, projectData);
    return w(response.data);
  },

  updateProject: async (projectSlug: string, projectData: any): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/projects/${projectSlug}/`, projectData);
    return w(response.data);
  },

  deleteProject: async (projectSlug: string): Promise<void> => {
    await axios.delete(`${API_PREFIX}/projects/${projectSlug}/`);
  },

  getRoles: async (): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/roles/`);
    return wl(response.data);
  },

  getUsers: async (_options?: any): Promise<any> => {
    const response = await axios.get(`/users/listusers/?all`);
    return wl(response.data);
  },

  createMembership: async (membershipData: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/memberships/`, membershipData);
    return w(response.data);
  },

  updateMembership: async (membershipId: number, membershipData: any): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/memberships/${membershipId}/`, membershipData);
    return w(response.data);
  },

  deleteMembership: async (membershipId: number): Promise<void> => {
    await axios.delete(`${API_PREFIX}/memberships/${membershipId}/`);
  },

  getMemberships: async (options: any = {}): Promise<any> => {
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]: any) => {
      if (value !== undefined && value !== null) queryParams.append(key, String(value));
    });
    const response = await axios.get(`${API_PREFIX}/memberships/?${queryParams.toString()}`);
    return wl(response.data);
  },

  isProjectManager: (project: any): boolean => {
    const userName = localStorage.getItem("username");
    if (!project.memberships || !Array.isArray(project.memberships) || !userName) return false;
    const userMembership = project.memberships.find((m: any) => m.user?.username?.toString() === userName.toString());
    return !!(userMembership?.role?.name?.toLowerCase() === "manager");
  },

  canEditProject: (project: any, isStaff: boolean): boolean => {
    return isStaff || projectsApi.isProjectManager(project);
  },

  createRole: async (roleData: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/roles/`, roleData);
    return w(response.data);
  },

  updateRole: async (roleId: number, roleData: any): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/roles/${roleId}/`, roleData);
    return w(response.data);
  },

  deleteRole: async (roleId: number): Promise<boolean> => {
    await axios.delete(`${API_PREFIX}/roles/${roleId}/`);
    return true;
  }
};

export default projectsApi;
