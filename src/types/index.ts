export interface Product {
  id: string;
  name: string;
  slug?: string;
  fullSlug?: string;  // slug-id для URL
  price: string;
  oldPrice?: string;
  image: string;
  rating: number;
  reviews: number;
  discount?: number;
  description?: string;
  category?: string;
  seller?: {
    name: string;
    rating: number;
    slug?: string;
    fullSlug?: string;
  };
  specifications?: Record<string, string>;
  images?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  fullSlug?: string;  // slug-id для URL
  image: string;
  count: number;
  icon?: string;
}

/**
 * Информация о пользователе (базовая, из auth)
 */
export interface UserInfo {
  id: number;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  roles: string[];
  avatarUrl?: string;
  avatarInitials?: string;
  avatarBackgroundColor?: string;
  hasCustomAvatar?: boolean;
}

/**
 * Полный профиль пользователя
 */
export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  avatarUrl?: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
  avatarInitials?: string;
  avatarBackgroundColor?: string;
  hasCustomAvatar: boolean;
}
