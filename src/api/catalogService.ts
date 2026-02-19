import apiClient from './client';
import { CategoryAttribute } from '../types/offer';

/**
 * Публичный сервис каталога (без авторизации)
 */

// Категория для публичного отображения
export interface CategoryPublic {
  id: number;
  name: string;
  slug: string;
  fullSlug?: string;  // slug-id для URL: /catalog/{fullSlug}
  description?: string;
  parentId?: number;
  level?: number;
  sortOrder?: number;
  isActive: boolean;
  categoryType?: string;
  isPlant?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Продукт для публичного отображения
export interface ProductPublic {
  id: number;
  name: string;
  slug: string;
  fullSlug?: string;  // slug-id для URL: /product/{fullSlug}
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

// Бренд для публичного отображения
export interface BrandPublic {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  active: boolean;
}

export const catalogService = {
  // ==================== Категории ====================

  /**
   * Получить все активные категории (публичный API)
   */
  async getActiveCategories(): Promise<CategoryPublic[]> {
    const response = await apiClient.get<CategoryPublic[]>('/api/catalog/categories');
    return response.data;
  },

  /**
   * Получить все категории (включая неактивные)
   */
  async getAllCategories(): Promise<CategoryPublic[]> {
    const response = await apiClient.get<CategoryPublic[]>('/api/catalog/categories/all');
    return response.data;
  },

  /**
   * Получить категорию по ID
   */
  async getCategoryById(id: number): Promise<CategoryPublic> {
    const response = await apiClient.get<CategoryPublic>(`/api/catalog/categories/${id}`);
    return response.data;
  },

  /**
   * Получить категорию по slug
   */
  async getCategoryBySlug(slug: string): Promise<CategoryPublic> {
    const response = await apiClient.get<CategoryPublic>(`/api/catalog/categories/slug/${slug}`);
    return response.data;
  },

  /**
   * Получить дочерние категории
   */
  async getChildCategories(parentId: number): Promise<CategoryPublic[]> {
    const response = await apiClient.get<CategoryPublic[]>(`/api/catalog/categories/${parentId}/children`);
    return response.data;
  },

  /**
   * Получить корневые категории (level = 0)
   */
  async getRootCategories(): Promise<CategoryPublic[]> {
    const categories = await this.getActiveCategories();
    return categories.filter(c => c.level === 0 || c.parentId === null);
  },

  // ==================== Продукты ====================

  /**
   * Получить продукт по ID
   */
  async getProductById(id: number): Promise<ProductPublic> {
    const response = await apiClient.get<ProductPublic>(`/api/catalog/products/${id}`);
    return response.data;
  },

  /**
   * Получить продукт по slug
   */
  async getProductBySlug(slug: string): Promise<ProductPublic> {
    const response = await apiClient.get<ProductPublic>(`/api/catalog/products/slug/${slug}`);
    return response.data;
  },

  /**
   * Получить активные продукты категории
   */
  async getProductsByCategory(categoryId: number): Promise<ProductPublic[]> {
    const response = await apiClient.get<ProductPublic[]>(`/api/catalog/categories/${categoryId}/products`);
    return response.data;
  },

  /**
   * Получить все продукты категории (включая неактивные)
   */
  async getAllProductsByCategory(categoryId: number): Promise<ProductPublic[]> {
    const response = await apiClient.get<ProductPublic[]>(`/api/catalog/categories/${categoryId}/products/all`);
    return response.data;
  },

  // ==================== Атрибуты категорий ====================

  /**
   * Получить атрибуты категории (с наследованием от родителей).
   * Используется при создании оффера для отображения динамических полей.
   */
  async getCategoryAttributes(categoryId: number): Promise<CategoryAttribute[]> {
    const response = await apiClient.get<CategoryAttribute[]>(`/api/categories/${categoryId}/attributes`);
    return response.data;
  },

  // ==================== Бренды ====================

  /**
   * Поиск брендов по названию (автокомплит)
   */
  async searchBrands(query: string, limit = 10): Promise<BrandPublic[]> {
    const response = await apiClient.get<BrandPublic[]>('/api/brands/search', {
      params: { q: query, limit },
    });
    return response.data;
  },
};