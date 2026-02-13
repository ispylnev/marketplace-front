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
  ownerId?: number;
  ownerType?: 'SELLER' | 'BUYER';
}

/**
 * Цель загрузки: OFFER (для оффера, нужен SELLER) или REVIEW (для отзыва, любой auth)
 */
export type UploadPurpose = 'OFFER' | 'REVIEW';

/**
 * Сервис для работы с загрузками файлов
 */
export const uploadService = {
  /**
   * Загрузить файл во временное хранилище
   * Файл будет автоматически удалён через 24 часа если не привязан к офферу или отзыву
   */
  async uploadTemp(file: File, purpose: UploadPurpose = 'OFFER'): Promise<TempUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<TempUploadResponse>(
      `/api/uploads/temp?purpose=${purpose}`,
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
   * Получить все временные загрузки текущего пользователя
   */
  async getMyTempUploads(purpose: UploadPurpose = 'OFFER'): Promise<TempUploadResponse[]> {
    const response = await apiClient.get<TempUploadResponse[]>(`/api/uploads/temp?purpose=${purpose}`);
    return response.data;
  },

  /**
   * Получить информацию о временном файле
   */
  async getTempUpload(tempId: string, purpose: UploadPurpose = 'OFFER'): Promise<TempUploadResponse> {
    const response = await apiClient.get<TempUploadResponse>(`/api/uploads/temp/${tempId}?purpose=${purpose}`);
    return response.data;
  },

  /**
   * Удалить временный файл
   */
  async deleteTempUpload(tempId: string, purpose: UploadPurpose = 'OFFER'): Promise<void> {
    await apiClient.delete(`/api/uploads/temp/${tempId}?purpose=${purpose}`);
  }
};
