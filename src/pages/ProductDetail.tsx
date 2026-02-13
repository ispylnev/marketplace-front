import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Heart, ShoppingCart, Truck, Shield, Loader2, X, ChevronLeft, ChevronRight, ZoomIn, Sun, Droplets, Wind, Thermometer, Leaf, AlertTriangle, Package, Check, Store, Star, ChevronRight as ChevronRightSmall, Minus, Plus, AlertCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { extractId } from '../utils/slugUtils';
import { offerService } from '../api/offerService';
import { sellerService } from '../api/sellerService';
import { cartService } from '../api/cartService';
import { inventoryService } from '../api/inventoryService';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { OfferResponse, OfferImageResponse } from '../types/offer';
import { SellerResponse } from '../types/seller';
import ReviewList from '../components/reviews/ReviewList';

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const ProductDetail = () => {
  const { slugWithId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = extractId(slugWithId);
  const { isAuthenticated } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'care' | 'specs'>('care');
  const reviewsRef = useRef<HTMLDivElement>(null);

  // Состояние для данных оффера
  const [offer, setOffer] = useState<OfferResponse | null>(null);
  const [images, setImages] = useState<OfferImageResponse[]>([]);
  const [seller, setSeller] = useState<SellerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние наличия
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);
  const [isInStock, setIsInStock] = useState<boolean | null>(null);

  // Состояние корзины
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // Auto-scroll к отзывам при #reviews в URL
  useEffect(() => {
    if (!loading && location.hash === '#reviews' && reviewsRef.current) {
      setTimeout(() => {
        reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [loading, location.hash]);

  // Сбрасываем состояние "добавлено" через 2 секунды
  useEffect(() => {
    if (isAdded) {
      const timer = setTimeout(() => setIsAdded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAdded]);

  // Сбрасываем ошибку корзины через 4 секунды
  useEffect(() => {
    if (cartError) {
      const timer = setTimeout(() => setCartError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [cartError]);

  // Обработчики количества
  const maxQuantity = availableQuantity !== null ? Math.min(availableQuantity, 99) : 99;
  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, maxQuantity));
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  // Добавить в корзину
  const handleAddToCart = async () => {
    if (!offer || isAddingToCart || isAdded) return;

    setCartError(null);
    setIsAddingToCart(true);
    try {
      await cartService.addToCart(offer.id, quantity);
      setIsAdded(true);
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.code === 'INSUFFICIENT_STOCK') {
        const available = errorData.available || 0;
        setCartError(available === 0 ? 'Нет в наличии' : `Доступно только ${available} шт.`);
      } else if (errorData?.code === 'OFFER_NOT_AVAILABLE') {
        setCartError('Товар недоступен');
      } else if (errorData?.error) {
        setCartError(errorData.error);
      } else {
        setCartError('Не удалось добавить');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Купить сейчас
  const handleBuyNow = async () => {
    if (!offer || isAddingToCart) return;

    setCartError(null);
    setIsAddingToCart(true);
    try {
      await cartService.addToCart(offer.id, quantity);
      navigate('/cart');
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.code === 'INSUFFICIENT_STOCK') {
        const available = errorData.available || 0;
        setCartError(available === 0 ? 'Нет в наличии' : `Доступно только ${available} шт.`);
      } else if (errorData?.code === 'OFFER_NOT_AVAILABLE') {
        setCartError('Товар недоступен');
      } else if (errorData?.error) {
        setCartError(errorData.error);
      } else {
        setCartError('Не удалось добавить');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadOfferData = async () => {
      if (!id) {
        setError('ID оффера не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [offerData, imagesData, availability] = await Promise.all([
          offerService.getOffer(id),
          offerService.getOfferImages(id).catch(() => [] as OfferImageResponse[]),
          inventoryService.checkAvailability(id).catch(() => null),
        ]);

        setOffer(offerData);
        setImages(imagesData);

        if (availability) {
          setIsInStock(availability.available);
          setAvailableQuantity(availability.availableQuantity);
        }

        // Загружаем данные продавца
        if (offerData.sellerId) {
          try {
            const sellerData = await sellerService.getSeller(offerData.sellerId);
            setSeller(sellerData);
          } catch (sellerErr) {
            console.warn('Не удалось загрузить данные продавца:', sellerErr);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки оффера:', err);
        setError('Не удалось загрузить данные товара');
      } finally {
        setLoading(false);
      }
    };

    loadOfferData();
  }, [id]);

  // Формируем массив URL изображений
  const imageUrls = images.length > 0
    ? images.map(img => img.url)
    : offer?.mainImageUrl
      ? [offer.mainImageUrl]
      : ['https://via.placeholder.com/600x600?text=Фото+скоро'];

  // Навигация по изображениям
  const goToPrevImage = useCallback(() => {
    setSelectedImage(prev => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  }, [imageUrls.length]);

  const goToNextImage = useCallback(() => {
    setSelectedImage(prev => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  }, [imageUrls.length]);

  // Обработка клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') setIsModalOpen(false);
      else if (e.key === 'ArrowLeft') goToPrevImage();
      else if (e.key === 'ArrowRight') goToNextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, goToPrevImage, goToNextImage]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price);

  // Переводы
  const translations: Record<string, Record<string, string>> = {
    lightRequirement: {
      'FULL_SUN': 'Прямой солнечный свет',
      'BRIGHT_INDIRECT': 'Яркий рассеянный',
      'PARTIAL_SHADE': 'Полутень',
      'SHADE': 'Тень',
      'LOW_LIGHT': 'Слабое освещение',
    },
    wateringFrequency: {
      'VERY_LOW': 'Очень редкий',
      'LOW': 'Редкий',
      'MODERATE': 'Умеренный',
      'HIGH': 'Частый',
      'VERY_HIGH': 'Очень частый',
    },
    humidityLevel: {
      'LOW': 'Низкая',
      'MEDIUM': 'Средняя',
      'HIGH': 'Высокая',
      'VERY_HIGH': 'Очень высокая',
    },
    careDifficulty: {
      'BEGINNER': 'Для новичков',
      'EASY': 'Лёгкий',
      'MODERATE': 'Средний',
      'ADVANCED': 'Для опытных',
      'EXPERT': 'Эксперт',
    },
    soilType: {
      'SANDY': 'Песчаная',
      'LOAMY': 'Суглинистая',
      'CLAY': 'Глинистая',
      'PEATY': 'Торфяная',
      'CHALKY': 'Известковая',
      'WELL_DRAINING': 'Дренированная',
      'MOISTURE_RETAINING': 'Влагоудерживающая',
    },
    growthRate: {
      'SLOW': 'Медленный',
      'MODERATE': 'Умеренный',
      'FAST': 'Быстрый',
    },
    toxicity: {
      'NON_TOXIC': 'Безопасен',
      'MILDLY_TOXIC': 'Слабо токсичен',
      'TOXIC': 'Токсичен',
      'HIGHLY_TOXIC': 'Очень токсичен',
      'TOXIC_TO_PETS': 'Опасен для животных',
      'TOXIC_TO_HUMANS': 'Опасен для людей',
    },
    condition: {
      'NEW': 'Новый',
      'WITH_DEFECTS': 'С дефектами',
    },
  };

  const translate = (category: string, value: string | undefined): string => {
    if (!value) return '';
    return translations[category]?.[value] || value;
  };

  const attributeNames: Record<string, string> = {
    'material': 'Материал', 'handle_material': 'Материал ручки', 'handle_length': 'Длина ручки',
    'weight': 'Вес', 'diameter': 'Диаметр', 'height': 'Высота', 'volume': 'Объём',
    'has_drainage': 'Дренаж', 'color': 'Цвет', 'brand': 'Бренд', 'country': 'Страна',
  };

  const getAttributeName = (code: string): string => attributeNames[code] || code.replace(/_/g, ' ');

  const formatAttributeValue = (attr: { valueString?: string; valueNumber?: number; valueBoolean?: boolean }): string => {
    if (attr.valueBoolean !== undefined) return attr.valueBoolean ? 'Да' : 'Нет';
    if (attr.valueNumber !== undefined) return String(attr.valueNumber);
    return attr.valueString || '—';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Товар не найден'}</p>
          <Link to="/catalog" className="text-primary-600 hover:underline">← Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  const displayTitle = offer.title || offer.taxonomyCommonName || offer.taxonomyScientificName || 'Без названия';
  const scientificName = offer.latinName || offer.taxonomyScientificName;
  const hasCareInfo = offer.lightRequirement || offer.wateringFrequency || offer.humidityLevel || offer.careDifficulty;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-primary-600">Главная</Link>
          <ChevronRightSmall className="w-4 h-4" />
          <Link to="/catalog" className="hover:text-primary-600">Каталог</Link>
          {offer.categoryName && (
            <>
              <ChevronRightSmall className="w-4 h-4" />
              <span className="text-gray-700">{offer.categoryName}</span>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-4 sticky top-4">
              <div className="flex gap-3">
                {/* Thumbnails */}
                {imageUrls.length > 1 && (
                  <div className="flex flex-col gap-2 w-16">
                    {imageUrls.slice(0, 5).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {imageUrls.length > 5 && (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                        +{imageUrls.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Image */}
                <div className="flex-1 relative">
                  <div
                    className="aspect-square bg-gray-50 rounded-xl overflow-hidden cursor-zoom-in group"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <img
                      src={imageUrls[selectedImage]}
                      alt={displayTitle}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 backdrop-blur rounded-full p-2 shadow-lg">
                        <ZoomIn className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  {imageUrls.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {selectedImage + 1} / {imageUrls.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions under image */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    if (isAuthenticated && offer) {
                      toggleFavorite(offer.id);
                    }
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isAuthenticated && offer && isFavorited(offer.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-sm">{isAuthenticated && offer && isFavorited(offer.id) ? 'В избранном' : 'В избранное'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Info */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6">
              {/* Title */}
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                {displayTitle}
              </h1>
              {scientificName && scientificName !== displayTitle && (
                <p className="text-gray-400 text-sm italic mb-4">{scientificName}</p>
              )}

              {/* Category badge */}
              {offer.categoryName && (
                <div className="inline-block bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
                  {offer.categoryName}
                </div>
              )}

              {/* Tabs */}
              <div className="border-b mb-4">
                <div className="flex gap-6">
                  {hasCareInfo && (
                    <button
                      onClick={() => setActiveTab('care')}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'care' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Уход
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'description' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Описание
                  </button>
                  {offer.attributes && offer.attributes.length > 0 && (
                    <button
                      onClick={() => setActiveTab('specs')}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'specs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Характеристики
                    </button>
                  )}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px]">
                {activeTab === 'description' && (
                  <div className="text-gray-600 text-sm leading-relaxed">
                    {offer.description || 'Описание товара скоро появится.'}
                  </div>
                )}

                {activeTab === 'care' && hasCareInfo && (
                  <div className="grid grid-cols-2 gap-3">
                    {offer.lightRequirement && (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                        <Sun className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">Свет</div>
                          <div className="text-sm font-medium text-gray-800">{translate('lightRequirement', offer.lightRequirement)}</div>
                        </div>
                      </div>
                    )}
                    {offer.wateringFrequency && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                        <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">Полив</div>
                          <div className="text-sm font-medium text-gray-800">{translate('wateringFrequency', offer.wateringFrequency)}</div>
                        </div>
                      </div>
                    )}
                    {offer.humidityLevel && (
                      <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-xl">
                        <Wind className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">Влажность</div>
                          <div className="text-sm font-medium text-gray-800">{translate('humidityLevel', offer.humidityLevel)}</div>
                        </div>
                      </div>
                    )}
                    {offer.temperatureMin !== undefined && offer.temperatureMax !== undefined && offer.temperatureMin !== null && offer.temperatureMax !== null && (
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                        <Thermometer className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">Температура</div>
                          <div className="text-sm font-medium text-gray-800">от {offer.temperatureMin}°C до {offer.temperatureMax}°C</div>
                        </div>
                      </div>
                    )}
                    {offer.careDifficulty && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                        <Leaf className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">Сложность</div>
                          <div className="text-sm font-medium text-gray-800">{translate('careDifficulty', offer.careDifficulty)}</div>
                        </div>
                      </div>
                    )}
                    {offer.toxicity && (
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${offer.toxicity === 'NON_TOXIC' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${offer.toxicity === 'NON_TOXIC' ? 'text-green-500' : 'text-yellow-500'}`} />
                        <div>
                          <div className="text-xs text-gray-500">Безопасность</div>
                          <div className="text-sm font-medium text-gray-800">{translate('toxicity', offer.toxicity)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && offer.attributes && (
                  <div className="space-y-2">
                    {offer.attributes.map((attr) => (
                      <div key={attr.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500 text-sm">{getAttributeName(attr.attributeCode)}</span>
                        <span className="text-gray-900 text-sm font-medium">{formatAttributeValue(attr)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Purchase */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-5 sticky top-4 space-y-4">
              {/* Price */}
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(offer.price)} <span className="text-xl">₽</span>
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                {isInStock === null ? (
                  <span className="text-sm text-gray-400">Проверяем наличие...</span>
                ) : isInStock ? (
                  <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                    <Check className="w-4 h-4" />
                    В наличии{availableQuantity !== null && availableQuantity <= 5 && ` (осталось ${availableQuantity} шт.)`}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Нет в наличии
                  </span>
                )}
              </div>

              {/* Quantity selector */}
              {isInStock !== false && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Количество:</span>
                  <div className="flex items-center border border-gray-200 rounded-xl">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 rounded-l-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-center min-w-[3rem] font-medium">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= maxQuantity}
                      className="p-2 hover:bg-gray-100 rounded-r-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isAdded || isInStock === false}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                    isAdded
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50'
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Добавление...</span>
                    </>
                  ) : isAdded ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Добавлено</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>В корзину</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isAddingToCart || isInStock === false}
                  className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Купить сейчас
                </button>

                {/* Inline сообщение об ошибке */}
                {cartError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{cartError}</span>
                  </div>
                )}
              </div>

              {/* Delivery */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Доставка</div>
                    <div className="text-xs text-gray-500">Бесплатно от 5 000 ₽</div>
                  </div>
                </div>
                {offer.warrantyMonths && offer.warrantyMonths > 0 && (
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Гарантия</div>
                      <div className="text-xs text-gray-500">{offer.warrantyMonths} месяцев</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Card */}
              <div className="pt-4 border-t">
                <Link
                  to={seller?.fullSlug ? `/seller/${seller.fullSlug}` : `/seller/${offer.sellerId}`}
                  className="block group"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all duration-200">
                    {/* Seller Avatar/Logo */}
                    <div className="relative flex-shrink-0">
                      {seller?.logoUrl ? (
                        <img
                          src={seller.logoUrl}
                          alt={seller.shopName}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : seller?.avatarInitials ? (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{ backgroundColor: seller.avatarBackgroundColor || '#6366f1' }}
                        >
                          {seller.avatarInitials}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                          <Store className="w-6 h-6 text-white" />
                        </div>
                      )}
                      {/* Verified Badge */}
                      {seller?.status === 'APPROVED' && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Seller Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                          {seller?.shopName || `Магазин #${offer.sellerId}`}
                        </span>
                      </div>

                      {/* Rating */}
                      {seller?.rating !== undefined && seller.rating > 0 ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium text-gray-700">{seller.rating.toFixed(1)}</span>
                          </div>
                          {seller.reviewCount !== undefined && seller.reviewCount > 0 && (
                            <span className="text-xs text-gray-400">
                              · {seller.reviewCount} {pluralize(seller.reviewCount, 'отзыв', 'отзыва', 'отзывов')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-0.5">Новый продавец</div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRightSmall className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </div>

              {/* Condition */}
              {offer.condition && (
                <div className="pt-4 border-t">
                  <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{translate('condition', offer.condition)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" ref={reviewsRef} className="mt-8 bg-white rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Отзывы</h2>
          </div>
          <ReviewList offerId={id!} />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
          <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white">
            <X className="w-8 h-8" />
          </button>

          {imageUrls.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); goToPrevImage(); }} className="absolute left-4 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full">
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); goToNextImage(); }} className="absolute right-4 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full">
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img
            src={imageUrls[selectedImage]}
            alt={displayTitle}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {imageUrls.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${selectedImage === i ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
