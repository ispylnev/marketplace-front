import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '../ui/utils';

export interface FilterOption {
  id: string | number;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface CheckboxFilterProps {
  /** Заголовок фильтра */
  title: string;
  /** Доступные опции */
  options: FilterOption[];
  /** Выбранные значения */
  selected: (string | number)[];
  /** Callback при изменении */
  onChange: (selected: (string | number)[]) => void;
  /** Показывать поиск при количестве опций больше этого значения */
  searchThreshold?: number;
  /** Максимальное количество видимых опций до "Показать ещё" */
  maxVisible?: number;
  /** Состояние загрузки */
  loading?: boolean;
}

/**
 * Универсальный компонент чекбокс-фильтра.
 *
 * Особенности:
 * - Поиск по опциям (при большом количестве)
 * - "Показать ещё" / "Свернуть"
 * - Отображение количества товаров
 * - Кнопка сброса при наличии выбранных
 */
export default function CheckboxFilter({
  title,
  options,
  selected,
  onChange,
  searchThreshold = 8,
  maxVisible = 5,
  loading = false,
}: CheckboxFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Фильтрация по поисковому запросу
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Опции для отображения (с учётом "Показать ещё")
  const visibleOptions = useMemo(() => {
    if (isExpanded || filteredOptions.length <= maxVisible) {
      return filteredOptions;
    }
    return filteredOptions.slice(0, maxVisible);
  }, [filteredOptions, isExpanded, maxVisible]);

  const hiddenCount = filteredOptions.length - maxVisible;
  const showSearch = options.length >= searchThreshold;
  const hasSelected = selected.length > 0;

  const handleToggle = (id: string | number) => {
    const isSelected = selected.includes(id);
    if (isSelected) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const handleClear = () => {
    onChange([]);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Заголовок и кнопка сброса */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {hasSelected && (
          <button
            onClick={handleClear}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Поиск */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск..."
            className={cn(
              'w-full pl-9 pr-3 py-2 border rounded-lg text-sm',
              'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none',
              'border-gray-300'
            )}
          />
        </div>
      )}

      {/* Опции */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {visibleOptions.map((option) => {
          const isChecked = selected.includes(option.id);

          return (
            <label
              key={option.id}
              className={cn(
                'flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                'hover:bg-gray-50',
                option.disabled && 'opacity-50 cursor-not-allowed',
                isChecked && 'bg-primary-50'
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={option.disabled}
                onChange={() => handleToggle(option.id)}
                className={cn(
                  'w-4 h-4 rounded border-gray-300',
                  'text-primary-600 focus:ring-primary-500'
                )}
              />
              <span className={cn(
                'flex-1 text-sm truncate',
                isChecked ? 'text-gray-900 font-medium' : 'text-gray-700'
              )}>
                {option.label}
              </span>
              {option.count !== undefined && (
                <span className="text-xs text-gray-400 tabular-nums">
                  {option.count}
                </span>
              )}
            </label>
          );
        })}

        {/* Сообщение "ничего не найдено" */}
        {filteredOptions.length === 0 && searchQuery && (
          <p className="text-sm text-gray-500 py-2 text-center">
            Ничего не найдено
          </p>
        )}
      </div>

      {/* Кнопка "Показать ещё" */}
      {hiddenCount > 0 && !searchQuery && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Свернуть
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Показать ещё {hiddenCount}
            </>
          )}
        </button>
      )}
    </div>
  );
}
