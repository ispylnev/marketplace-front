import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryPublic } from '../../api/catalogService';
import { OfferFacets } from '../../api/searchService';
import CategoryTree from './CategoryTree';
import PriceRangeFilter from './PriceRangeFilter';
import InStockFilter from './InStockFilter';
import SortSelect, { SortOption } from './SortSelect';
import CareAttributeFilters, { CareFiltersState } from './CareAttributeFilters';
import { cn } from '../ui/utils';

interface FilterSidebarProps {
  /** Открыта ли боковая панель (для мобильных) */
  isOpen: boolean;
  /** Callback закрытия панели */
  onClose: () => void;

  // Категории
  categories: CategoryPublic[];
  selectedCategoryId: number | null;
  onCategorySelect: (category: CategoryPublic | null) => void;
  loadingCategories?: boolean;

  // Фасеты из поиска (Offer-centric OfferFacets)
  facets?: OfferFacets;
  totalHits?: number;

  // Бренды (опционально, PlantFacets не имеет брендов)
  /** Маппинг id -> name для брендов */
  brandNames?: Map<number, string>;
  selectedBrandIds?: number[];
  onBrandChange?: (brandIds: number[]) => void;

  // Цена
  priceRange: { min?: number; max?: number };
  onPriceChange: (range: { min?: number; max?: number }) => void;

  // В наличии
  inStockOnly: boolean;
  onInStockChange: (value: boolean) => void;

  // Care attributes
  careFilters: CareFiltersState;
  onCareFiltersChange: (filters: CareFiltersState) => void;

  // Сортировка
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  hasSearchQuery?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-b-0 pb-4 mb-4 last:pb-0 last:mb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Боковая панель с фильтрами каталога.
 *
 * Улучшенный UX:
 * - Шире для лучшей читаемости (320px на десктопе)
 * - Сворачиваемые секции
 * - Группировка фильтров ухода
 * - Мобильная версия с overlay
 */
export default function FilterSidebar({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  onCategorySelect,
  loadingCategories = false,
  facets,
  totalHits,
  priceRange,
  onPriceChange,
  inStockOnly,
  onInStockChange,
  careFilters,
  onCareFiltersChange,
  sortBy,
  onSortChange,
  hasSearchQuery = false,
}: FilterSidebarProps) {
  // OfferFacets содержит care attributes в careFacets (из Offer override или Taxonomy default)
  const careFacets = facets?.careFacets;
  const hasCareFilters = careFacets && (
    (careFacets.lightRequirements && careFacets.lightRequirements.length > 0) ||
    (careFacets.wateringFrequencies && careFacets.wateringFrequencies.length > 0) ||
    (careFacets.careDifficulties && careFacets.careDifficulties.length > 0) ||
    careFacets.petSafeCount !== undefined ||
    careFacets.beginnerFriendlyCount !== undefined
  );

  return (
    <>
      {/* Overlay для мобильных */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Мобильная версия: фиксированная боковая панель
          'fixed inset-y-0 left-0 z-50 w-[340px] bg-white shadow-xl transform transition-transform duration-300',
          // Состояние открытия/закрытия на мобильных
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Десктопная версия: статичная панель (360px для лучшей читаемости)
          'md:relative md:inset-auto md:shadow-none md:transform-none md:translate-x-0',
          'md:block md:w-[360px] flex-shrink-0'
        )}
      >
        <div className="h-full overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-sm p-5 md:sticky md:top-24 border border-gray-100">
            {/* Заголовок с кнопкой закрытия (мобильные) */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Фильтры</h2>
              <button
                onClick={onClose}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Закрыть фильтры"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {/* Сортировка — всегда первым */}
              <CollapsibleSection title="Сортировка" defaultOpen={true}>
                <SortSelect
                  value={sortBy}
                  onChange={onSortChange}
                  showRelevance={hasSearchQuery}
                />
              </CollapsibleSection>

              {/* Категории */}
              <CollapsibleSection title="Категории" defaultOpen={true}>
                <div className="max-h-64 overflow-y-auto -mx-1 px-1">
                  <CategoryTree
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onCategorySelect={onCategorySelect}
                    loading={loadingCategories}
                  />
                </div>
              </CollapsibleSection>

              {/* Цена */}
              <CollapsibleSection title="Цена" defaultOpen={true}>
                <PriceRangeFilter
                  facetMin={facets?.priceRange?.min}
                  facetMax={facets?.priceRange?.max}
                  value={priceRange}
                  onChange={onPriceChange}
                />
              </CollapsibleSection>

              {/* В наличии */}
              <CollapsibleSection title="Наличие" defaultOpen={true}>
                <InStockFilter
                  value={inStockOnly}
                  onChange={onInStockChange}
                  inStockCount={facets?.inStockCount}
                  totalCount={totalHits}
                />
              </CollapsibleSection>

              {/* Атрибуты ухода */}
              {hasCareFilters && (
                <CollapsibleSection title="Уход за растением" defaultOpen={false}>
                  <CareAttributeFilters
                    lightRequirements={careFacets?.lightRequirements}
                    wateringFrequencies={careFacets?.wateringFrequencies}
                    humidityLevels={careFacets?.humidityLevels}
                    careDifficulties={careFacets?.careDifficulties}
                    petSafeCount={careFacets?.petSafeCount}
                    beginnerFriendlyCount={careFacets?.beginnerFriendlyCount}
                    totalCount={totalHits}
                    value={careFilters}
                    onChange={onCareFiltersChange}
                  />
                </CollapsibleSection>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
