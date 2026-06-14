import axios from 'services/axiosInstance';
import { UploadedFile } from 'types';

const API_PREFIX = '/pages/files';

type FileType = 'image' | 'video' | 'audio' | 'file';

const fileApi = {
  uploadFile: async (formData: FormData, fileType: FileType = 'file'): Promise<UploadedFile> => {
    if (fileType && !formData.has('file_type')) {
      formData.append('file_type', fileType);
    }

    const response = await axios.post(
      `${API_PREFIX}/upload/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return response.data;
  },

  deleteFile: async (filePath: string): Promise<{ message?: string }> => {
    const response = await axios.delete(
      `${API_PREFIX}/delete/`,
      { data: { file_path: filePath } }
    );

    return response.data;
  }
};

export default fileApi;
