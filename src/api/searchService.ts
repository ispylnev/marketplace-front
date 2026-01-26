import apiClient from './client';

/**
 * Сервис поиска товаров (Elasticsearch)
 */

// Продукт в результатах поиска
export interface ProductHit {
  productId: number;
  name: string;
  slug: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  mainImageUrl?: string;
  mainImageThumbnailUrl?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  inStock: boolean;
  offersCount: number;
  rating?: number;
  reviewsCount: number;
  score?: number;
}

// Диапазон цен
export interface PriceRange {
  min: number;
  max: number;
  avg: number;
}

// Бакет фасета
export interface FacetBucket {
  id: number;
  name?: string;
  count: number;
}

// Бакет атрибута ухода
export interface CareAttributeBucket {
  code: string;
  name: string;
  count: number;
}

// Диапазон температур
export interface TemperatureRange {
  min: number;
  max: number;
  avg: number;
}

// Фасеты поиска
export interface SearchFacets {
  categories: FacetBucket[];
  brands: FacetBucket[];
  priceRange?: PriceRange;
  inStockCount: number;

  // Care attributes
  lightRequirements?: CareAttributeBucket[];
  wateringFrequencies?: CareAttributeBucket[];
  humidityLevels?: CareAttributeBucket[];
  soilTypes?: CareAttributeBucket[];
  careDifficulties?: CareAttributeBucket[];
  toxicities?: CareAttributeBucket[];
  growthRates?: CareAttributeBucket[];
  petSafeCount?: number;
  beginnerFriendlyCount?: number;
  temperatureRange?: TemperatureRange;
}

// Ответ поиска
export interface ProductSearchResponse {
  hits: ProductHit[];
  totalHits: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  facets?: SearchFacets;
  tookMs: number;
}

// Параметры поиска
export interface ProductSearchParams {
  q?: string;
  categoryId?: number;
  brandId?: number;
  brandIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'popularity_desc' | 'created_desc' | 'name_asc' | 'name_desc';
  page?: number;
  size?: number;
  includeFacets?: boolean;
}

// Статус поиска
export interface SearchStatus {
  status: 'OK' | 'DEGRADED';
  elasticsearch: 'connected' | 'unavailable';
  totalDocuments?: number;
  responseTimeMs?: number;
  message?: string;
}

// ==================== Offer Search (Offer-centric) ====================

// Оффер в результатах поиска
export interface OfferHit {
  offerId: number;
  sellerId: number;
  productId?: number;
  title: string;
  description?: string;
  sku?: string;
  status: string;

  // Категория
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;

  // Таксономия
  taxonomyId?: number;
  taxonomyScientificName?: string;
  taxonomyCommonName?: string;

  // Care attributes (из Offer override или Taxonomy default)
  lightRequirement?: string;
  wateringFrequency?: string;
  humidityLevel?: string;
  temperatureMin?: number;
  temperatureMax?: number;
  careDifficulty?: string;
  petSafe?: boolean;
  beginnerFriendly?: boolean;

  // Цена
  price?: number;
  currency?: string;
  condition?: string;

  // Наличие
  inStock?: boolean;
  availableQuantity?: number;

  // Изображения
  mainImageUrl?: string;
  mainImageThumbnailUrl?: string;

  // Продавец
  sellerName?: string;
  sellerRating?: number;

  score?: number;
}

// Фасеты для офферов
export interface OfferFacets {
  // Категории
  categories: FacetBucket[];

  // Продавцы
  sellers: FacetBucket[];

  // Цена
  priceRange?: PriceRange;

  // Care attributes
  careFacets?: CareFacets;

  // Наличие
  inStockCount: number;
}

// Фасеты по атрибутам ухода
export interface CareFacets {
  lightRequirements: StringFacetBucket[];
  wateringFrequencies: StringFacetBucket[];
  humidityLevels: StringFacetBucket[];
  careDifficulties: StringFacetBucket[];
  petSafeCount: number;
  beginnerFriendlyCount: number;
}

// Бакет со строковым ключом
export interface StringFacetBucket {
  key: string;
  name?: string;
  count: number;
}

// Ответ поиска офферов
export interface OfferSearchResponse {
  hits: OfferHit[];
  totalHits: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  facets?: OfferFacets;
  tookMs: number;
}

// Параметры поиска офферов
export interface OfferSearchParams {
  q?: string;
  categoryId?: number;
  sellerId?: number;
  taxonomyId?: number;

  // Care attribute filters
  lightRequirements?: string[];
  wateringFrequencies?: string[];
  humidityLevels?: string[];
  careDifficulties?: string[];
  petSafe?: boolean;
  beginnerFriendly?: boolean;

  // Price filters
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;

  // Pagination
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'popularity_desc' | 'created_desc';
  page?: number;
  size?: number;
  includeFacets?: boolean;
}

// ==================== Plant Search (Legacy - Taxonomy-centric) ====================

// Растение в результатах поиска
export interface PlantHit {
  taxonomyId: number;
  scientificName: string;
  commonName: string;
  commonNameEn?: string;
  taxonRank: string;
  description?: string;
  imageUrl?: string;
  family?: string;
  genus?: string;

  // Care attributes (из Taxonomy)
  lightRequirement?: string;
  wateringFrequency?: string;
  humidityLevel?: string;
  soilType?: string;
  careDifficulty?: string;
  toxicity?: string;
  growthRate?: string;
  temperatureMin?: number;
  temperatureMax?: number;
  maxHeightCm?: number;
  petSafe: boolean;
  beginnerFriendly: boolean;

  // Category
  primaryCategoryId?: number;
  primaryCategoryName?: string;

  // Offer aggregation
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  inStock: boolean;
  offersCount: number;
  sellersCount: number;
  hasOffers: boolean;

  score?: number;
}

// Фасеты для растений
export interface PlantFacets {
  // Care attributes
  lightRequirements: CareAttributeBucket[];
  wateringFrequencies: CareAttributeBucket[];
  humidityLevels: CareAttributeBucket[];
  soilTypes: CareAttributeBucket[];
  careDifficulties: CareAttributeBucket[];
  toxicities: CareAttributeBucket[];
  growthRates: CareAttributeBucket[];
  petSafeCount: number;
  beginnerFriendlyCount: number;
  temperatureRange?: TemperatureRange;

  // Categories
  categories: FacetBucket[];

  // Offer-based
  priceRange?: PriceRange;
  inStockCount: number;
  withOffersCount: number;
}

// Ответ поиска растений
export interface PlantSearchResponse {
  hits: PlantHit[];
  totalHits: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  facets?: PlantFacets;
  tookMs: number;
}

// ==================== Suggest (Autocomplete) ====================

// Элемент автокомплита
export interface SuggestItem {
  text: string;
  type: 'offer' | 'plant' | 'category';
  id: number;
  subtext?: string;
}

// Ответ группированного автокомплита
export interface SuggestGroupedResponse {
  offers: SuggestItem[];
  plants: SuggestItem[];
  categories: SuggestItem[];
}

// Параметры поиска растений
export interface PlantSearchParams {
  q?: string;
  categoryId?: number;

  // Care attribute filters
  lightRequirements?: string[];
  wateringFrequencies?: string[];
  humidityLevels?: string[];
  soilTypes?: string[];
  careDifficulties?: string[];
  toxicities?: string[];
  growthRates?: string[];
  petSafe?: boolean;
  beginnerFriendly?: boolean;

  // Offer-based filters
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasOffers?: boolean;

  // Pagination
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'popularity_desc';
  page?: number;
  size?: number;
  includeFacets?: boolean;
}

export const searchService = {
  /**
   * Поиск товаров с фильтрами и фасетами (Legacy)
   */
  async searchProducts(params: ProductSearchParams = {}): Promise<ProductSearchResponse> {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.set('q', params.q);
    if (params.categoryId) queryParams.set('categoryId', String(params.categoryId));
    if (params.brandId) queryParams.set('brandId', String(params.brandId));
    if (params.brandIds?.length) queryParams.set('brandIds', params.brandIds.join(','));
    if (params.minPrice !== undefined) queryParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) queryParams.set('maxPrice', String(params.maxPrice));
    if (params.inStock !== undefined) queryParams.set('inStock', String(params.inStock));
    if (params.minRating !== undefined) queryParams.set('minRating', String(params.minRating));
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.page !== undefined) queryParams.set('page', String(params.page));
    if (params.size !== undefined) queryParams.set('size', String(params.size));
    if (params.includeFacets !== undefined) queryParams.set('includeFacets', String(params.includeFacets));

    const response = await apiClient.get<ProductSearchResponse>(
      `/api/search/products?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Поиск офферов (Offer-centric)
   * Показывает конкретные товары с ценами от продавцов.
   * Care filters берутся из Offer (override) или Taxonomy (default).
   */
  async searchOffers(params: OfferSearchParams = {}): Promise<OfferSearchResponse> {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.set('q', params.q);
    if (params.categoryId) queryParams.set('categoryId', String(params.categoryId));
    if (params.sellerId) queryParams.set('sellerId', String(params.sellerId));
    if (params.taxonomyId) queryParams.set('taxonomyId', String(params.taxonomyId));

    // Care attributes
    if (params.lightRequirements?.length) queryParams.set('lightRequirements', params.lightRequirements.join(','));
    if (params.wateringFrequencies?.length) queryParams.set('wateringFrequencies', params.wateringFrequencies.join(','));
    if (params.humidityLevels?.length) queryParams.set('humidityLevels', params.humidityLevels.join(','));
    if (params.careDifficulties?.length) queryParams.set('careDifficulties', params.careDifficulties.join(','));
    if (params.petSafe !== undefined) queryParams.set('petSafe', String(params.petSafe));
    if (params.beginnerFriendly !== undefined) queryParams.set('beginnerFriendly', String(params.beginnerFriendly));

    // Price filters
    if (params.minPrice !== undefined) queryParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) queryParams.set('maxPrice', String(params.maxPrice));
    if (params.inStock !== undefined) queryParams.set('inStock', String(params.inStock));

    // Pagination
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.page !== undefined) queryParams.set('page', String(params.page));
    if (params.size !== undefined) queryParams.set('size', String(params.size));
    if (params.includeFacets !== undefined) queryParams.set('includeFacets', String(params.includeFacets));

    const response = await apiClient.get<OfferSearchResponse>(
      `/api/search/offers?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Автокомплит (подсказки)
   */
  async suggest(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const response = await apiClient.get<string[]>('/api/search/suggest', {
      params: { q: query, limit }
    });
    return response.data;
  },

  /**
   * Статус поискового индекса
   */
  async getStatus(): Promise<SearchStatus> {
    const response = await apiClient.get<SearchStatus>('/api/search/status');
    return response.data;
  },

  /**
   * Автокомплит с группировкой
   * Возвращает подсказки, сгруппированные по типу: офферы, растения, категории
   */
  async suggestGrouped(query: string, limit: number = 5): Promise<SuggestGroupedResponse> {
    if (!query || query.length < 2) {
      return { offers: [], plants: [], categories: [] };
    }

    const response = await apiClient.get<SuggestGroupedResponse>('/api/search/suggest/grouped', {
      params: { q: query, limit }
    });
    return response.data;
  },

  /**
   * Поиск растений (Taxonomy-centric)
   * Фильтры по уходу работают по данным Taxonomy.
   * Фильтры по цене/наличию работают по агрегированным Offers.
   */
  async searchPlants(params: PlantSearchParams = {}): Promise<PlantSearchResponse> {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.set('q', params.q);
    if (params.categoryId) queryParams.set('categoryId', String(params.categoryId));

    // Care attributes
    if (params.lightRequirements?.length) queryParams.set('lightRequirements', params.lightRequirements.join(','));
    if (params.wateringFrequencies?.length) queryParams.set('wateringFrequencies', params.wateringFrequencies.join(','));
    if (params.humidityLevels?.length) queryParams.set('humidityLevels', params.humidityLevels.join(','));
    if (params.soilTypes?.length) queryParams.set('soilTypes', params.soilTypes.join(','));
    if (params.careDifficulties?.length) queryParams.set('careDifficulties', params.careDifficulties.join(','));
    if (params.toxicities?.length) queryParams.set('toxicities', params.toxicities.join(','));
    if (params.growthRates?.length) queryParams.set('growthRates', params.growthRates.join(','));
    if (params.petSafe !== undefined) queryParams.set('petSafe', String(params.petSafe));
    if (params.beginnerFriendly !== undefined) queryParams.set('beginnerFriendly', String(params.beginnerFriendly));

    // Offer-based filters
    if (params.minPrice !== undefined) queryParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) queryParams.set('maxPrice', String(params.maxPrice));
    if (params.inStock !== undefined) queryParams.set('inStock', String(params.inStock));
    if (params.hasOffers !== undefined) queryParams.set('hasOffers', String(params.hasOffers));

    // Pagination
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.page !== undefined) queryParams.set('page', String(params.page));
    if (params.size !== undefined) queryParams.set('size', String(params.size));
    if (params.includeFacets !== undefined) queryParams.set('includeFacets', String(params.includeFacets));

    const response = await apiClient.get<PlantSearchResponse>(
      `/api/search/plants?${queryParams.toString()}`
    );
    return response.data;
  },
};