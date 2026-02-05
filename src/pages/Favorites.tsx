import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Loader2, Trash2, AlertCircle, Check } from 'lucide-react';
import { favoritesService, FavoriteItem } from '../api/favoritesService';
import { cartService } from '../api/cartService';
import { useFavorites } from '../contexts/FavoritesContext';

const Favorites = () => {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { toggleFavorite } = useFavorites();

  // Состояние для кнопок "В корзину" по offerId
  const [addingToCart, setAddingToCart] = useState<Record<number, boolean>>({});
  const [addedToCart, setAddedToCart] = useState<Record<number, boolean>>({});
  const [cartErrors, setCartErrors] = useState<Record<number, string>>({});

  const PAGE_SIZE = 50;

  // Загрузка первой страницы
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const data = await favoritesService.getFavorites(0, PAGE_SIZE);
        setItems(data);
        setHasMore(data.length === PAGE_SIZE);
        setPage(0);
      } catch {
        // Ошибка загрузки
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Загрузить ещё
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await favoritesService.getFavorites(nextPage, PAGE_SIZE);
      setItems(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(nextPage);
    } catch {
      // Ошибка загрузки
    } finally {
      setLoadingMore(false);
    }
  };

  // Удалить из избранного
  const handleRemove = async (offerId: number) => {
    await toggleFavorite(offerId);
    setItems(prev => prev.filter(item => item.offerId !== offerId));
  };

  // Добавить в корзину
  const handleAddToCart = async (offerId: number) => {
    if (addingToCart[offerId] || addedToCart[offerId]) return;

    setCartErrors(prev => ({ ...prev, [offerId]: '' }));
    setAddingToCart(prev => ({ ...prev, [offerId]: true }));

    try {
      await cartService.addToCart(offerId, 1);
      setAddedToCart(prev => ({ ...prev, [offerId]: true }));
      setTimeout(() => {
        setAddedToCart(prev => ({ ...prev, [offerId]: false }));
      }, 2000);
    } catch (error: any) {
      const errorData = error.response?.data;
      const msg = errorData?.code === 'INSUFFICIENT_STOCK'
        ? (errorData.available === 0 ? 'Нет в наличии' : `Доступно только ${errorData.available} шт.`)
        : errorData?.error || 'Не удалось добавить';
      setCartErrors(prev => ({ ...prev, [offerId]: msg }));
      setTimeout(() => {
        setCartErrors(prev => ({ ...prev, [offerId]: '' }));
      }, 4000);
    } finally {
      setAddingToCart(prev => ({ ...prev, [offerId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Избранное</h1>
          {items.length > 0 && (
            <span className="text-gray-500 text-lg">({items.length})</span>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">В избранном пока ничего</h2>
            <p className="text-gray-500 mb-6">Добавляйте понравившиеся товары, чтобы не потерять их</p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Перейти в каталог
            </Link>
          </div>
        )}

        {/* Items grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.offerId}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-lg ${
                  !item.available ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                <Link to={`/product/${item.offerId}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName || 'Товар'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Heart className="w-12 h-12" />
                      </div>
                    )}
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white/90 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                          Товар недоступен
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link to={`/product/${item.offerId}`}>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors text-sm min-h-[2.5rem]">
                      {item.productName || 'Без названия'}
                    </h3>
                  </Link>

                  {item.available && item.price > 0 && (
                    <div className="text-xl font-bold text-gray-900 mt-2">
                      {new Intl.NumberFormat('ru-RU').format(item.price)} {item.currency === 'RUB' ? '₽' : item.currency}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {item.available ? (
                      <button
                        onClick={() => handleAddToCart(item.offerId)}
                        disabled={addingToCart[item.offerId] || addedToCart[item.offerId]}
                        className={`flex-1 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed ${
                          addedToCart[item.offerId]
                            ? 'bg-green-500 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {addingToCart[item.offerId] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : addedToCart[item.offerId] ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Добавлено</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            <span>В корзину</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-center text-sm font-medium">
                        Недоступен
                      </div>
                    )}
                    <button
                      onClick={() => handleRemove(item.offerId)}
                      className="p-2.5 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Удалить из избранного"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cart error */}
                  {cartErrors[item.offerId] && (
                    <div className="flex items-center gap-1.5 text-red-600 text-xs mt-2 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{cartErrors[item.offerId]}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && items.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Загрузка...</span>
                </>
              ) : (
                'Показать ещё'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
