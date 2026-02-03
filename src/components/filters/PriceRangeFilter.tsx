import { useState, useEffect, useCallback } from 'react';
import { cn } from '../ui/utils';

interface PriceRangeFilterProps {
  /** Минимальная цена из фасетов (для подсказки) */
  facetMin?: number;
  /** Максимальная цена из фасетов (для подсказки) */
  facetMax?: number;
  /** Текущее значение минимальной цены */
  value?: { min?: number; max?: number };
  /** Callback при изменении диапазона */
  onChange: (range: { min?: number; max?: number }) => void;
  /** Валюта для отображения */
  currency?: string;
  /** Задержка debounce в мс */
  debounceMs?: number;
}

/**
 * Фильтр по диапазону цен с двумя полями ввода.
 *
 * Особенности:
 * - Debounce для оптимизации запросов
 * - Отображение мин/макс из фасетов как placeholder
 * - Валидация (min <= max)
 * - Форматирование чисел
 */
export default function PriceRangeFilter({
  facetMin,
  facetMax,
  value = {},
  onChange,
  currency = '₽',
  debounceMs = 500,
}: PriceRangeFilterProps) {
  // Локальное состояние для немедленного отображения
  const [localMin, setLocalMin] = useState<string>(value.min?.toString() || '');
  const [localMax, setLocalMax] = useState<string>(value.max?.toString() || '');
  const [error, setError] = useState<string | null>(null);

  // Синхронизация с внешним значением
  useEffect(() => {
    setLocalMin(value.min?.toString() || '');
    setLocalMax(value.max?.toString() || '');
  }, [value.min, value.max]);

  // Debounced callback
  const debouncedOnChange = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (min: string, max: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const minNum = min ? parseFloat(min) : undefined;
          const maxNum = max ? parseFloat(max) : undefined;

          // Валидация
          if (minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
            setError('Минимальная цена не может быть больше максимальной');
            return;
          }

          setError(null);
          onChange({ min: minNum, max: maxNum });
        }, debounceMs);
      };
    })(),
    [onChange, debounceMs]
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '');
    setLocalMin(val);
    debouncedOnChange(val, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '');
    setLocalMax(val);
    debouncedOnChange(localMin, val);
  };

  const handleClear = () => {
    setLocalMin('');
    setLocalMax('');
    setError(null);
    onChange({});
  };

  const formatPlaceholder = (val?: number): string => {
    if (val === undefined || val === null) return '';
    return val.toLocaleString('ru-RU');
  };

  const hasValue = localMin || localMax;

  return (
    <div className="space-y-3">
      {hasValue && (
        <div className="flex justify-end">
          <button
            onClick={handleClear}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
          >
            Сбросить
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Минимальная цена */}
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={localMin}
            onChange={handleMinChange}
            placeholder={formatPlaceholder(facetMin) || 'от'}
            className={cn(
              'w-full px-3 py-2 border rounded-lg text-sm',
              'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none',
              'transition-colors',
              error ? 'border-red-300' : 'border-gray-300'
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            {currency}
          </span>
        </div>

        <span className="text-gray-400">—</span>

        {/* Максимальная цена */}
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={localMax}
            onChange={handleMaxChange}
            placeholder={formatPlaceholder(facetMax) || 'до'}
            className={cn(
              'w-full px-3 py-2 border rounded-lg text-sm',
              'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none',
              'transition-colors',
              error ? 'border-red-300' : 'border-gray-300'
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            {currency}
          </span>
        </div>
      </div>

      {/* Ошибка валидации */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Подсказка с диапазоном из фасетов */}
      {(facetMin !== undefined || facetMax !== undefined) && !error && (
        <p className="text-xs text-gray-500">
          Диапазон цен: {formatPlaceholder(facetMin) || '0'} — {formatPlaceholder(facetMax) || '∞'} {currency}
        </p>
      )}
    </div>
  );
}
