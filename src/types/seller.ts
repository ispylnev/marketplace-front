/**
 * Типы для работы с продавцами
 */

/**
 * Тип юридического лица продавца
 */
export enum CompanyType {
  /** Индивидуальный предприниматель */
  INDIVIDUAL_ENTREPRENEUR = 'INDIVIDUAL_ENTREPRENEUR',
  /** Общество с ограниченной ответственностью */
  LLC = 'LLC',
  /** Акционерное общество */
  JSC = 'JSC',
  /** Самозанятый */
  SELF_EMPLOYED = 'SELF_EMPLOYED'
}

/**
 * Статус продавца
 */
export enum SellerStatus {
  /** Ожидает одобрения */
  PENDING = 'PENDING',
  /** Одобрен */
  APPROVED = 'APPROVED',
  /** Заблокирован */
  BLOCKED = 'BLOCKED',
  /** Приостановлен */
  SUSPENDED = 'SUSPENDED'
}

/**
 * Запрос на регистрацию продавца
 */
export interface RegisterSellerRequest {
  /** Название магазина */
  shopName: string;
  /** Юридическое название */
  legalName: string;
  /** Тип юридического лица */
  companyType: CompanyType;
  /** ИНН (10 или 12 цифр) */
  inn: string;
  /** ОГРН (13 или 15 цифр) */
  ogrn?: string;
  /** Юридический адрес */
  legalAddress?: string;
  /** Контактный email */
  contactEmail: string;
  /** Контактный телефон */
  contactPhone?: string;
  /** Описание магазина */
  description?: string;
}

/**
 * Запрос на обновление продавца
 */
export interface UpdateSellerRequest {
  /** Название магазина */
  shopName?: string;
  /** Юридическое название */
  legalName?: string;
  /** Юридический адрес */
  legalAddress?: string;
  /** Контактный email */
  contactEmail?: string;
  /** Контактный телефон */
  contactPhone?: string;
  /** Описание магазина */
  description?: string;
}

/**
 * Ответ с информацией о продавце
 */
export interface SellerResponse {
  /** ID продавца */
  id: number;
  /** ID пользователя */
  userId: number;
  /** Название магазина */
  shopName: string;
  /** Юридическое название */
  legalName: string;
  /** Тип юридического лица */
  companyType: string;
  /** ИНН */
  inn: string;
  /** ОГРН */
  ogrn?: string;
  /** Юридический адрес */
  legalAddress?: string;
  /** Контактный email */
  contactEmail: string;
  /** Контактный телефон */
  contactPhone?: string;
  /** Описание магазина */
  description?: string;
  /** URL логотипа */
  logoUrl?: string;
  /** Статус продавца */
  status: SellerStatus;
  /** Причина блокировки */
  blockReason?: string;
  /** Рейтинг */
  rating?: number;
  /** Количество отзывов */
  reviewCount?: number;
  /** Дата одобрения */
  approvedAt?: string;
  /** Дата создания */
  createdAt: string;
  /** Дата обновления */
  updatedAt: string;
  /** Может ли создавать офферы */
  canCreateOffers: boolean;
  /** Инициалы для аватара */
  avatarInitials: string;
  /** Цвет фона аватара */
  avatarBackgroundColor: string;
  /** Есть ли кастомный логотип */
  hasCustomLogo: boolean;
}

/**
 * Человекочитаемые названия типов компаний
 */
export const CompanyTypeLabels: Record<CompanyType, string> = {
  [CompanyType.INDIVIDUAL_ENTREPRENEUR]: 'ИП',
  [CompanyType.LLC]: 'ООО',
  [CompanyType.JSC]: 'АО',
  [CompanyType.SELF_EMPLOYED]: 'Самозанятый'
};

/**
 * Человекочитаемые названия статусов продавца
 */
export const SellerStatusLabels: Record<SellerStatus, string> = {
  [SellerStatus.PENDING]: 'Ожидает одобрения',
  [SellerStatus.APPROVED]: 'Одобрен',
  [SellerStatus.BLOCKED]: 'Заблокирован',
  [SellerStatus.SUSPENDED]: 'Приостановлен'
};

