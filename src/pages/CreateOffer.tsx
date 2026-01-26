import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Package, Tag, DollarSign,
  Barcode, Box, ChevronDown, Check, Loader2, AlertCircle,
  HelpCircle, Leaf, Sun, Droplets, Thermometer
} from "lucide-react";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ImageUploader, UploadedImage } from "../components/ImageUploader";
import { catalogService, CategoryPublic } from '../api/catalogService';
import { searchService, SuggestItem } from '../api/searchService';
import { offerService } from '../api/offerService';
import { CreateOfferRequest, OfferCondition } from '../types/offer';

// Метки для состояния товара
const conditionLabels: Record<OfferCondition, string> = {
  'NEW': 'Новый',
  'WITH_DEFECTS': 'С дефектами'
};

// Категории для которых показываем параметры ухода за растениями
const PLANT_CATEGORY_SLUGS = ['plants', 'indoor-plants', 'outdoor-plants', 'succulents', 'cacti'];

// Опции для параметров растений
const lightingOptions = [
  { value: 'LOW', label: 'Тень' },
  { value: 'MEDIUM', label: 'Полутень' },
  { value: 'BRIGHT_INDIRECT', label: 'Яркий рассеянный' },
  { value: 'DIRECT', label: 'Прямой солнечный' }
];

const wateringOptions = [
  { value: 'RARE', label: 'Редкий (раз в 2 недели)' },
  { value: 'MODERATE', label: 'Умеренный (раз в неделю)' },
  { value: 'FREQUENT', label: 'Частый (2-3 раза в неделю)' }
];

const difficultyOptions = [
  { value: 'EASY', label: 'Легко' },
  { value: 'MEDIUM', label: 'Средне' },
  { value: 'HARD', label: 'Требует опыта' }
];

const CreateOffer = () => {
  const navigate = useNavigate();

  // Состояние загрузки
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Категории
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryPublic | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Поиск товаров
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SuggestItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SuggestItem | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [useCustomProduct, setUseCustomProduct] = useState(false); // "Другое"

  // Изображения
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Форма оффера
  const [formData, setFormData] = useState<{
    name: string; // Собственное название оффера
    description: string;
    price: string;
    sku: string;
    condition: OfferCondition;
    barcode: string;
    weightGrams: string;
    lengthMm: string;
    widthMm: string;
    heightMm: string;
    // Параметры растений
    lighting: string;
    watering: string;
    difficulty: string;
    petSafe: boolean;
    airPurifying: boolean;
  }>({
    name: '',
    description: '',
    price: '',
    sku: '',
    condition: 'NEW',
    barcode: '',
    weightGrams: '',
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    lighting: '',
    watering: '',
    difficulty: '',
    petSafe: false,
    airPurifying: false
  });

  // Ошибки валидации
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Проверка - является ли категория растительной
  const isPlantCategory = selectedCategory?.slug
    ? PLANT_CATEGORY_SLUGS.some(slug => selectedCategory.slug?.includes(slug))
    : false;

  // Загрузка категорий при монтировании
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await catalogService.getActiveCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
      setError('Не удалось загрузить категории');
    }
  };

  // Поиск товаров с дебаунсом
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProducts();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const searchProducts = async () => {
    setSearchLoading(true);
    try {
      const response = await searchService.suggestGrouped(searchQuery, 10);
      setSearchResults(response.plants);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Ошибка поиска:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectProduct = (product: SuggestItem) => {
    setSelectedProduct(product);
    setSearchQuery(product.text);
    setShowSearchResults(false);
    setUseCustomProduct(false);

    // Предзаполняем название из выбранного товара
    setFormData(prev => ({
      ...prev,
      name: product.text
    }));
  };

  const handleSelectOther = () => {
    setSelectedProduct(null);
    setUseCustomProduct(true);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleCategorySelect = (category: CategoryPublic) => {
    setSelectedCategory(category);
    setCategoryDropdownOpen(false);
    // Сбрасываем выбранный товар при смене категории
    setSelectedProduct(null);
    setUseCustomProduct(false);
    setSearchQuery('');
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedProduct && !useCustomProduct) {
      errors.product = 'Выберите товар из каталога или укажите "Другое"';
    }

    if (!formData.name.trim()) {
      errors.name = 'Укажите название товара';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Укажите корректную цену';
    }

    if (images.length === 0) {
      errors.images = 'Добавьте хотя бы одно фото';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Собираем ID загруженных изображений (только успешно загруженные)
      const imageIds = images
        .filter(img => !img.uploading && !img.error && !img.id.startsWith('temp-'))
        .map(img => img.id);

      const request: CreateOfferRequest = {
        taxonomyId: selectedProduct?.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        sku: '', // Генерируется автоматически на бэкенде
        condition: formData.condition,
        barcode: formData.barcode.trim() || undefined,
        imageIds: imageIds.length > 0 ? imageIds : undefined,
        shipping: {
          weightGrams: formData.weightGrams ? parseInt(formData.weightGrams) : undefined,
          lengthMm: formData.lengthMm ? parseInt(formData.lengthMm) : undefined,
          widthMm: formData.widthMm ? parseInt(formData.widthMm) : undefined,
          heightMm: formData.heightMm ? parseInt(formData.heightMm) : undefined,
        },
        // Параметры растений (только если выбрана растительная категория)
        ...(isPlantCategory && {
          careAttributes: {
            lighting: (formData.lighting || undefined) as 'LOW' | 'MEDIUM' | 'BRIGHT_INDIRECT' | 'DIRECT' | undefined,
            watering: (formData.watering || undefined) as 'RARE' | 'MODERATE' | 'FREQUENT' | undefined,
            difficulty: (formData.difficulty || undefined) as 'EASY' | 'MEDIUM' | 'HARD' | undefined,
            petSafe: formData.petSafe || undefined,
            airPurifying: formData.airPurifying || undefined
          }
        })
      };

      await offerService.createOffer(request);

      navigate('/seller/admin', { state: { message: 'Оффер успешно создан и отправлен на модерацию' } });
    } catch (err: any) {
      console.error('Ошибка создания оффера:', err);
      setError(err.response?.data?.message || 'Не удалось создать оффер. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  // Построение иерархии категорий
  const buildCategoryTree = (cats: CategoryPublic[], parentId: number | null = null, level = 0): { category: CategoryPublic; level: number }[] => {
    const result: { category: CategoryPublic; level: number }[] = [];

    cats
      .filter(c => (parentId === null ? !c.parentId : c.parentId === parentId))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach(cat => {
        result.push({ category: cat, level });
        result.push(...buildCategoryTree(cats, cat.id, level + 1));
      });

    return result;
  };

  const categoryTree = buildCategoryTree(categories);

  const canProceedToDetails = selectedProduct || useCustomProduct;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Шапка */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate('/seller/admin')}
            className="flex items-center gap-2 text-[#2D2E30]/70 hover:text-[#2B4A39] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад к товарам</span>
          </button>

          <h1 className="text-[#2B4A39] text-2xl md:text-3xl font-semibold">
            Выложить товар на продажу
          </h1>
          <p className="text-[#2D2E30]/70 mt-2">
            Найдите товар в каталоге и укажите свои условия продажи
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Ошибка</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Шаг 1: Выбор категории */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#2B4A39] text-white flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <h2 className="text-lg font-semibold text-[#2D2E30]">Выберите категорию</h2>
            </div>

            <div className="relative">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full flex items-center justify-between border border-[#2D2E30]/20 rounded-lg px-4 py-3 text-left hover:border-[#BCCEA9] transition-colors"
              >
                <span className={selectedCategory ? 'text-[#2D2E30]' : 'text-[#2D2E30]/50'}>
                  {selectedCategory?.name || 'Выберите категорию товара'}
                </span>
                <ChevronDown className={`w-5 h-5 text-[#2D2E30]/50 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[#2D2E30]/20 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {categoryTree.map(({ category, level }) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-[#BCCEA9]/20 transition-colors flex items-center gap-2 ${
                        selectedCategory?.id === category.id ? 'bg-[#BCCEA9]/30 text-[#2B4A39]' : 'text-[#2D2E30]'
                      }`}
                      style={{ paddingLeft: `${16 + level * 20}px` }}
                    >
                      {selectedCategory?.id === category.id && <Check className="w-4 h-4" />}
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Шаг 2: Поиск товара */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                selectedCategory ? 'bg-[#2B4A39] text-white' : 'bg-[#2D2E30]/20 text-[#2D2E30]/50'
              }`}>
                2
              </div>
              <h2 className={`text-lg font-semibold ${selectedCategory ? 'text-[#2D2E30]' : 'text-[#2D2E30]/50'}`}>
                Найдите товар в каталоге
              </h2>
            </div>

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2E30]/50" />
                <Input
                  type="text"
                  placeholder={selectedCategory ? 'Введите название растения или сорт...' : 'Сначала выберите категорию'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  disabled={!selectedCategory || useCustomProduct}
                  className="pl-10 pr-10"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2B4A39] animate-spin" />
                )}
              </div>

              {/* Результаты поиска */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[#2D2E30]/20 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full px-4 py-3 text-left hover:bg-[#BCCEA9]/20 transition-colors flex items-start gap-3 border-b border-[#2D2E30]/10"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#BCCEA9]/30 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-[#2B4A39]/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#2D2E30] truncate">{product.text}</p>
                        {product.subtext && (
                          <p className="text-sm text-[#2D2E30]/60 italic truncate">{product.subtext}</p>
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Опция "Другое" */}
                  <button
                    onClick={handleSelectOther}
                    className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors flex items-start gap-3 bg-amber-50/50 border-t-2 border-amber-200"
                  >
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-800">Не нашли нужный товар?</p>
                      <p className="text-sm text-amber-700">
                        Выберите "Другое" и опишите товар вручную
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[#2D2E30]/20 rounded-lg shadow-lg p-4">
                  <p className="text-[#2D2E30]/70 text-center">Товары не найдены</p>
                  <button
                    onClick={handleSelectOther}
                    className="w-full mt-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                    <div className="text-left">
                      <p className="font-medium text-amber-800">Выбрать "Другое"</p>
                      <p className="text-sm text-amber-700">Опишите товар вручную</p>
                    </div>
                  </button>
                </div>
              )}

              {validationErrors.product && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.product}</p>
              )}
            </div>

            {/* Выбранный товар */}
            {selectedProduct && (
              <div className="mt-4 p-4 bg-[#BCCEA9]/20 rounded-lg border border-[#BCCEA9]/50">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-lg bg-[#BCCEA9]/50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-[#2B4A39]/50" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-[#2B4A39]" />
                      <span className="font-semibold text-[#2B4A39]">Товар выбран</span>
                    </div>
                    <p className="font-medium text-[#2D2E30] mt-1">{selectedProduct.text}</p>
                    {selectedProduct.subtext && (
                      <p className="text-sm text-[#2D2E30]/60 italic">{selectedProduct.subtext}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setSearchQuery('');
                    }}
                    className="text-[#2D2E30]/50 hover:text-red-600 transition-colors"
                  >
                    Изменить
                  </button>
                </div>
              </div>
            )}

            {/* Выбрано "Другое" */}
            {useCustomProduct && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">Товар не из каталога</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Вы указываете товар вручную. После модерации он может быть добавлен в каталог.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUseCustomProduct(false);
                      setSearchQuery('');
                    }}
                    className="text-amber-600 hover:text-amber-800 transition-colors text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Подсказка */}
            {selectedCategory && !selectedProduct && !useCustomProduct && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Начните вводить название и выберите подходящий вариант из каталога.
                  Если нужного товара нет — выберите "Другое".
                </p>
              </div>
            )}
          </div>

          {/* Шаг 3: Фотографии */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                canProceedToDetails ? 'bg-[#2B4A39] text-white' : 'bg-[#2D2E30]/20 text-[#2D2E30]/50'
              }`}>
                3
              </div>
              <h2 className={`text-lg font-semibold ${canProceedToDetails ? 'text-[#2D2E30]' : 'text-[#2D2E30]/50'}`}>
                Добавьте фотографии
              </h2>
            </div>

            <div className={!canProceedToDetails ? 'opacity-50 pointer-events-none' : ''}>
              <ImageUploader
                images={images}
                onChange={setImages}
                maxImages={10}
                disabled={!canProceedToDetails}
              />
              {validationErrors.images && (
                <p className="text-red-600 text-sm mt-2">{validationErrors.images}</p>
              )}
            </div>
          </div>

          {/* Шаг 4: Название и описание */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                canProceedToDetails ? 'bg-[#2B4A39] text-white' : 'bg-[#2D2E30]/20 text-[#2D2E30]/50'
              }`}>
                4
              </div>
              <h2 className={`text-lg font-semibold ${canProceedToDetails ? 'text-[#2D2E30]' : 'text-[#2D2E30]/50'}`}>
                Название и описание
              </h2>
            </div>

            <div className={`space-y-4 ${!canProceedToDetails && 'opacity-50 pointer-events-none'}`}>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-[#2B4A39]" />
                  Название товара <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Например: Монстера Делициоза, крупное растение 80см"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-[#2D2E30]/50 mt-1">
                  Это название увидят покупатели. Укажите важные характеристики.
                </p>
                {validationErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  Описание
                </Label>
                <Textarea
                  placeholder="Опишите ваш товар подробнее: особенности, размеры, состояние..."
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
              </div>
            </div>
          </div>

          {/* Шаг 5: Параметры растений (только для растительных категорий) */}
          {isPlantCategory && canProceedToDetails && (
            <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#2B4A39] text-white flex items-center justify-center text-sm font-semibold">
                  <Leaf className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-[#2D2E30]">Параметры ухода</h2>
              </div>

              <p className="text-[#2D2E30]/60 text-sm mb-4">
                Укажите условия содержания растения. Это поможет покупателям сделать выбор.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Освещение */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    Освещение
                  </Label>
                  <select
                    value={formData.lighting}
                    onChange={(e) => handleFormChange('lighting', e.target.value)}
                    className="w-full border border-[#2D2E30]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2B4A39]"
                  >
                    <option value="">Не указано</option>
                    {lightingOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Полив */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Полив
                  </Label>
                  <select
                    value={formData.watering}
                    onChange={(e) => handleFormChange('watering', e.target.value)}
                    className="w-full border border-[#2D2E30]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2B4A39]"
                  >
                    <option value="">Не указано</option>
                    {wateringOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Сложность */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-green-500" />
                    Сложность ухода
                  </Label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => handleFormChange('difficulty', e.target.value)}
                    className="w-full border border-[#2D2E30]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2B4A39]"
                  >
                    <option value="">Не указано</option>
                    {difficultyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Чекбоксы */}
              <div className="flex flex-wrap gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.petSafe}
                    onChange={(e) => handleFormChange('petSafe', e.target.checked)}
                    className="w-4 h-4 rounded border-[#2D2E30]/20 text-[#2B4A39] focus:ring-[#2B4A39]"
                  />
                  <span className="text-sm text-[#2D2E30]">Безопасно для питомцев</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.airPurifying}
                    onChange={(e) => handleFormChange('airPurifying', e.target.checked)}
                    className="w-4 h-4 rounded border-[#2D2E30]/20 text-[#2B4A39] focus:ring-[#2B4A39]"
                  />
                  <span className="text-sm text-[#2D2E30]">Очищает воздух</span>
                </label>
              </div>
            </div>
          )}

          {/* Шаг 6: Условия продажи */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                canProceedToDetails ? 'bg-[#2B4A39] text-white' : 'bg-[#2D2E30]/20 text-[#2D2E30]/50'
              }`}>
                {isPlantCategory ? '6' : '5'}
              </div>
              <h2 className={`text-lg font-semibold ${canProceedToDetails ? 'text-[#2D2E30]' : 'text-[#2D2E30]/50'}`}>
                Условия продажи
              </h2>
            </div>

            <div className={`space-y-5 ${!canProceedToDetails && 'opacity-50 pointer-events-none'}`}>
              {/* Цена и артикул */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-[#2B4A39]" />
                    Цена <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      min="0"
                      step="0.01"
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2E30]/50">₽</span>
                  </div>
                  {validationErrors.price && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.price}</p>
                  )}
                </div>

              </div>

              {/* Состояние */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-[#2B4A39]" />
                  Состояние товара
                </Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(conditionLabels) as OfferCondition[]).map((condition) => (
                    <button
                      key={condition}
                      onClick={() => handleFormChange('condition', condition)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        formData.condition === condition
                          ? 'border-[#2B4A39] bg-[#BCCEA9] text-[#2B4A39]'
                          : 'border-[#2D2E30]/20 hover:border-[#BCCEA9]'
                      }`}
                    >
                      {conditionLabels[condition]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Дополнительные поля */}
              <div className="border-t border-[#2D2E30]/10 pt-5">
                <p className="text-[#2D2E30]/70 text-sm mb-4">Дополнительная информация (необязательно)</p>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Barcode className="w-4 h-4 text-[#2B4A39]" />
                    Штрихкод
                  </Label>
                  <Input
                    type="text"
                    placeholder="EAN/UPC"
                    value={formData.barcode}
                    onChange={(e) => handleFormChange('barcode', e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </div>

              {/* Габариты */}
              <div className="border-t border-[#2D2E30]/10 pt-5">
                <Label className="flex items-center gap-2 mb-4">
                  <Box className="w-4 h-4 text-[#2B4A39]" />
                  Габариты для доставки
                </Label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-[#2D2E30]/70 mb-1">Вес (г)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.weightGrams}
                      onChange={(e) => handleFormChange('weightGrams', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#2D2E30]/70 mb-1">Длина (мм)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.lengthMm}
                      onChange={(e) => handleFormChange('lengthMm', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#2D2E30]/70 mb-1">Ширина (мм)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.widthMm}
                      onChange={(e) => handleFormChange('widthMm', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#2D2E30]/70 mb-1">Высота (мм)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.heightMm}
                      onChange={(e) => handleFormChange('heightMm', e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка отправки */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/seller/admin')}
              className="border-[#2D2E30]/20"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canProceedToDetails}
              className="bg-[#2B4A39] hover:bg-[#234135] text-white px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                'Выложить товар'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOffer;
