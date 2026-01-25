import { X } from 'lucide-react';
import { cn } from '../ui/utils';

export interface ActiveFilter {
  /** Уникальный ключ фильтра */
  key: string;
  /** Отображаемое название */
  label: string;
  /** Значение для отображения */
  value: string;
  /** Тип фильтра (для группировки и иконок) */
  type: 'category' | 'brand' | 'price' | 'attribute' | 'other';
}

interface ActiveFiltersProps {
  /** Список активных фильтров */
  filters: ActiveFilter[];
  /** Callback при удалении фильтра */
  onRemove: (key: string) => void;
  /** Callback при сбросе всех фильтров */
  onClearAll: () => void;
}

/**
 * Отображение активных фильтров в виде тегов.
 *
 * Позволяет быстро удалять отдельные фильтры или сбросить все.
 */
export default function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-xl">
      <span className="text-sm text-gray-500 mr-1">Фильтры:</span>

      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemove(filter.key)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
            'bg-white border border-gray-200 shadow-sm',
            'hover:bg-red-50 hover:border-red-200 hover:text-red-700',
            'transition-colors group'
          )}
          title={`Убрать фильтр: ${filter.label}`}
        >
          <span className="text-gray-600 group-hover:text-red-600">
            {filter.label}:
          </span>
          <span className="font-medium text-gray-900 group-hover:text-red-700">
            {filter.value}
          </span>
          <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
        </button>
      ))}

      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm',
            'text-primary-600 hover:text-primary-700 hover:bg-primary-50',
            'transition-colors font-medium'
          )}
        >
          Сбросить все
        </button>
      )}
    </div>
  );
}
