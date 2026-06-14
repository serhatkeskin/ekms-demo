import axios from 'services/axiosInstance';

const API_PREFIX = '/pages';

const w = (data: any) => ({ content: data });
const wl = (data: any) => ({ content: { data } });

const pageApi = {
  getPages: async (filters: any = {}): Promise<any> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]: any) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    const response = await axios.get(`${API_PREFIX}/pages/?${queryParams.toString()}`);
    return wl(response.data);
  },

  getPage: async (slug: string): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/pages/${slug}/`);
    return w(response.data);
  },

  createPage: async (pageData: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/pages/`, pageData);
    return w(response.data);
  },

  updatePage: async (slug: string, pageData: any): Promise<any> => {
    const response = await axios.patch(`${API_PREFIX}/pages/${slug}/`, pageData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return w(response.data);
  },

  deletePage: async (slug: string): Promise<boolean> => {
    await axios.delete(`${API_PREFIX}/pages/${slug}/`);
    return true;
  },

  clonePage: async (slug: string): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/pages/${slug}/clone/`, {});
    return w(response.data);
  },

  getPageHistory: async (slug: string): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/pages/${slug}/history/`);
    return w(response.data);
  },

  getBlocks: async (pageId: number): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/blocks/?page=${pageId}`);
    return response.data;
  },

  createBlock: async (blockData: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/blocks/`, blockData);
    return response.data;
  },

  updateBlock: async (blockId: string | number, blockData: any): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/blocks/${blockId}/`, blockData);
    return response.data;
  },

  deleteBlock: async (blockId: string | number): Promise<boolean> => {
    await axios.delete(`${API_PREFIX}/blocks/${blockId}/`);
    return true;
  },

  reorderBlocks: async (blocksOrder: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/blocks/reorder/`, { blocks_order: blocksOrder });
    return response.data;
  },

  getPageComments: async (slug: string, filters: any = {}): Promise<any> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]: any) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    const response = await axios.get(`${API_PREFIX}/comments/by-page/${slug}/?${queryParams.toString()}`);
    return w(response.data);
  },

  getBlockComments: async (_slug: string, blockId: number): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/comments/by-block/${blockId}/`);
    return w(response.data);
  },

  createComment: async (slug: string, commentData: any): Promise<any> => {
    const payload: any = { text: commentData.text, page_slug: slug };
    if (commentData.parent != null) payload.parent = commentData.parent;
    const response = await axios.post(`${API_PREFIX}/comments/`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return w(response.data);
  },

  createBlockComment: async (slug: string, commentData: any): Promise<any> => {
    const payload: any = { text: commentData.text, page_slug: slug, block_id: commentData.block_id };
    if (commentData.parent != null) payload.parent = commentData.parent;
    const response = await axios.post(`${API_PREFIX}/comments/`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return w(response.data);
  },

  updateComment: async (commentId: number, commentData: any): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/comments/${commentId}/`, { text: commentData.text }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return w(response.data);
  },

  deleteComment: async (commentId: number): Promise<boolean> => {
    await axios.delete(`${API_PREFIX}/comments/${commentId}/`);
    return true;
  },

  createSnapshot: async (slug: string, name = ""): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/pages/${slug}/create_snapshot/`, { name });
    return w(response.data);
  },

  updateSnapshotName: async (slug: string, snapshotId: number, name: string): Promise<any> => {
    const response = await axios.put(`${API_PREFIX}/pages/${slug}/update_snapshot/`, { snapshot_id: snapshotId, name });
    return w(response.data);
  },

  deleteSnapshot: async (slug: string, snapshotId: number): Promise<any> => {
    const response = await axios.delete(`${API_PREFIX}/pages/${slug}/delete_snapshot/`, { data: { snapshot_id: snapshotId } });
    return w(response.data);
  },

  restoreSnapshot: async (slug: string, snapshotId: number): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/pages/${slug}/restore_snapshot/`, { snapshot_id: snapshotId });
    return w(response.data);
  },

  getSnapshots: async (slug: string): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/pages/${slug}/snapshots/`);
    return w(response.data);
  },

  getMediaContentsByPage: async (slug: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_PREFIX}/mediacontents/by-page/${slug}/`);
      return response.data.content ?? response.data ?? [];
    } catch { return []; }
  },

  uploadBlockFile: async (formData: FormData, fileType = 'file'): Promise<any> => {
    if (fileType && !formData.has('file_type')) formData.append('file_type', fileType);
    const response = await axios.post(`${API_PREFIX}/pages/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return w(response.data);
  },

  deleteBlockFile: async (filePath: string): Promise<any> => {
    const response = await axios.delete(`${API_PREFIX}/pages/delete/`, { data: { file_path: filePath } });
    return response.data;
  }
};

export default pageApi;
