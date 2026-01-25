import { cn } from '../ui/utils';

export type SortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'popularity_desc'
  | 'created_desc'
  | 'name_asc'
  | 'name_desc';

interface SortSelectProps {
  /** Текущее значение сортировки */
  value: SortOption;
  /** Callback при изменении */
  onChange: (value: SortOption) => void;
  /** Показывать релевантность (только если есть поисковый запрос) */
  showRelevance?: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'По релевантности' },
  { value: 'popularity_desc', label: 'По популярности' },
  { value: 'rating_desc', label: 'По рейтингу' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
  { value: 'created_desc', label: 'Новинки' },
  { value: 'name_asc', label: 'По названию А-Я' },
  { value: 'name_desc', label: 'По названию Я-А' },
];

/**
 * Выбор сортировки товаров.
 */
export default function SortSelect({
  value,
  onChange,
  showRelevance = true,
}: SortSelectProps) {
  const options = showRelevance
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter(opt => opt.value !== 'relevance');

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className={cn(
          'w-full px-3 py-2.5 border rounded-lg text-sm',
          'bg-white border-gray-300',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none',
          'cursor-pointer'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
