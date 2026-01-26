import apiClient from './client';

/**
 * Ответ на временную загрузку
 */
export interface TempUploadResponse {
  tempId: string;
  url: string;
  thumbnailUrl?: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  width?: number;
  height?: number;
  expiresAt: string;
}

/**
 * Сервис для работы с загрузками файлов
 */
export const uploadService = {
  /**
   * Загрузить файл во временное хранилище
   * Файл будет автоматически удалён через 24 часа если не привязан к офферу
   */
  async uploadTemp(file: File): Promise<TempUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<TempUploadResponse>(
      '/api/uploads/temp',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  /**
   * Получить все временные загрузки текущего продавца
   */
  async getMyTempUploads(): Promise<TempUploadResponse[]> {
    const response = await apiClient.get<TempUploadResponse[]>('/api/uploads/temp');
    return response.data;
  },

  /**
   * Получить информацию о временном файле
   */
  async getTempUpload(tempId: string): Promise<TempUploadResponse> {
    const response = await apiClient.get<TempUploadResponse>(`/api/uploads/temp/${tempId}`);
    return response.data;
  },

  /**
   * Удалить временный файл
   */
  async deleteTempUpload(tempId: string): Promise<void> {
    await apiClient.delete(`/api/uploads/temp/${tempId}`);
  }
};
