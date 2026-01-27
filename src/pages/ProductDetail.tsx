import { useParams } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Truck, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { extractId } from '../utils/slugUtils';

const ProductDetail = () => {
  const { slugWithId } = useParams();
  const id = extractId(slugWithId);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock product data
  const product = {
    id: id?.toString() || '1',
    name: 'Монстера Деликатесная (Monstera Deliciosa)',
    price: '2 990',
    oldPrice: '3 500',
    images: [
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1614594895304-fe7116ac3b58?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1617883861744-7bde89235838?w=800&h=800&fit=crop',
    ],
    rating: 5,
    reviews: 234,
    discount: 15,
    description: 'Монстера Деликатесная — тропическое растение с красивыми резными листьями. Неприхотлива в уходе, быстро растёт и отлично подходит для озеленения квартир и офисов. Высота растения: 50-60 см, возраст: 2 года.',
    specifications: {
      'Высота растения': '50-60 см',
      'Диаметр горшка': '17 см',
      'Освещение': 'Яркий рассеянный свет',
      'Полив': 'Умеренный, 1-2 раза в неделю',
      'Температура': '18-25°C',
      'Влажность': 'Средняя, 60-70%',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/catalog"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к каталогу
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div>
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index
                        ? 'border-primary-600'
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < product.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-gray-600 ml-2">({product.reviews} отзывов)</span>
                </div>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isFavorite ? 'fill-accent-600 text-accent-600' : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

              <div className="flex items-center space-x-4 mb-6">
                {product.oldPrice && (
                  <span className="text-2xl text-gray-400 line-through">
                    {product.oldPrice} ₽
                  </span>
                )}
                <span className="text-4xl font-bold text-gray-900">
                  {product.price} ₽
                </span>
                {product.discount && (
                  <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-semibold">
                    -{product.discount}%
                  </span>
                )}
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Количество
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 mb-8">
                <button className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Добавить в корзину</span>
                </button>
                <button className="w-full py-4 bg-white border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
                  Купить в 1 клик
                </button>
              </div>

              {/* Features */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Бесплатная доставка от 5000 ₽</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Гарантия 1 год</span>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Характеристики</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">{key}</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
