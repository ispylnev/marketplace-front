import apiClient from './client';

/**
 * Элемент избранного с обогащёнными данными оффера.
 */
export interface FavoriteItem {
  id: number;
  offerId: number;
  productId: number;
  sellerId: number;
  productName: string;
  imageUrl: string;
  price: number;
  currency: string;
  available: boolean;
  addedAt: string;
}

/**
 * Сервис для работы с избранным.
 */
export const favoritesService = {
  /**
   * Добавить оффер в избранное.
   */
  async addFavorite(offerId: number): Promise<FavoriteItem> {
    const response = await apiClient.post<FavoriteItem>(`/api/favorites/${offerId}`);
    window.dispatchEvent(new CustomEvent('favorites-change'));
    return response.data;
  },

  /**
   * Удалить оффер из избранного.
   */
  async removeFavorite(offerId: number): Promise<void> {
    await apiClient.delete(`/api/favorites/${offerId}`);
    window.dispatchEvent(new CustomEvent('favorites-change'));
  },

  /**
   * Получить избранное с пагинацией.
   */
  async getFavorites(page: number = 0, size: number = 50): Promise<FavoriteItem[]> {
    const response = await apiClient.get<FavoriteItem[]>('/api/favorites', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Получить ID всех офферов в избранном.
   */
  async getFavoriteIds(): Promise<number[]> {
    const response = await apiClient.get<number[]>('/api/favorites/ids');
    return response.data;
  },

  /**
   * Получить количество элементов в избранном.
   */
  async getFavoritesCount(): Promise<number> {
    const response = await apiClient.get<number>('/api/favorites/count');
    return response.data;
  },
};

export default favoritesService;
