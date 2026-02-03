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
  | 'DISABLED'        // Деактивирован
  | 'DELETED';        // Удалён (soft delete)

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

// ==================== Category Attributes ====================

/** Тип атрибута категории */
export type AttributeType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ENUM' | 'DATE';

/** Конфигурация атрибута категории */
export interface CategoryAttribute {
  id: number;
  categoryId: number;
  /** Код атрибута (используется в API) */
  attributeCode: string;
  /** Название атрибута (отображается пользователю) */
  attributeName: string;
  /** Название на английском */
  attributeNameEn?: string;
  /** Тип атрибута */
  attributeType: AttributeType;
  /** Допустимые значения для ENUM типа */
  enumValues?: string[];
  /** Человекочитаемые подписи для ENUM значений */
  enumLabels?: Record<string, string>;
  /** Единица измерения (для NUMBER) */
  unit?: string;
  /** Обязательность заполнения */
  isRequired?: boolean;
  /** Минимальное значение (для NUMBER) */
  minValue?: number;
  /** Максимальное значение (для NUMBER) */
  maxValue?: number;
  /** Максимальная длина строки (для STRING) */
  maxLength?: number;
  /** Доступен для фильтрации */
  isFilterable?: boolean;
  /** Отображается в карточке товара */
  isVisible?: boolean;
  /** Порядок сортировки */
  sortOrder?: number;
  /** Группа атрибутов */
  attributeGroup?: string;
}

/** Значение атрибута оффера в запросе */
export interface OfferAttributeRequest {
  /** Код атрибута */
  attributeCode: string;
  /** Строковое значение (для STRING и ENUM) */
  valueString?: string;
  /** Числовое значение (для NUMBER) */
  valueNumber?: number;
  /** Булево значение (для BOOLEAN) */
  valueBoolean?: boolean;
}

/** Значение атрибута оффера в ответе */
export interface OfferAttributeResponse {
  id: number;
  offerId: number;
  attributeCode: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
}

/** Параметры ухода за растениями (поля совпадают с backend CareAttributesRequest) */
export interface CareAttributes {
  /** Требования к освещению */
  lightRequirement?: string;
  /** Частота полива */
  wateringFrequency?: string;
  /** Уровень влажности */
  humidityLevel?: string;
  /** Минимальная температура (°C) */
  temperatureMin?: number;
  /** Максимальная температура (°C) */
  temperatureMax?: number;
  /** Сложность ухода */
  careDifficulty?: string;
  /** Токсичность */
  toxicity?: string;
}

export interface CreateOfferRequest {
  /** ID товара из каталога. Можно указать либо productId, либо taxonomyId */
  productId?: number;
  /** ID таксономии (вида/сорта). Если указан, система найдёт активный товар */
  taxonomyId?: number;
  /** ID категории. Обязательно только для "Другое" (когда productId и taxonomyId не указаны) */
  categoryId?: number;
  /** Название оффера (отображается покупателям) */
  title?: string;
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
  /** Кастомные атрибуты оффера (определяются категорией) */
  attributes?: OfferAttributeRequest[];
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

  // === Поля карточки (подлежат модерации для APPROVED офферов) ===

  /** Название оффера */
  title?: string;
  /** Описание оффера */
  description?: string;
  /** ID категории */
  categoryId?: number;
  /** ID таксономии */
  taxonomyId?: number;
  /** ID бренда */
  brandId?: number;

  // === Атрибуты (применяются напрямую, без модерации) ===

  /** Параметры ухода (для растений) */
  careAttributes?: CareAttributes;
  /** Кастомные атрибуты оффера (определяются категорией) */
  attributes?: OfferAttributeRequest[];
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
  /** Описание оффера */
  description?: string;
  /** Латинское (научное) название растения */
  latinName?: string;

  // === Категория и таксономия ===

  /** ID категории */
  categoryId?: number;
  /** Название категории */
  categoryName?: string;
  /** Slug категории */
  categorySlug?: string;
  /** ID таксономии */
  taxonomyId?: number;
  /** Научное название таксона */
  taxonomyScientificName?: string;
  /** Русское название таксона */
  taxonomyCommonName?: string;

  /** URL главного изображения */
  mainImageUrl?: string;
  /** URL миниатюры главного изображения */
  thumbnailUrl?: string;

  // === Атрибуты ухода за растением ===

  lightRequirement?: string;
  wateringFrequency?: string;
  humidityLevel?: string;
  temperatureMin?: number;
  temperatureMax?: number;
  careDifficulty?: string;
  soilType?: string;
  growthRate?: string;
  maxHeightCm?: number;
  toxicity?: string;

  // === Динамические атрибуты категории ===

  attributes?: OfferAttributeResponse[];

  /** Поля, ожидающие модерации: fieldName -> "На модерации" */
  pendingChanges?: Record<string, string>;
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

export type ImageModerationStatus = 'APPROVED' | 'PENDING_MODERATION';

/** Изображение оффера (такая же структура как ProductImageResponse, но с offerId) */
export interface OfferImageResponse {
  id: number;
  offerId: number;
  url: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  width?: number;
  height?: number;
  imageType: ImageType;
  sortOrder: number;
  processingStatus: ProcessingStatus;
  thumbnails: Record<'sm' | 'md' | 'lg', ThumbnailResponse>;
  blurhash?: string;
  /** Статус модерации изображения */
  moderationStatus?: ImageModerationStatus;
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