import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { FilterSidebar, ActiveFilters, ActiveFilter, SortOption, CareFiltersState } from '../components/filters';
import { Filter, Grid, List, Loader2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { catalogService, CategoryPublic } from '../api/catalogService';
import { searchService, OfferSearchParams, OfferSearchResponse, OfferFacets } from '../api/searchService';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL параметры
  const categorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '0', 10);

  // UI состояния
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Categories
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryPublic | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Products from search
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Facets
  const [facets, setFacets] = useState<OfferFacets | undefined>();

  // Pagination
  const [totalHits, setTotalHits] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);

  // Care filters
  const [careFilters, setCareFilters] = useState<CareFiltersState>({
    lightRequirements: [],
    wateringFrequencies: [],
    humidityLevels: [],
    careDifficulties: [],
    soilTypes: [],
    toxicities: [],
    growthRates: [],
    petSafe: false,
    beginnerFriendly: false,
  });

  // Маппинг id -> name для брендов (можно расширить, загружая с бекенда)
  const [brandNames] = useState<Map<number, string>>(new Map());

  const PAGE_SIZE = 20;

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Set selected category from URL
  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const found = categories.find(c => c.slug === categorySlug);
      setSelectedCategory(found || null);
    } else {
      setSelectedCategory(null);
    }
  }, [categorySlug, categories]);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery, currentPage, sortBy, inStockOnly, priceRange, selectedBrandIds, careFilters]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await catalogService.getActiveCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      setSearchError(null);

      // Используем Offer-centric API - показываем реальные товары с ценами
      const params: OfferSearchParams = {
        page: currentPage,
        size: PAGE_SIZE,
        sortBy: sortBy as OfferSearchParams['sortBy'],
        includeFacets: true,
      };

      if (searchQuery) params.q = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory.id;
      if (inStockOnly) params.inStock = true;
      if (priceRange.min !== undefined) params.minPrice = priceRange.min;
      if (priceRange.max !== undefined) params.maxPrice = priceRange.max;

      // Care filters (из Offer override или Taxonomy default)
      if (careFilters.lightRequirements.length > 0) params.lightRequirements = careFilters.lightRequirements;
      if (careFilters.wateringFrequencies.length > 0) params.wateringFrequencies = careFilters.wateringFrequencies;
      if (careFilters.humidityLevels.length > 0) params.humidityLevels = careFilters.humidityLevels;
      if (careFilters.careDifficulties.length > 0) params.careDifficulties = careFilters.careDifficulties;
      if (careFilters.petSafe) params.petSafe = true;
      if (careFilters.beginnerFriendly) params.beginnerFriendly = true;

      const response: OfferSearchResponse = await searchService.searchOffers(params);

      // Convert OfferHit to Product format for display
      const convertedProducts: Product[] = response.hits.map(hit => ({
        id: String(hit.offerId),
        name: hit.title,
        price: hit.price ? formatPrice(hit.price) : 'Цена не указана',
        image: hit.mainImageUrl || hit.mainImageThumbnailUrl || 'https://via.placeholder.com/300',
        rating: hit.sellerRating || 0,
        reviews: 0,
        category: hit.categoryName,
        description: hit.description,
        seller: hit.sellerName ? {
          name: hit.sellerName,
          rating: hit.sellerRating || 0,
        } : undefined,
      }));

      setProducts(convertedProducts);
      setFacets(response.facets);
      setTotalHits(response.totalHits);
      setTotalPages(response.totalPages);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);

    } catch (err: any) {
      console.error('Failed to load offers:', err);
      setSearchError(err.response?.data?.message || 'Не удалось загрузить товары');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentPage, searchQuery, selectedCategory, sortBy, inStockOnly, priceRange, careFilters]);

  const formatPrice = (price?: number): string => {
    if (price === undefined || price === null) return '0';
    return price.toLocaleString('ru-RU');
  };

  // URL updates
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  };

  const goToPage = (page: number) => {
    updateUrlParams({ page: String(page) });
  };

  const handleCategorySelect = (category: CategoryPublic | null) => {
    if (category) {
      updateUrlParams({ category: category.slug, page: null });
    } else {
      updateUrlParams({ category: null, page: null });
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    updateUrlParams({ page: null });
  };

  const handlePriceChange = (range: { min?: number; max?: number }) => {
    setPriceRange(range);
    updateUrlParams({ page: null });
  };

  const handleBrandChange = (brandIds: number[]) => {
    setSelectedBrandIds(brandIds);
    updateUrlParams({ page: null });
  };

  const handleInStockChange = (value: boolean) => {
    setInStockOnly(value);
    updateUrlParams({ page: null });
  };

  // Формирование списка активных фильтров
  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const filters: ActiveFilter[] = [];

    if (selectedCategory) {
      filters.push({
        key: 'category',
        label: 'Категория',
        value: selectedCategory.name,
        type: 'category',
      });
    }

    if (selectedBrandIds.length > 0) {
      const brandLabels = selectedBrandIds
        .map(id => brandNames.get(id) || `#${id}`)
        .join(', ');
      filters.push({
        key: 'brands',
        label: 'Бренды',
        value: brandLabels,
        type: 'brand',
      });
    }

    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      const priceLabel = priceRange.min !== undefined && priceRange.max !== undefined
        ? `${priceRange.min.toLocaleString('ru-RU')} — ${priceRange.max.toLocaleString('ru-RU')} ₽`
        : priceRange.min !== undefined
          ? `от ${priceRange.min.toLocaleString('ru-RU')} ₽`
          : `до ${priceRange.max!.toLocaleString('ru-RU')} ₽`;
      filters.push({
        key: 'price',
        label: 'Цена',
        value: priceLabel,
        type: 'price',
      });
    }

    if (inStockOnly) {
      filters.push({
        key: 'inStock',
        label: 'Наличие',
        value: 'В наличии',
        type: 'other',
      });
    }

    return filters;
  }, [selectedCategory, selectedBrandIds, priceRange, inStockOnly, brandNames]);

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'category':
        handleCategorySelect(null);
        break;
      case 'brands':
        setSelectedBrandIds([]);
        break;
      case 'price':
        setPriceRange({});
        break;
      case 'inStock':
        setInStockOnly(false);
        break;
    }
  };

  const handleClearAllFilters = () => {
    handleCategorySelect(null);
    setSelectedBrandIds([]);
    setPriceRange({});
    setInStockOnly(false);
    setSortBy('relevance');
  };

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push('...');

      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages - 1);
    }

    return (
      <div className="mt-12 flex justify-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={!hasPrevious}
            className={`px-4 py-2.5 flex items-center gap-1 rounded-xl font-medium transition-all ${
              hasPrevious
                ? 'bg-white border-2 border-gray-200 hover:border-primary-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>

          {pages.map((page, idx) => (
            typeof page === 'number' ? (
              <button
                key={idx}
                onClick={() => goToPage(page)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                }`}
              >
                {page + 1}
              </button>
            ) : (
              <span key={idx} className="px-2 text-gray-400">...</span>
            )
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={!hasNext}
            className={`px-4 py-2.5 flex items-center gap-1 rounded-xl font-medium transition-all ${
              hasNext
                ? 'bg-white border-2 border-gray-200 hover:border-primary-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Вперед <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {selectedCategory ? selectedCategory.name : 'Каталог растений'}
          </h1>
          <p className="text-primary-100 mb-6">
            {selectedCategory?.description || 'Найдите идеальное растение для вашего дома'}
          </p>
          <SearchBar placeholder="Поиск по каталогу..." />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary-600">Главная</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/catalog" className={`${selectedCategory ? 'hover:text-primary-600' : 'text-gray-900 font-medium'}`}>
              Каталог
            </Link>
            {selectedCategory && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{selectedCategory.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-6">
            <ActiveFilters
              filters={activeFilters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <FilterSidebar
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            categories={categories}
            selectedCategoryId={selectedCategory?.id || null}
            onCategorySelect={handleCategorySelect}
            loadingCategories={loadingCategories}
            facets={facets}
            totalHits={totalHits}
            brandNames={brandNames}
            selectedBrandIds={selectedBrandIds}
            onBrandChange={handleBrandChange}
            priceRange={priceRange}
            onPriceChange={handlePriceChange}
            inStockOnly={inStockOnly}
            onInStockChange={handleInStockChange}
            careFilters={careFilters}
            onCareFiltersChange={setCareFilters}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            hasSearchQuery={Boolean(searchQuery)}
          />

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 flex items-center justify-between border border-gray-100">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden flex items-center space-x-2 px-4 py-2.5 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 font-medium transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  <span>Фильтры</span>
                  {activeFilters.length > 0 && (
                    <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {activeFilters.length}
                    </span>
                  )}
                </button>
                <span className="text-gray-700 font-medium">
                  {loadingProducts ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Загрузка...
                    </span>
                  ) : (
                    <>
                      Найдено: <span className="text-primary-600 font-bold">{totalHits}</span> товаров
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 hidden md:block">Вид:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Error state */}
            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">Ошибка загрузки</h3>
                  <p className="text-red-600 text-sm mt-1">{searchError}</p>
                  <button
                    onClick={loadProducts}
                    className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Попробовать снова
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loadingProducts && !searchError && (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                  <p className="text-gray-500">Загрузка товаров...</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loadingProducts && !searchError && products.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Товары не найдены</h3>
                <p className="text-gray-500 mb-6">
                  Попробуйте изменить параметры поиска или выбрать другую категорию
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loadingProducts && !searchError && products.length > 0 && (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
