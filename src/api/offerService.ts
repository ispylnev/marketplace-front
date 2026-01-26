import apiClient from './client';
import {
  CreateOfferRequest,
  UpdateOfferRequest,
  UpdateOfferPriceRequest,
  OfferResponse,
  OfferFilterParams,
  ProductImageResponse
} from '../types/offer';

/**
 * Сервис для работы с офферами продавца
 */
export const offerService = {
  // ==================== CRUD операции ====================

  /**
   * Создать новый оффер (статус DRAFT)
   * @param request Данные для создания
   * @returns Созданный оффер
   */
  async createOffer(request: CreateOfferRequest): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>('/api/offers', request);
    return response.data;
  },

  /**
   * Получить оффер по ID
   * @param offerId ID оффера
   * @returns Информация об оффере
   */
  async getOffer(offerId: number): Promise<OfferResponse> {
    const response = await apiClient.get<OfferResponse>(`/api/offers/${offerId}`);
    return response.data;
  },

  /**
   * Получить мои офферы (для текущего продавца)
   * @param params Параметры фильтрации
   * @returns Список офферов
   */
  async getMyOffers(params?: OfferFilterParams): Promise<OfferResponse[]> {
    const response = await apiClient.get<OfferResponse[]>('/api/offers/my', { params });
    return response.data;
  },

  /**
   * Обновить оффер
   * @param offerId ID оффера
   * @param request Данные для обновления
   * @returns Обновлённый оффер
   */
  async updateOffer(offerId: number, request: UpdateOfferRequest): Promise<OfferResponse> {
    const response = await apiClient.put<OfferResponse>(`/api/offers/${offerId}`, request);
    return response.data;
  },

  /**
   * Обновить только цену оффера
   * @param offerId ID оффера
   * @param request Новая цена
   * @returns Обновлённый оффер
   */
  async updateOfferPrice(offerId: number, request: UpdateOfferPriceRequest): Promise<OfferResponse> {
    const response = await apiClient.put<OfferResponse>(`/api/offers/${offerId}/price`, request);
    return response.data;
  },

  // ==================== Управление статусом ====================

  /**
   * Отправить оффер на модерацию (DRAFT -> PENDING_REVIEW)
   * @param offerId ID оффера
   * @returns Оффер с обновлённым статусом
   */
  async submitForReview(offerId: number): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>(`/api/offers/${offerId}/submit`);
    return response.data;
  },

  /**
   * Деактивировать оффер (APPROVED -> DISABLED)
   * @param offerId ID оффера
   * @returns Оффер с обновлённым статусом
   */
  async deactivateOffer(offerId: number): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>(`/api/offers/${offerId}/deactivate`);
    return response.data;
  },

  /**
   * Реактивировать оффер (DISABLED -> APPROVED)
   * @param offerId ID оффера
   * @returns Оффер с обновлённым статусом
   */
  async reactivateOffer(offerId: number): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>(`/api/offers/${offerId}/reactivate`);
    return response.data;
  },

  /**
   * Повторно подать оффер после отклонения (REJECTED -> PENDING_REVIEW)
   * @param offerId ID оффера
   * @returns Оффер с обновлённым статусом
   */
  async resubmitOffer(offerId: number): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>(`/api/offers/${offerId}/resubmit`);
    return response.data;
  },

  // ==================== Публичные эндпоинты ====================

  /**
   * Получить одобренные офферы для товара
   * @param productId ID товара
   * @returns Список одобренных офферов
   */
  async getProductOffers(productId: number): Promise<OfferResponse[]> {
    const response = await apiClient.get<OfferResponse[]>(`/api/offers/product/${productId}`);
    return response.data;
  },

  // ==================== Изображения ====================

  /**
   * Получить изображения товара
   * @param productId ID товара
   * @returns Список изображений
   */
  async getProductImages(productId: number): Promise<ProductImageResponse[]> {
    const response = await apiClient.get<ProductImageResponse[]>(
      `/api/products/${productId}/images`
    );
    return response.data;
  },

  /**
   * Загрузить изображение для товара
   * @param productId ID товара
   * @param file Файл изображения
   * @param isMain Установить как главное изображение
   * @returns Информация о загруженном изображении
   */
  async uploadProductImage(
    productId: number,
    file: File,
    isMain: boolean = false
  ): Promise<ProductImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isMain', String(isMain));

    const response = await apiClient.post<ProductImageResponse>(
      `/api/products/${productId}/images`,
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
   * Установить изображение как главное
   * @param productId ID товара
   * @param imageId ID изображения
   * @returns Обновлённая информация об изображении
   */
  async setImageAsMain(productId: number, imageId: number): Promise<ProductImageResponse> {
    const response = await apiClient.put<ProductImageResponse>(
      `/api/products/${productId}/images/${imageId}/main`
    );
    return response.data;
  },

  /**
   * Изменить порядок сортировки изображения
   * @param productId ID товара
   * @param imageId ID изображения
   * @param sortOrder Новый порядок
   * @returns Обновлённая информация об изображении
   */
  async updateImageSortOrder(
    productId: number,
    imageId: number,
    sortOrder: number
  ): Promise<ProductImageResponse> {
    const response = await apiClient.put<ProductImageResponse>(
      `/api/products/${productId}/images/${imageId}/order`,
      null,
      { params: { sortOrder } }
    );
    return response.data;
  },

  /**
   * Удалить изображение
   * @param productId ID товара
   * @param imageId ID изображения
   */
  async deleteProductImage(productId: number, imageId: number): Promise<void> {
    await apiClient.delete(`/api/products/${productId}/images/${imageId}`);
  },

  /**
   * Повторно сгенерировать миниатюры (если обработка не удалась)
   * @param productId ID товара
   * @param imageId ID изображения
   * @returns Обновлённая информация об изображении
   */
  async retryThumbnails(productId: number, imageId: number): Promise<ProductImageResponse> {
    const response = await apiClient.post<ProductImageResponse>(
      `/api/products/${productId}/images/${imageId}/retry-thumbnails`
    );
    return response.data;
  },

  // ==================== Модерация (для модераторов/админов) ====================

  /**
   * Получить офферы на модерации
   * @returns Список офферов со статусом PENDING_REVIEW
   */
  async getPendingOffers(): Promise<OfferResponse[]> {
    const response = await apiClient.get<OfferResponse[]>('/api/offers/pending');
    return response.data;
  },

  /**
   * Одобрить оффер (PENDING_REVIEW -> APPROVED)
   * @param offerId ID оффера
   * @returns Одобренный оффер
   */
  async approveOffer(offerId: number): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>(`/api/offers/${offerId}/approve`);
    return response.data;
  },

  /**
   * Отклонить оффер (PENDING_REVIEW -> REJECTED)
   * @param offerId ID оффера
   * @param reason Причина отклонения
   * @returns Отклонённый оффер
   */
  async rejectOffer(offerId: number, reason: string): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>(
      `/api/offers/${offerId}/reject`,
      null,
      { params: { reason } }
    );
    return response.data;
  }
};