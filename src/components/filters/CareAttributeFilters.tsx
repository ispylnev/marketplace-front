import { useState } from 'react';
import { ChevronDown, ChevronUp, Sun, Droplets, Wind, Leaf, Heart, AlertTriangle, TrendingUp } from 'lucide-react';
import { StringFacetBucket, CareAttributeBucket } from '../../api/searchService';
import { cn } from '../ui/utils';

interface CareFiltersState {
  lightRequirements: string[];
  wateringFrequencies: string[];
  humidityLevels: string[];
  careDifficulties: string[];
  soilTypes: string[];
  toxicities: string[];
  growthRates: string[];
  petSafe: boolean;
  beginnerFriendly: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
}

// Словари-fallback для перевода кодов (если бекенд не вернул name)
const FALLBACK_NAMES: Record<string, Record<string, string>> = {
  lightRequirements: {
    FULL_SUN: 'Прямое солнце',
    BRIGHT_INDIRECT: 'Яркий рассеянный',
    PARTIAL_SHADE: 'Полутень',
    SHADE: 'Тень',
    LOW_LIGHT: 'Слабое освещение',
  },
  wateringFrequencies: {
    VERY_LOW: 'Очень редкий',
    LOW: 'Редкий',
    MODERATE: 'Умеренный',
    HIGH: 'Частый',
    VERY_HIGH: 'Очень частый',
    AQUATIC: 'Водное растение',
  },
  humidityLevels: {
    LOW: 'Низкая',
    MEDIUM: 'Средняя',
    HIGH: 'Высокая',
    VERY_HIGH: 'Очень высокая',
  },
  careDifficulties: {
    BEGINNER: 'Для новичков',
    EASY: 'Лёгкий',
    MODERATE: 'Средний',
    ADVANCED: 'Для опытных',
    EXPERT: 'Для экспертов',
  },
  toxicities: {
    NON_TOXIC: 'Безопасное',
    MILDLY_TOXIC: 'Слабо токсичное',
    TOXIC_TO_PETS: 'Токсично для животных',
    TOXIC_TO_HUMANS: 'Токсично для людей',
    HIGHLY_TOXIC: 'Сильно токсичное',
  },
  soilTypes: {
    UNIVERSAL: 'Универсальный грунт',
    ACIDIC: 'Кислый грунт',
    ALKALINE: 'Щелочной грунт',
    SANDY: 'Песчаный',
    LOAMY: 'Суглинок',
    PEAT: 'Торфяной',
    SUCCULENT_MIX: 'Для суккулентов',
    ORCHID_MIX: 'Для орхидей',
    AQUATIC: 'Водный субстрат',
  },
  growthRates: {
    VERY_SLOW: 'Очень медленный',
    SLOW: 'Медленный',
    MODERATE: 'Умеренный',
    FAST: 'Быстрый',
    VERY_FAST: 'Очень быстрый',
  },
};

// Тип: StringFacetBucket (из OfferFacets) или CareAttributeBucket (legacy)
type FacetBucket = StringFacetBucket | CareAttributeBucket;

// Получить код из бакета (совместимость со старым и новым форматом)
const getBucketCode = (bucket: FacetBucket): string => {
  return 'key' in bucket ? bucket.key : bucket.code;
};

// Получить название из бакета (приоритет: name с бекенда > fallback словарь > код)
const getBucketName = (bucket: FacetBucket, fallbackCategory?: string): string => {
  // Если бекенд вернул name - используем его
  if ('name' in bucket && bucket.name) {
    return bucket.name;
  }
  const code = getBucketCode(bucket);
  // Иначе ищем в fallback словаре
  if (fallbackCategory && FALLBACK_NAMES[fallbackCategory]) {
    return FALLBACK_NAMES[fallbackCategory][code] || code;
  }
  return code;
};

interface CareAttributeFiltersProps {
  /** Фасеты по атрибутам ухода (StringFacetBucket или CareAttributeBucket) */
  lightRequirements?: FacetBucket[];
  wateringFrequencies?: FacetBucket[];
  humidityLevels?: FacetBucket[];
  careDifficulties?: FacetBucket[];
  soilTypes?: FacetBucket[];
  toxicities?: FacetBucket[];
  growthRates?: FacetBucket[];
  petSafeCount?: number;
  beginnerFriendlyCount?: number;
  totalCount?: number;

  /** Текущие значения фильтров */
  value: CareFiltersState;
  /** Callback при изменении */
  onChange: (value: CareFiltersState) => void;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function FilterSection({ title, icon, children, defaultExpanded = false }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-3 text-left hover:bg-gray-50 transition-colors -mx-2 px-2 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{icon}</span>
          <span className="font-medium text-gray-900 text-sm">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="pb-3 animate-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Группа фильтров по атрибутам ухода за растениями.
 *
 * Включает:
 * - Освещение
 * - Полив
 * - Влажность
 * - Сложность ухода
 * - Тип почвы
 * - Токсичность
 * - Скорость роста
 * - Безопасно для питомцев
 * - Для новичков
 */
export default function CareAttributeFilters({
  lightRequirements = [],
  wateringFrequencies = [],
  humidityLevels = [],
  careDifficulties = [],
  soilTypes = [],
  toxicities = [],
  growthRates = [],
  petSafeCount,
  beginnerFriendlyCount,
  value,
  onChange,
}: CareAttributeFiltersProps) {
  const updateFilter = <K extends keyof CareFiltersState>(
    key: K,
    newValue: CareFiltersState[K]
  ) => {
    onChange({ ...value, [key]: newValue });
  };

  const toggleArrayValue = (key: keyof CareFiltersState, code: string) => {
    const current = value[key] as string[];
    const newValue = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code];
    updateFilter(key, newValue as CareFiltersState[typeof key]);
  };

  const renderCheckboxOptions = (
    options: FacetBucket[],
    selectedValues: string[],
    filterKey: keyof CareFiltersState,
    fallbackCategory?: string
  ) => {
    if (options.length === 0) return null;

    return (
      <div className="space-y-1 mt-2">
        {options.map((option) => {
          const code = getBucketCode(option);
          const name = getBucketName(option, fallbackCategory);
          const isChecked = selectedValues.includes(code);
          return (
            <label
              key={code}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
                'hover:bg-gray-50',
                isChecked && 'bg-primary-50'
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleArrayValue(filterKey, code)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className={cn(
                'flex-1 text-sm truncate',
                isChecked ? 'text-gray-900 font-medium' : 'text-gray-700'
              )}>
                {name}
              </span>
              <span className="text-xs text-gray-400 tabular-nums">
                {option.count}
              </span>
            </label>
          );
        })}
      </div>
    );
  };

  const hasAnyFilters = lightRequirements.length > 0 ||
    wateringFrequencies.length > 0 ||
    humidityLevels.length > 0 ||
    careDifficulties.length > 0 ||
    soilTypes.length > 0 ||
    toxicities.length > 0 ||
    growthRates.length > 0 ||
    petSafeCount !== undefined ||
    beginnerFriendlyCount !== undefined;

  if (!hasAnyFilters) {
    return null;
  }

  return (
    <div className="space-y-1">
      {/* Быстрые фильтры */}
      <div className="flex flex-wrap gap-2 mb-3">
        {beginnerFriendlyCount !== undefined && beginnerFriendlyCount > 0 && (
          <button
            onClick={() => updateFilter('beginnerFriendly', !value.beginnerFriendly)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              value.beginnerFriendly
                ? 'bg-green-100 text-green-800 ring-2 ring-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            Для новичков
            <span className="opacity-60">({beginnerFriendlyCount})</span>
          </button>
        )}

        {petSafeCount !== undefined && petSafeCount > 0 && (
          <button
            onClick={() => updateFilter('petSafe', !value.petSafe)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              value.petSafe
                ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Leaf className="w-3.5 h-3.5" />
            Безопасно для питомцев
            <span className="opacity-60">({petSafeCount})</span>
          </button>
        )}
      </div>

      {/* Освещение */}
      {lightRequirements.length > 0 && (
        <FilterSection
          title="Освещение"
          icon={<Sun className="w-4 h-4" />}
          defaultExpanded={value.lightRequirements.length > 0}
        >
          {renderCheckboxOptions(lightRequirements, value.lightRequirements, 'lightRequirements', 'lightRequirements')}
        </FilterSection>
      )}

      {/* Полив */}
      {wateringFrequencies.length > 0 && (
        <FilterSection
          title="Полив"
          icon={<Droplets className="w-4 h-4" />}
          defaultExpanded={value.wateringFrequencies.length > 0}
        >
          {renderCheckboxOptions(wateringFrequencies, value.wateringFrequencies, 'wateringFrequencies', 'wateringFrequencies')}
        </FilterSection>
      )}

      {/* Влажность */}
      {humidityLevels.length > 0 && (
        <FilterSection
          title="Влажность"
          icon={<Wind className="w-4 h-4" />}
          defaultExpanded={value.humidityLevels.length > 0}
        >
          {renderCheckboxOptions(humidityLevels, value.humidityLevels, 'humidityLevels', 'humidityLevels')}
        </FilterSection>
      )}

      {/* Сложность ухода */}
      {careDifficulties.length > 0 && (
        <FilterSection
          title="Сложность ухода"
          icon={<Heart className="w-4 h-4" />}
          defaultExpanded={value.careDifficulties.length > 0}
        >
          {renderCheckboxOptions(careDifficulties, value.careDifficulties, 'careDifficulties', 'careDifficulties')}
        </FilterSection>
      )}

      {/* Токсичность */}
      {toxicities.length > 0 && (
        <FilterSection
          title="Токсичность"
          icon={<AlertTriangle className="w-4 h-4" />}
          defaultExpanded={value.toxicities.length > 0}
        >
          {renderCheckboxOptions(toxicities, value.toxicities, 'toxicities', 'toxicities')}
        </FilterSection>
      )}

      {/* Скорость роста */}
      {growthRates.length > 0 && (
        <FilterSection
          title="Скорость роста"
          icon={<TrendingUp className="w-4 h-4" />}
          defaultExpanded={value.growthRates.length > 0}
        >
          {renderCheckboxOptions(growthRates, value.growthRates, 'growthRates', 'growthRates')}
        </FilterSection>
      )}

      {/* Тип почвы */}
      {soilTypes.length > 0 && (
        <FilterSection
          title="Тип почвы"
          icon={<Leaf className="w-4 h-4" />}
          defaultExpanded={value.soilTypes.length > 0}
        >
          {renderCheckboxOptions(soilTypes, value.soilTypes, 'soilTypes', 'soilTypes')}
        </FilterSection>
      )}
    </div>
  );
}

// Экспорт типа для использования в Catalog.tsx
export type { CareFiltersState };
