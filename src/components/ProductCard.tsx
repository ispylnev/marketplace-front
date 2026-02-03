import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Loader2, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useState, useEffect } from 'react';
import { cartService } from '../api/cartService';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Сбрасываем состояние "добавлено" через 2 секунды
  useEffect(() => {
    if (isAdded) {
      const timer = setTimeout(() => setIsAdded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAdded]);

  // Сбрасываем ошибку через 4 секунды
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || isAdded) return;

    setError(null);
    setIsAddingToCart(true);

    try {
      const offerId = parseInt(product.id);
      if (isNaN(offerId)) {
        setError('Некорректный ID товара');
        return;
      }

      await cartService.addToCart(offerId, 1);
      setIsAdded(true);
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.code === 'INSUFFICIENT_STOCK') {
        const available = errorData.available || 0;
        setError(available === 0 ? 'Нет в наличии' : `Доступно только ${available} шт.`);
      } else if (errorData?.code === 'OFFER_NOT_AVAILABLE') {
        setError('Товар недоступен');
      } else {
        setError('Не удалось добавить');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Определяем состояние и стиль кнопки
  const getButtonState = () => {
    if (isAddingToCart) {
      return {
        className: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white',
        content: (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Добавление...</span>
          </>
        ),
        disabled: true,
      };
    }
    if (isAdded) {
      return {
        className: 'bg-green-500 text-white',
        content: (
          <>
            <Check className="w-4 h-4" />
            <span>Добавлено</span>
          </>
        ),
        disabled: true,
      };
    }
    if (error) {
      return {
        className: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white',
        content: (
          <>
            <ShoppingCart className="w-4 h-4" />
            <span>В корзину</span>
          </>
        ),
        disabled: false,
      };
    }
    return {
      className: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:scale-105',
      content: (
        <>
          <ShoppingCart className="w-4 h-4" />
          <span>В корзину</span>
        </>
      ),
      disabled: false,
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.discount && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
              -{product.discount}%
            </div>
          )}
          <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-semibold text-primary-700 shadow">
              ⭐ {product.rating}
            </div>
            <button
              className="p-2 bg-white rounded-full shadow-lg hover:bg-accent-50 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-accent-600 text-accent-600' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </Link>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < product.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
          </div>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[3rem] text-sm leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="space-y-2 mt-4">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {product.price} ₽
            </span>
            {product.oldPrice && (
              <span className="text-sm text-gray-400 line-through">
                {product.oldPrice} ₽
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={buttonState.disabled}
            className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed ${buttonState.className}`}
          >
            {buttonState.content}
          </button>

          {/* Inline сообщение об ошибке */}
          {error && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
