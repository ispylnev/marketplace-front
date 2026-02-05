import apiClient from './client';

export interface StockResponse {
  id: number;
  inventorySku: string;
  offerId: number;
  sellerId: number;
  productId: number | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  status: string;
  warehouseId: number | null;
  createdAt: string;
  updatedAt: string;
  available: boolean;
}

export interface UpdateStockRequest {
  quantity?: number;
  lowStockThreshold?: number;
}

export const inventoryService = {
  async getMyStocks(): Promise<StockResponse[]> {
    const response = await apiClient.get<StockResponse[]>('/api/inventory/my');
    return response.data;
  },

  async getStockByOfferId(offerId: number): Promise<StockResponse> {
    const response = await apiClient.get<StockResponse>(`/api/inventory/offer/${offerId}`);
    return response.data;
  },

  async updateStock(stockId: number, request: UpdateStockRequest): Promise<StockResponse> {
    const response = await apiClient.put<StockResponse>(`/api/inventory/${stockId}`, request);
    return response.data;
  },

  async addStock(stockId: number, amount: number): Promise<StockResponse> {
    const response = await apiClient.post<StockResponse>(`/api/inventory/${stockId}/add`, null, {
      params: { amount }
    });
    return response.data;
  },

  async removeStock(stockId: number, amount: number): Promise<StockResponse> {
    const response = await apiClient.post<StockResponse>(`/api/inventory/${stockId}/remove`, null, {
      params: { amount }
    });
    return response.data;
  },

  async updateStockBySku(inventorySku: string, request: UpdateStockRequest): Promise<StockResponse> {
    const response = await apiClient.put<StockResponse>(`/api/inventory/sku/${inventorySku}`, request);
    return response.data;
  },

  async checkAvailability(offerId: number, quantity: number = 1): Promise<AvailabilityResponse> {
    const response = await apiClient.get<AvailabilityResponse>(`/api/inventory/availability/${offerId}`, {
      params: { quantity }
    });
    return response.data;
  },
};

export interface AvailabilityResponse {
  offerId: number;
  available: boolean;
  availableQuantity: number;
  requestedQuantity: number;
}