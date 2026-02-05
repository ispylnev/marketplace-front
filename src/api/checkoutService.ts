import apiClient from './client';

/**
 * Типы для checkout (упрощённый flow)
 */

export interface PlaceOrderRequest {
  deliveryAddressId?: number;
  newAddress?: NewAddressRequest;
  saveNewAddress?: boolean;
  paymentMethod: 'CARD' | 'SBP' | 'CASH_ON_DELIVERY';
  comment?: string;
}

export interface NewAddressRequest {
  title?: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  street: string;
  building: string;
  apartment?: string;
  postalCode?: string;
  comment?: string;
  setAsDefault?: boolean;
}

export interface CreatedOrder {
  orderId: number;
  orderNumber: string;
  sellerId: number;
  sellerName: string;
  total: number;
  itemsCount: number;
}

export interface CheckoutResultResponse {
  success: boolean;
  message: string;
  paymentId?: string;
  orders?: CreatedOrder[];
  totalPaid?: number;
  errorCode?: string;
}

export interface DeliveryAddress {
  id: number;
  title?: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  street: string;
  building: string;
  apartment?: string;
  postalCode?: string;
  comment?: string;
  fullAddress?: string;
  isDefault: boolean;
}

/**
 * Сервис для работы с checkout.
 *
 * Упрощённый flow:
 * 1. Пользователь открывает /checkout — загружаются корзина и адреса (без backend-резервирований)
 * 2. Заполняет форму (адрес, оплата, комментарий)
 * 3. Нажимает "Оформить заказ" -> placeOrder() -> атомарно создаются заказы
 */
export const checkoutService = {
  /**
   * Оформить заказ.
   * Атомарно: валидация -> резерв -> создание заказов -> очистка корзины.
   */
  async placeOrder(request: PlaceOrderRequest): Promise<CheckoutResultResponse> {
    const response = await apiClient.post<CheckoutResultResponse>('/api/checkout/place-order', request);
    return response.data;
  },

  /**
   * Получить сохраненные адреса доставки
   */
  async getAddresses(): Promise<DeliveryAddress[]> {
    const response = await apiClient.get<DeliveryAddress[]>('/api/user/addresses');
    return response.data;
  },

  /**
   * Создать новый адрес доставки
   */
  async createAddress(address: NewAddressRequest): Promise<DeliveryAddress> {
    const response = await apiClient.post<DeliveryAddress>('/api/user/addresses', address);
    return response.data;
  },
};

export default checkoutService;
