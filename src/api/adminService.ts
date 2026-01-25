import apiClient from './client';
import { SellerResponse } from '../types/seller';

/**
 * Интерфейсы для административных функций
 */

// Оффер для модерации (предложение от продавца)
export interface OfferForModeration {
  id: number;
  sellerId: number;
  productId: number;
  inventorySkuId: string;
  price: number;
  currency: string;
  condition: string;
  sku?: string;
  barcode?: string;
  handlingTimeDays?: number;
  warrantyMonths?: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE';
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Продукт (товарная карточка)
export interface ProductResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status: string;
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  taxonomyScientificName?: string;
  taxonomyCommonName?: string;
  mainImageUrl?: string;
  mainImageThumbnailUrl?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  offerCount: number;
  createdAt: string;
  updatedAt: string;
}

// Категория каталога
export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  level?: number;
  sortOrder?: number;
  isActive: boolean;
  categoryType?: string;
  taxonomyId?: number;
  createdAt: string;
  updatedAt: string;
}

// Бренд
export interface BrandResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  country?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Расширенная информация о продавце для админки
export interface SellerForAdmin extends SellerResponse {
  productsCount?: number;
  totalRevenue?: number;
  ordersCount?: number;
}

/**
 * Сервис для административных функций
 */
export const adminService = {
  // ==================== Модерация продавцов ====================
  
  /**
   * Получить список продавцов, ожидающих одобрения
   */
  async getPendingSellers(): Promise<SellerResponse[]> {
    const response = await apiClient.get<SellerResponse[]>('/api/sellers/pending');
    return response.data;
  },

  /**
   * Получить всех продавцов (для админа)
   */
  async getAllSellers(): Promise<SellerResponse[]> {
    const response = await apiClient.get<SellerResponse[]>('/api/sellers');
    return response.data;
  },

  /**
   * Одобрить продавца
   */
  async approveSeller(sellerId: number): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>(`/api/sellers/${sellerId}/approve`);
    return response.data;
  },

  /**
   * Отклонить заявку продавца (с возможностью повторной подачи)
   */
  async rejectSeller(sellerId: number, reason: string): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>(
      `/api/sellers/${sellerId}/reject`,
      null,
      { params: { reason } }
    );
    return response.data;
  },

  /**
   * Заблокировать продавца
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
   * Разблокировать продавца
   */
  async unblockSeller(sellerId: number): Promise<SellerResponse> {
    const response = await apiClient.post<SellerResponse>(`/api/sellers/${sellerId}/unblock`);
    return response.data;
  },

  // ==================== Модерация офферов ====================

  /**
   * Получить офферы на модерации
   */
  async getPendingOffers(): Promise<OfferForModeration[]> {
    const response = await apiClient.get<OfferForModeration[]>('/api/offers/pending');
    return response.data;
  },

  /**
   * Одобрить оффер
   */
  async approveOffer(offerId: number): Promise<OfferForModeration> {
    const response = await apiClient.post<OfferForModeration>(`/api/offers/${offerId}/approve`);
    return response.data;
  },

  /**
   * Отклонить оффер
   */
  async rejectOffer(offerId: number, reason: string): Promise<OfferForModeration> {
    const response = await apiClient.post<OfferForModeration>(
      `/api/offers/${offerId}/reject`,
      null,
      { params: { reason } }
    );
    return response.data;
  },

  // ==================== Управление товарами (Products) ====================

  /**
   * Получить все товары
   */
  async getAllProducts(): Promise<ProductResponse[]> {
    const response = await apiClient.get<ProductResponse[]>('/api/products');
    return response.data;
  },

  /**
   * Получить товар по ID
   */
  async getProduct(productId: number): Promise<ProductResponse> {
    const response = await apiClient.get<ProductResponse>(`/api/products/${productId}`);
    return response.data;
  },

  /**
   * Создать товар
   */
  async createProduct(data: {
    name: string;
    description?: string;
    brandId?: number;
    categoryId?: number;
    taxonomyId?: number;
  }): Promise<ProductResponse> {
    const response = await apiClient.post<ProductResponse>('/api/products', data);
    return response.data;
  },

  /**
   * Обновить товар
   */
  async updateProduct(productId: number, data: {
    name?: string;
    description?: string;
    brandId?: number;
    categoryId?: number;
  }): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/api/products/${productId}`, data);
    return response.data;
  },

  /**
   * Удалить товар
   */
  async deleteProduct(productId: number): Promise<void> {
    await apiClient.delete(`/api/products/${productId}`);
  },

  // ==================== Категории ====================

  /**
   * Получить все категории
   */
  async getCategories(): Promise<CategoryResponse[]> {
    const response = await apiClient.get<CategoryResponse[]>('/api/categories');
    return response.data;
  },

  /**
   * Получить категорию по ID
   */
  async getCategory(categoryId: number): Promise<CategoryResponse> {
    const response = await apiClient.get<CategoryResponse>(`/api/categories/${categoryId}`);
    return response.data;
  },

  /**
   * Создать категорию
   */
  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: number;
    categoryType?: string;
    sortOrder?: number;
  }): Promise<CategoryResponse> {
    const response = await apiClient.post<CategoryResponse>('/api/categories', data);
    return response.data;
  },

  /**
   * Обновить категорию
   */
  async updateCategory(categoryId: number, data: {
    name?: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
  }): Promise<CategoryResponse> {
    const response = await apiClient.put<CategoryResponse>(`/api/categories/${categoryId}`, data);
    return response.data;
  },

  /**
   * Удалить категорию
   */
  async deleteCategory(categoryId: number): Promise<void> {
    await apiClient.delete(`/api/categories/${categoryId}`);
  },

  /**
   * Активировать категорию
   */
  async activateCategory(categoryId: number): Promise<CategoryResponse> {
    const response = await apiClient.post<CategoryResponse>(`/api/categories/${categoryId}/activate`);
    return response.data;
  },

  /**
   * Деактивировать категорию
   */
  async deactivateCategory(categoryId: number): Promise<CategoryResponse> {
    const response = await apiClient.post<CategoryResponse>(`/api/categories/${categoryId}/deactivate`);
    return response.data;
  },

  // ==================== Бренды ====================

  /**
   * Получить все бренды
   */
  async getAllBrands(): Promise<BrandResponse[]> {
    const response = await apiClient.get<BrandResponse[]>('/api/brands');
    return response.data;
  },

  /**
   * Получить бренд по ID
   */
  async getBrand(brandId: number): Promise<BrandResponse> {
    const response = await apiClient.get<BrandResponse>(`/api/brands/${brandId}`);
    return response.data;
  },

  /**
   * Создать бренд
   */
  async createBrand(data: {
    name: string;
    slug: string;
    description?: string;
    country?: string;
  }): Promise<BrandResponse> {
    const response = await apiClient.post<BrandResponse>('/api/brands', data);
    return response.data;
  },

  /**
   * Обновить бренд
   */
  async updateBrand(brandId: number, data: {
    name?: string;
    slug?: string;
    description?: string;
    country?: string;
  }): Promise<BrandResponse> {
    const response = await apiClient.put<BrandResponse>(`/api/brands/${brandId}`, data);
    return response.data;
  },

  /**
   * Активировать бренд
   */
  async activateBrand(brandId: number): Promise<BrandResponse> {
    const response = await apiClient.post<BrandResponse>(`/api/brands/${brandId}/activate`);
    return response.data;
  },

  /**
   * Деактивировать бренд
   */
  async deactivateBrand(brandId: number): Promise<BrandResponse> {
    const response = await apiClient.post<BrandResponse>(`/api/brands/${brandId}/deactivate`);
    return response.data;
  },

  /**
   * Удалить бренд
   */
  async deleteBrand(brandId: number): Promise<void> {
    await apiClient.delete(`/api/brands/${brandId}`);
  },

};

