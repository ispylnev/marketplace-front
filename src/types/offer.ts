/**
 * Типы для работы с офферами продавцов
 */

// ==================== Enums ====================

export type OfferCondition = 'NEW' | 'WITH_DEFECTS';

export type OfferStatus =
  | 'DRAFT'           // Черновик
  | 'PENDING_REVIEW'  // На модерации
  | 'APPROVED'        // Одобрен
  | 'REJECTED'        // Отклонён
  | 'DISABLED';       // Деактивирован

export type ImageType = 'MAIN' | 'GALLERY';

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// ==================== Shipping ====================

export interface ShippingDimensions {
  /** Вес брутто в граммах (включая упаковку) */
  weightGrams?: number;
  /** Длина упаковки в мм */
  lengthMm?: number;
  /** Ширина упаковки в мм */
  widthMm?: number;
  /** Высота упаковки в мм */
  heightMm?: number;
  /** Объём жидкости в мл (для жидких удобрений) */
  volumeMl?: number;
  /** Хрупкий товар */
  fragile?: boolean;
  /** Негабаритный груз */
  oversized?: boolean;
}

export interface ShippingDimensionsResponse extends ShippingDimensions {
  /** Объёмный вес в граммах (расчётное значение) */
  volumetricWeightGrams?: number;
  /** Тарифицируемый вес в граммах (max из фактического и объёмного) */
  chargeableWeightGrams?: number;
}

// ==================== Request DTOs ====================

/** Параметры ухода за растениями */
export interface CareAttributes {
  /** Требования к освещению */
  lighting?: 'LOW' | 'MEDIUM' | 'BRIGHT_INDIRECT' | 'DIRECT';
  /** Частота полива */
  watering?: 'RARE' | 'MODERATE' | 'FREQUENT';
  /** Сложность ухода */
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  /** Безопасно для питомцев */
  petSafe?: boolean;
  /** Очищает воздух */
  airPurifying?: boolean;
}

export interface CreateOfferRequest {
  /** ID товара из каталога. Можно указать либо productId, либо taxonomyId */
  productId?: number;
  /** ID таксономии (вида/сорта). Если указан, система найдёт активный товар */
  taxonomyId?: number;
  /** Название оффера (отображается покупателям) */
  name?: string;
  /** Описание оффера */
  description?: string;
  /** Цена */
  price: number;
  /** Валюта (по умолчанию RUB) */
  currency?: string;
  /** Состояние товара */
  condition?: OfferCondition;
  /** SKU продавца (уникален в рамках продавца) */
  sku: string;
  /** Штрихкод товара */
  barcode?: string;
  /** Время обработки заказа в днях */
  handlingTimeDays?: number;
  /** Гарантия в месяцах */
  warrantyMonths?: number;
  /** Логистические характеристики */
  shipping?: ShippingDimensions;
  /** ID временных загрузок изображений */
  imageIds?: string[];
  /** Параметры ухода (для растений) */
  careAttributes?: CareAttributes;
}

export interface UpdateOfferRequest {
  /** Цена */
  price?: number;
  /** Валюта */
  currency?: string;
  /** Состояние товара */
  condition?: OfferCondition;
  /** Штрихкод товара */
  barcode?: string;
  /** Время обработки заказа в днях */
  handlingTimeDays?: number;
  /** Гарантия в месяцах */
  warrantyMonths?: number;
  /** Логистические характеристики */
  shipping?: ShippingDimensions;
}

export interface UpdateOfferPriceRequest {
  /** Новая цена */
  price: number;
  /** Валюта */
  currency?: string;
}

// ==================== Response DTOs ====================

export interface OfferResponse {
  id: number;
  sellerId: number;
  productId: number;
  /** Сгенерированный SKU для инвентаря (появляется после одобрения) */
  inventorySkuId?: string;
  price: number;
  currency: string;
  condition: OfferCondition;
  sku: string;
  barcode?: string;
  handlingTimeDays: number;
  warrantyMonths?: number;
  shipping?: ShippingDimensionsResponse;
  status: OfferStatus;
  /** Причина отклонения (если статус REJECTED) */
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Название оффера или продукта */
  title?: string;
  /** Латинское (научное) название растения */
  latinName?: string;
  /** URL главного изображения */
  mainImageUrl?: string;
  /** URL миниатюры главного изображения */
  thumbnailUrl?: string;
}

export interface ThumbnailResponse {
  /** URL в оригинальном формате (JPEG/PNG) */
  url: string;
  /** URL в формате WebP (на 25-35% меньше) */
  webpUrl?: string;
  width: number;
  height: number;
}

export interface ProductImageResponse {
  id: number;
  productId: number;
  url: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  width?: number;
  height?: number;
  imageType: ImageType;
  sortOrder: number;
  processingStatus: ProcessingStatus;
  /** Миниатюры: sm (150px), md (300px), lg (600px) */
  thumbnails: Record<'sm' | 'md' | 'lg', ThumbnailResponse>;
  /**
   * BlurHash для lazy loading placeholder.
   * Компактная строка из которой можно сгенерировать размытое превью.
   * @see https://blurha.sh/
   */
  blurhash?: string;
  createdAt: string;
}

// ==================== Filter/Query types ====================

export interface OfferFilterParams {
  /** Фильтр по статусу */
  status?: OfferStatus;
  /** Номер страницы (начиная с 0) */
  page?: number;
  /** Размер страницы */
  size?: number;
}