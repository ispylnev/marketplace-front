/**
 * Утилиты для работы с SEO-friendly URL в формате slug-id
 * Пример: "monstera-deliciosa-123" -> { slug: "monstera-deliciosa", id: 123 }
 */

export interface ParsedSlug {
  slug: string;
  id: number;
}

/**
 * Парсит URL параметр в формате "slug-id" и извлекает ID.
 * @param slugWithId - строка вида "monstera-deliciosa-123"
 * @returns ParsedSlug или null если формат некорректный
 */
export function parseSlugId(slugWithId: string | undefined): ParsedSlug | null {
  if (!slugWithId) return null;

  const lastDashIndex = slugWithId.lastIndexOf('-');
  if (lastDashIndex === -1) {
    // Нет дефиса - возможно просто ID
    const id = parseInt(slugWithId, 10);
    return isNaN(id) ? null : { slug: '', id };
  }

  const idPart = slugWithId.substring(lastDashIndex + 1);
  const id = parseInt(idPart, 10);

  if (isNaN(id)) {
    // Последняя часть не число - возможно просто ID
    const numericId = parseInt(slugWithId, 10);
    return isNaN(numericId) ? null : { slug: '', id: numericId };
  }

  const slug = slugWithId.substring(0, lastDashIndex);
  return { slug, id };
}

/**
 * Извлекает только ID из slug-id строки.
 * @param slugWithId - строка вида "monstera-deliciosa-123"
 * @returns ID или null
 */
export function extractId(slugWithId: string | undefined): number | null {
  const parsed = parseSlugId(slugWithId);
  return parsed?.id ?? null;
}

/**
 * Генерирует URL для товара.
 * @param fullSlug - полный slug в формате "slug-id"
 */
export function productUrl(fullSlug: string): string {
  return `/product/${fullSlug}`;
}

/**
 * Генерирует URL для категории.
 * @param fullSlug - полный slug в формате "slug-id"
 */
export function categoryUrl(fullSlug: string): string {
  return `/catalog/${fullSlug}`;
}

/**
 * Генерирует URL для продавца.
 * @param fullSlug - полный slug в формате "slug-id"
 */
export function sellerUrl(fullSlug: string): string {
  return `/seller/${fullSlug}`;
}
