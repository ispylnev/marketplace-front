import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Heart, Sparkles, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { makeFullSlug } from '../utils/slugUtils';
import { searchService } from '../api/searchService';

const PAGE_SIZE = 12;

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
}

export default function FeaturedProducts() {
  const { isAuthenticated } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNext && !loadingMore) {
            loadMore();
          }
        },
        { rootMargin: '200px' }
      );
      observerRef.current.observe(node);
    },
    [hasNext, loadingMore]
  );

  useEffect(() => {
    loadProducts();
  }, []);

  const convertHits = (hits: Awaited<ReturnType<typeof searchService.searchOffers>>['hits']): Product[] =>
    hits.map(hit => ({
      id: hit.offerId,
      name: hit.title,
      price: hit.price || 0,
      rating: hit.averageRating || 0,
      reviews: hit.reviewCount || 0,
      image: hit.mainImageUrl || hit.mainImageThumbnailUrl || 'https://via.placeholder.com/300',
    }));

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await searchService.searchOffers({
        sortBy: 'created_desc',
        page: 0,
        size: PAGE_SIZE,
        inStock: true,
      });

      setProducts(convertHits(response.hits));
      setHasNext(response.hasNext);
      setPage(0);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasNext) return;

    const nextPage = page + 1;
    try {
      setLoadingMore(true);
      const response = await searchService.searchOffers({
        sortBy: 'created_desc',
        page: nextPage,
        size: PAGE_SIZE,
        inStock: true,
      });

      setProducts(prev => [...prev, ...convertHits(response.hits)]);
      setHasNext(response.hasNext);
      setPage(nextPage);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#2B4A39]" />
            <h2 className="text-3xl text-[#2D2E30]">Новинки</h2>
          </div>
          <Link to="/catalog" className="text-[#2B4A39] hover:text-[#2D2E30] transition-colors">
            Смотреть все
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#2B4A39]" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>Нет доступных товаров</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <Link to={`/product/${makeFullSlug(product.name, product.id)}`}>
                  <div className="relative overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        if (isAuthenticated) {
                          toggleFavorite(product.id);
                        }
                      }}
                    >
                      <Heart className={`w-5 h-5 ${isAuthenticated && isFavorited(product.id) ? 'fill-red-500 text-red-500' : 'text-[#2D2E30]'}`} />
                    </button>
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/product/${makeFullSlug(product.name, product.id)}`}>
                    <h3 className="text-[#2D2E30] mb-2 hover:text-[#2B4A39] transition-colors">{product.name}</h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({product.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl text-[#2B4A39]">{product.price.toLocaleString('ru-RU')} ₽</span>
                    <button className="bg-[#2B4A39] text-white px-4 py-2 rounded-lg hover:bg-[#2D2E30] transition-colors">
                      В корзину
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Sentinel для IntersectionObserver + индикатор загрузки */}
            {hasNext && (
              <div ref={sentinelRef} className="flex justify-center py-8">
                {loadingMore && (
                  <Loader2 className="w-6 h-6 animate-spin text-[#2B4A39]" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
