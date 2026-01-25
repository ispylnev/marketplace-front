import { cn } from '../ui/utils';

interface InStockFilterProps {
  /** Текущее значение */
  value: boolean;
  /** Callback при изменении */
  onChange: (value: boolean) => void;
  /** Количество товаров в наличии (из фасетов) */
  inStockCount?: number;
  /** Общее количество товаров */
  totalCount?: number;
}

/**
 * Фильтр "Только в наличии".
 *
 * Показывает переключатель с количеством товаров в наличии.
 */
export default function InStockFilter({
  value,
  onChange,
  inStockCount,
  totalCount,
}: InStockFilterProps) {
  return (
    <div className="space-y-3">
      <label
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all',
          'border',
          value
            ? 'bg-primary-50 border-primary-200'
            : 'bg-white border-gray-200 hover:border-gray-300'
        )}
      >
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            'w-4 h-4 rounded border-gray-300',
            'text-primary-600 focus:ring-primary-500'
          )}
        />
        <span className={cn(
          'flex-1 text-sm',
          value ? 'text-gray-900 font-medium' : 'text-gray-700'
        )}>
          Только в наличии
        </span>
        {inStockCount !== undefined && (
          <span className="text-xs text-gray-400 tabular-nums">
            {inStockCount}
            {totalCount !== undefined && ` из ${totalCount}`}
          </span>
        )}
      </label>

      {/* Индикатор доступности */}
      {inStockCount !== undefined && totalCount !== undefined && totalCount > 0 && (
        <div className="px-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${(inStockCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round((inStockCount / totalCount) * 100)}% товаров в наличии
          </p>
        </div>
      )}
    </div>
  );
}
