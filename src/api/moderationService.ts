import apiClient from './client';

// ==================== Types ====================

export interface FieldChangeDto {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  moderationType?: string;
}

export interface AutoResultDto {
  passed: boolean;
  violations: string[];
}

export interface EditRequestResponse {
  id: number;
  entityType: string;
  entityId: number;
  sellerId: number;
  sellerShopName?: string;
  changes: FieldChangeDto[];
  status: string;
  autoResult?: AutoResultDto;
  reviewedBy?: number;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldConfigDto {
  id: number;
  entityType: string;
  fieldName: string;
  moderationType: string;
  active: boolean;
}

export interface ReviewRequest {
  approved: boolean;
  reason?: string;
}

// ==================== Admin API (для модераторов) ====================

export const moderationService = {
  /**
   * Получить заявки, ожидающие модерации
   */
  async getPendingRequests(): Promise<EditRequestResponse[]> {
    const response = await apiClient.get<EditRequestResponse[]>('/api/admin/moderation/pending');
    return response.data;
  },

  /**
   * Получить заявку по ID
   */
  async getRequest(requestId: number): Promise<EditRequestResponse> {
    const response = await apiClient.get<EditRequestResponse>(`/api/admin/moderation/${requestId}`);
    return response.data;
  },

  /**
   * Одобрить заявку
   */
  async approveRequest(requestId: number): Promise<EditRequestResponse> {
    const response = await apiClient.post<EditRequestResponse>(`/api/admin/moderation/${requestId}/approve`);
    return response.data;
  },

  /**
   * Отклонить заявку
   */
  async rejectRequest(requestId: number, reason: string): Promise<EditRequestResponse> {
    const response = await apiClient.post<EditRequestResponse>(
      `/api/admin/moderation/${requestId}/reject`,
      { approved: false, reason }
    );
    return response.data;
  },

  /**
   * Получить конфигурацию полей модерации
   */
  async getFieldConfigs(): Promise<FieldConfigDto[]> {
    const response = await apiClient.get<FieldConfigDto[]>('/api/admin/moderation/config');
    return response.data;
  },

  /**
   * Обновить конфигурацию поля модерации
   */
  async updateFieldConfig(configId: number, moderationType: string, active: boolean): Promise<void> {
    await apiClient.put(`/api/admin/moderation/config/${configId}`, null, {
      params: { moderationType, active }
    });
  },

  // ==================== Seller API (для продавцов) ====================

  /**
   * Получить мои заявки на модерацию
   */
  async getMyRequests(): Promise<EditRequestResponse[]> {
    const response = await apiClient.get<EditRequestResponse[]>('/api/moderation/my');
    return response.data;
  },

  /**
   * Получить мои ожидающие заявки
   */
  async getMyPendingRequests(): Promise<EditRequestResponse[]> {
    const response = await apiClient.get<EditRequestResponse[]>('/api/moderation/my/pending');
    return response.data;
  },

  /**
   * Получить ожидающие изменения для оффера
   */
  async getOfferPendingChanges(offerId: number): Promise<EditRequestResponse[]> {
    const response = await apiClient.get<EditRequestResponse[]>(`/api/moderation/offers/${offerId}/pending`);
    return response.data;
  },

  /**
   * Получить ожидающие изменения для магазина
   */
  async getSellerPendingChanges(sellerId: number): Promise<EditRequestResponse[]> {
    const response = await apiClient.get<EditRequestResponse[]>(`/api/moderation/sellers/${sellerId}/pending`);
    return response.data;
  }
};
