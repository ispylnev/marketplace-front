import apiClient from './client';

export interface OrderSummaryResponse {
  id: number;
  orderNumber: string;
  status: string;
  itemsCount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemResponse {
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

export interface DeliveryAddressResponse {
  recipientName: string;
  recipientPhone: string;
  city: string;
  street: string;
  building: string;
  apartment?: string;
  postalCode?: string;
}

export interface OrderDetailResponse {
  id: number;
  orderNumber: string;
  userId: number;
  sellerId: number;
  status: string;
  items: OrderItemResponse[];
  itemsTotal: number;
  deliveryPrice: number;
  totalAmount: number;
  currency: string;
  deliveryMethodName?: string;
  deliveryAddress?: DeliveryAddressResponse;
  buyerComment?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export const orderService = {
  async getMyOrders(status?: string): Promise<OrderSummaryResponse[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<OrderSummaryResponse[]>('/api/orders', { params });
    return response.data;
  },

  async getOrder(orderId: number): Promise<OrderDetailResponse> {
    const response = await apiClient.get<OrderDetailResponse>(`/api/orders/${orderId}`);
    return response.data;
  },

  async cancelOrder(orderId: number, reason?: string): Promise<OrderDetailResponse> {
    const params = reason ? { reason } : {};
    const response = await apiClient.post<OrderDetailResponse>(`/api/orders/${orderId}/cancel`, null, { params });
    return response.data;
  },
};
