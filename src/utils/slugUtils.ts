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
 * Таблица транслитерации кириллицы в латиницу.
 */
const TRANSLIT_MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
};

/**
 * Генерирует URL-safe slug из произвольной строки.
 * Транслитерирует кириллицу, убирает спецсимволы.
 * "Монстера Деликатесная" -> "monstera-delikatesnaya"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT_MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/**
 * Генерирует fullSlug в формате "slug-id" из названия и ID.
 * "Монстера Деликатесная", 18 -> "monstera-delikatesnaya-18"
 */
export function makeFullSlug(name: string, id: number | string): string {
  const slug = slugify(name);
  return slug ? `${slug}-${id}` : String(id);
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
