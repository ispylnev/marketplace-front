/**
 * Типы для работы с отзывами
 */

export type ReviewStatus = 'PENDING_MODERATION' | 'APPROVED' | 'REJECTED';

export interface ReviewImageDto {
  id: number;
  url: string;
  sortOrder: number;
}

export interface ReviewResponseDto {
  id: number;
  reviewId: number;
  sellerId: number;
  sellerShopName?: string;
  comment: string;
  status: ReviewStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface ReviewDto {
  id: number;
  offerId: number;
  buyerId: number;
  orderId: number;
  sellerId: number;
  rating: number;
  comment: string;
  status: ReviewStatus;
  rejectionReason?: string;
  images: ReviewImageDto[];
  sellerResponse?: ReviewResponseDto;
  buyerDisplayName?: string;
  createdAt: string;
  moderatedAt?: string;
}

export interface ReviewStatsDto {
  offerId: number;
  averageRating: number;
  reviewCount: number;
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;
}

export interface CreateReviewRequest {
  offerId: number;
  orderId: number;
  rating: number;
  comment: string;
  imageIds?: string[];
}

export interface CreateReviewResponseRequest {
  comment: string;
}
