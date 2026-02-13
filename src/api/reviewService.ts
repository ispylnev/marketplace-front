import apiClient from './client';
import {
  ReviewDto,
  ReviewStatsDto,
  ReviewResponseDto,
  CreateReviewRequest,
  CreateReviewResponseRequest,
} from '../types/review';

/**
 * Сервис для работы с отзывами
 */
export const reviewService = {
  // ==================== Public ====================

  /**
   * Получить одобренные отзывы оффера с пагинацией и фильтром по рейтингу
   */
  async getOfferReviews(
    offerId: number,
    page = 0,
    size = 20,
    rating?: number
  ): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>(
      `/api/reviews/offer/${offerId}`,
      { params: { page, size, rating: rating || undefined } }
    );
    return response.data;
  },

  /**
   * Получить статистику рейтинга оффера
   */
  async getOfferRatingStats(offerId: number): Promise<ReviewStatsDto> {
    const response = await apiClient.get<ReviewStatsDto>(
      `/api/reviews/offer/${offerId}/stats`
    );
    return response.data;
  },

  /**
   * Получить одобренные отзывы на офферы продавца (публичный)
   */
  async getSellerReviewsPublic(
    sellerId: number,
    page = 0,
    size = 20
  ): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>(
      `/api/reviews/seller/${sellerId}`,
      { params: { page, size } }
    );
    return response.data;
  },

  // ==================== Buyer ====================

  /**
   * Проверить, может ли текущий пользователь оставить отзыв на оффер.
   * Возвращает canReview=true и orderId если доступен.
   */
  async canReview(offerId: number): Promise<{ canReview: boolean; orderId?: number }> {
    const response = await apiClient.get<{ canReview: boolean; orderId?: number }>(
      `/api/reviews/offer/${offerId}/can-review`
    );
    return response.data;
  },

  /**
   * Оставить отзыв на оффер
   */
  async submitReview(request: CreateReviewRequest): Promise<ReviewDto> {
    const response = await apiClient.post<ReviewDto>('/api/reviews', request);
    return response.data;
  },

  /**
   * Получить мои отзывы
   */
  async getMyReviews(page = 0, size = 20): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>('/api/reviews/my', {
      params: { page, size },
    });
    return response.data;
  },

  // ==================== Seller ====================

  /**
   * Ответить на отзыв (для продавца)
   */
  async submitSellerResponse(
    reviewId: number,
    request: CreateReviewResponseRequest
  ): Promise<ReviewResponseDto> {
    const response = await apiClient.post<ReviewResponseDto>(
      `/api/reviews/${reviewId}/response`,
      request
    );
    return response.data;
  },

  /**
   * Получить отзывы на мои офферы (для продавца)
   */
  async getSellerReviews(page = 0, size = 20): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>('/api/reviews/seller', {
      params: { page, size },
    });
    return response.data;
  },

  // ==================== Moderation ====================

  /**
   * Получить отзывы на модерации
   */
  async getPendingReviews(page = 0, size = 20): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>(
      '/api/reviews/moderation/pending',
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * Одобрить отзыв
   */
  async approveReview(reviewId: number): Promise<void> {
    await apiClient.post(`/api/reviews/${reviewId}/approve`);
  },

  /**
   * Отклонить отзыв
   */
  async rejectReview(reviewId: number, reason: string): Promise<void> {
    await apiClient.post(`/api/reviews/${reviewId}/reject`, null, {
      params: { reason },
    });
  },

  /**
   * Получить ответы продавцов на модерации
   */
  async getPendingResponses(
    page = 0,
    size = 20
  ): Promise<ReviewResponseDto[]> {
    const response = await apiClient.get<ReviewResponseDto[]>(
      '/api/reviews/moderation/pending-responses',
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * Одобрить ответ продавца
   */
  async approveResponse(responseId: number): Promise<void> {
    await apiClient.post(`/api/reviews/response/${responseId}/approve`);
  },

  /**
   * Отклонить ответ продавца
   */
  async rejectResponse(responseId: number, reason: string): Promise<void> {
    await apiClient.post(`/api/reviews/response/${responseId}/reject`, null, {
      params: { reason },
    });
  },
};
