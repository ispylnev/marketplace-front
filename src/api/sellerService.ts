import apiClient from './client';
import {
  RegisterSellerRequest,
  UpdateSellerRequest,
  SellerResponse
} from '../types/seller';

export interface SellerOrderItemResponse {
  id: number;
  offerId: number;
  productId: number;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  pricePerUnit: number;
  quantity: number;
  totalPrice: number;
  status: string;
}

export interface SellerOrderDeliveryAddress {
  recipientName: string;
  recipientPhone: string;
  city: string;
  street: string;
  building: string;
  apartment?: string;
  postalCode?: string;
}

export interface SellerOrderResponse {
  id: number;
  orderNumber: string;
  userId: number;
  sellerId: number;
  status: string;
  items: SellerOrderItemResponse[];
  itemsTotal: number;
  deliveryPrice: number;
  totalAmount: number;
  currency: string;
  deliveryMethodName?: string;
  deliveryAddress?: SellerOrderDeliveryAddress;
  buyerComment?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

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

  /**
   * Получить разбивку резервов по офферам и статусам заказов.
   * @returns Map: offerId -> (orderStatus -> quantity)
   */
  async getReservedBreakdown(): Promise<Record<string, Record<string, number>>> {
    const response = await apiClient.get<Record<string, Record<string, number>>>('/api/seller/admin/orders/reserved-breakdown');
    return response.data;
  },

  // ==================== Seller Admin: Заказы ====================

  /**
   * Получить заказы продавца
   */
  async getSellerOrders(status?: string): Promise<SellerOrderResponse[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<SellerOrderResponse[]>('/api/seller/admin/orders', { params });
    return response.data;
  },

  /**
   * Принять заказ в обработку (PAID → PROCESSING)
   */
  async acceptOrder(orderId: number): Promise<SellerOrderResponse> {
    const response = await apiClient.post<SellerOrderResponse>(`/api/seller/admin/orders/${orderId}/accept`);
    return response.data;
  },

  /**
   * Отметить заказ как отправленный (PROCESSING → SHIPPED)
   */
  async shipOrder(orderId: number): Promise<SellerOrderResponse> {
    const response = await apiClient.post<SellerOrderResponse>(`/api/seller/admin/orders/${orderId}/ship`);
    return response.data;
  },

  /**
   * Отметить заказ как доставленный (SHIPPED → DELIVERED)
   */
  async deliverOrder(orderId: number): Promise<SellerOrderResponse> {
    const response = await apiClient.post<SellerOrderResponse>(`/api/seller/admin/orders/${orderId}/deliver`);
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

