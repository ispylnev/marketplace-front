import apiClient from './client';
import {
  RegisterSellerRequest,
  UpdateSellerRequest,
  SellerResponse
} from '../types/seller';

/**
 * Сервис для работы с продавцами
 */
export const sellerService = {
  /**
   * Регистрация нового продавца
   * @param request Данные для регистрации
   * @returns Информация о зарегистрированном продавце
   */
  async registerSeller(request: RegisterSellerRequest): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>('/api/sellers/register', request);
    return response.data;
  },

  /**
   * Получить информацию о своем магазине
   * @returns Информация о магазине текущего пользователя
   */
  async getMySellerProfile(): Promise<SellerResponse> {
    const response = await apiClient.get<SellerResponse>('/api/sellers/me');
    return response.data;
  },

  /**
   * Обновить информацию о своем магазине
   * @param request Данные для обновления
   * @returns Обновленная информация о магазине
   */
  async updateMySellerProfile(request: UpdateSellerRequest): Promise<SellerResponse> {
    const response = await apiClient.put<SellerResponse>('/api/sellers/me', request);
    return response.data;
  },

  /**
   * Получить информацию о продавце по ID
   * @param sellerId ID продавца
   * @returns Информация о продавце
   */
  async getSeller(sellerId: number): Promise<SellerResponse> {
    const response = await apiClient.get<SellerResponse>(`/api/sellers/${sellerId}`);
    return response.data;
  },

  /**
   * Получить список одобренных продавцов
   * @returns Список одобренных продавцов
   */
  async getApprovedSellers(): Promise<SellerResponse[]> {
    const response = await apiClient.get<SellerResponse[]>('/api/sellers');
    return response.data;
  },

  /**
   * Приостановить свою деятельность как продавца
   * @returns Обновленная информация о магазине
   */
  async suspendMySellerProfile(): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>('/api/sellers/me/suspend');
    return response.data;
  },

  /**
   * Возобновить свою деятельность как продавца
   * @returns Обновленная информация о магазине
   */
  async reactivateMySellerProfile(): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>('/api/sellers/me/reactivate');
    return response.data;
  },

  /**
   * Повторно подать заявку после отклонения
   * @returns Обновленная информация о магазине
   */
  async resubmitMySellerApplication(): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>('/api/sellers/me/resubmit');
    return response.data;
  },

  /**
   * Загрузить логотип магазина
   * @param file Файл изображения
   * @returns Обновленная информация о магазине
   */
  async uploadLogo(file: File): Promise<SellerResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<SellerResponse>(
      '/api/sellers/me/logo',
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
   * Удалить логотип магазина
   * @returns Обновленная информация о магазине
   */
  async deleteLogo(): Promise<SellerResponse> {
    const response = await apiClient.delete<SellerResponse>('/api/sellers/me/logo');
    return response.data;
  },

  /**
   * Сгенерировать Inventory SKU для оффера
   * @param sellerSku SKU продавца
   * @returns Сгенерированный Inventory SKU
   */
  async generateInventorySku(sellerSku: string): Promise<string> {
    const response = await apiClient.get<string>(`/api/sellers/me/sku/${sellerSku}`);
    return response.data;
  },

  // ==================== Эндпоинты для модераторов/админов ====================

  /**
   * Получить список продавцов, ожидающих одобрения (только для модераторов/админов)
   * @returns Список продавцов со статусом PENDING
   */
  async getPendingSellers(): Promise<SellerResponse[]> {
    const response = await apiClient.get<SellerResponse[]>('/api/sellers/pending');
    return response.data;
  },

  /**
   * Одобрить продавца (только для модераторов/админов)
   * @param sellerId ID продавца
   * @returns Обновленная информация о продавце
   */
  async approveSeller(sellerId: number): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>(`/api/sellers/${sellerId}/approve`);
    return response.data;
  },

  /**
   * Заблокировать продавца (только для модераторов/админов)
   * @param sellerId ID продавца
   * @param reason Причина блокировки
   * @returns Обновленная информация о продавце
   */
  async blockSeller(sellerId: number, reason: string): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>(
      `/api/sellers/${sellerId}/block`,
      null,
      { params: { reason } }
    );
    return response.data;
  },

  /**
   * Разблокировать продавца (только для модераторов/админов)
   * @param sellerId ID продавца
   * @returns Обновленная информация о продавце
   */
  async unblockSeller(sellerId: number): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>(`/api/sellers/${sellerId}/unblock`);
    return response.data;
  },

  /**
   * Обновить информацию о продавце администратором (только для админов)
   * @param sellerId ID продавца
   * @param request Данные для обновления
   * @returns Обновленная информация о продавце
   */
  async updateSellerAsAdmin(sellerId: number, request: UpdateSellerRequest): Promise<SellerResponse> {
    const response = await apiClient.put<SellerResponse>(`/api/sellers/${sellerId}`, request);
    return response.data;
  }
};

