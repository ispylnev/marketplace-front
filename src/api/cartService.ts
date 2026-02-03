import apiClient from './client';

/**
 * Типы для корзины
 */
export interface CartItem {
  offerId: number;
  productId: number;
  sellerId: number;
  sellerName?: string;
  quantity: number;
  priceSnapshot: number;
  currentPrice: number;
  currency: string;
  productName: string;
  imageUrl?: string;
  sku?: string;
  availableQuantity?: number;
  subtotal: number;
  isAvailable: boolean;
  priceChanged: boolean;
  canBuy: boolean;
  addedAt: string;
  warningMessage?: string;
}

export interface DeliveryOption {
  code: string;
  name: string;
  type: string;
  minDays?: number;
  maxDays?: number;
  deliveryTimeText?: string;
  minPrice?: number;
  priceText?: string;
  isFree: boolean;
  isAvailable: boolean;
  icon?: string;
  description?: string;
}

export interface SellerGroup {
  sellerId: number;
  sellerName: string;
  sellerLogo?: string;
  items: CartItem[];
  deliveryOptions: DeliveryOption[];
  selectedDeliveryCode?: string;
  selectedDelivery?: DeliveryOption;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  itemsCount: number;
  uniqueItemsCount: number;
  allItemsAvailable: boolean;
  deliverySelected: boolean;
  readyForCheckout: boolean;
}

export interface CartSummary {
  // Названия полей как на бэкенде
  itemsPrice: number;
  deliveryPrice: number;
  totalPrice: number;
  totalItems: number;
  uniqueItems: number;
  sellersCount: number;
  availableItemsCount?: number;
  problematicItemsCount?: number;
}

export interface CartResponse {
  cartId: string;
  sellerGroups: SellerGroup[];
  items: CartItem[];
  summary: CartSummary;
  updatedAt: string;
  isEmpty: boolean;
  isReadyForCheckout: boolean;
  hasProblematicItems: boolean;
  allDeliveriesSelected: boolean;
}

export interface AddToCartRequest {
  offerId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartCountResponse {
  count: number;
}

export interface CartError {
  error: string;
  code: string;
  offerId?: number;
  requested?: number;
  available?: number;
}

/**
 * Сервис для работы с корзиной
 */
export const cartService = {
  /**
   * Получить корзину
   */
  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get<CartResponse>('/api/cart');
    return response.data;
  },

  /**
   * Добавить товар в корзину
   */
  async addToCart(offerId: number, quantity: number = 1): Promise<CartResponse> {
    const request: AddToCartRequest = { offerId, quantity };
    const response = await apiClient.post<CartResponse>('/api/cart/items', request);
    // Уведомляем об изменении корзины
    window.dispatchEvent(new CustomEvent('cart-change'));
    return response.data;
  },

  /**
   * Обновить количество товара
   */
  async updateQuantity(offerId: number, quantity: number): Promise<CartResponse> {
    const request: UpdateCartItemRequest = { quantity };
    const response = await apiClient.put<CartResponse>(`/api/cart/items/${offerId}`, request);
    window.dispatchEvent(new CustomEvent('cart-change'));
    return response.data;
  },

  /**
   * Удалить товар из корзины
   */
  async removeItem(offerId: number): Promise<CartResponse> {
    const response = await apiClient.delete<CartResponse>(`/api/cart/items/${offerId}`);
    window.dispatchEvent(new CustomEvent('cart-change'));
    return response.data;
  },

  /**
   * Очистить корзину
   */
  async clearCart(): Promise<void> {
    await apiClient.delete('/api/cart');
    window.dispatchEvent(new CustomEvent('cart-change'));
  },

  /**
   * Получить количество товаров (для бейджа)
   */
  async getCartCount(): Promise<number> {
    const response = await apiClient.get<CartCountResponse>('/api/cart/count');
    return response.data.count;
  },

  /**
   * Объединить анонимную корзину с пользовательской (после логина)
   */
  async mergeCartsOnLogin(): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>('/api/cart/merge');
    return response.data;
  },

  /**
   * Выбрать способ доставки для продавца
   */
  async selectDelivery(sellerId: number, deliveryCode: string): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>('/api/cart/delivery', {
      sellerId,
      deliveryCode
    });
    return response.data;
  },

  /**
   * Получить способы доставки для продавца
   */
  async getDeliveryOptions(sellerId: number): Promise<DeliveryOption[]> {
    const response = await apiClient.get<DeliveryOption[]>(`/api/cart/delivery/${sellerId}`);
    return response.data;
  },

  /**
   * Проверить готовность к оформлению
   */
  async checkCheckoutReady(): Promise<{ ready: boolean; message: string }> {
    const response = await apiClient.get<{ ready: boolean; message: string }>('/api/cart/checkout-ready');
    return response.data;
  }
};

/**
 * Уведомить о изменении корзины (для обновления Header)
 */
export const notifyCartChange = () => {
  window.dispatchEvent(new CustomEvent('cart-change'));
};

export default cartService;
