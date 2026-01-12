import apiClient from './client';

/**
 * Типы для профиля пользователя
 */
export interface UserProfileResponse {
  userId: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  avatarUrl?: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
  // Новые поля для аватара
  avatarInitials?: string;
  avatarBackgroundColor?: string;
  hasCustomAvatar: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
}

/**
 * API для работы с профилем пользователя
 */
export const userApi = {
  /**
   * Получить профиль текущего пользователя
   */
  async getProfile(): Promise<UserProfileResponse> {
    const response = await apiClient.get<UserProfileResponse>('/api/users/me/profile');
    return response.data;
  },

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfileResponse> {
    const response = await apiClient.put<UserProfileResponse>('/api/users/me/profile', data);
    return response.data;
  },

  /**
   * Загрузить аватар пользователя
   * @param file - файл изображения (JPEG, PNG, WebP)
   * @returns обновленный профиль с новым URL аватара
   */
  async uploadAvatar(file: File): Promise<UserProfileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UserProfileResponse>(
      '/api/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Удалить аватар пользователя (вернется к дефолтному)
   */
  async deleteAvatar(): Promise<void> {
    await apiClient.delete('/api/users/me/avatar');
  },
};

export default userApi;

