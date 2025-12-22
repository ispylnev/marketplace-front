import { Star, Heart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from './ImageWithFallback';
import monsteraImage from '../assets/e35a9fcdb27ad7f93f82558552e5c75b977ef47d.png';
import palmImage from '../assets/41b7684045c606d81a7dd04211aa67cac02d3619.png';
import succulentsImage from '../assets/5a256d30852fb7161345ae6ad8e1fd1092507893.png';
import gardenFlowersImage from '../assets/77ccbb5ac05ba5387495b242d9f1b853d7d01607.png';
import cactusImage from '../assets/39f8172913871a7961ff2f6e6679dec217aa264e.png';
import { Link } from 'react-router-dom';

const products = [
  {
    id: 1,
    name: 'Монстера Деликатесная',
    price: 2499,
    rating: 4.8,
    reviews: 156,
    image: monsteraImage,
  },
  {
    id: 2,
    name: 'Комнатная Пальма',
    price: 3499,
    rating: 4.7,
    reviews: 234,
    image: palmImage,
  },
  {
    id: 3,
    name: 'Суккуленты (набор)',
    price: 899,
    rating: 4.9,
    reviews: 412,
    image: succulentsImage,
  },
  {
    id: 4,
    name: 'Садовые цветы',
    price: 1299,
    rating: 4.6,
    reviews: 189,
    image: gardenFlowersImage,
  },
  {
    id: 5,
    name: 'Кактус Микс',
    price: 699,
    rating: 4.8,
    reviews: 298,
    image: cactusImage,
  },
  {
    id: 6,
    name: 'Садовые растения',
    price: 1899,
    rating: 4.5,
    reviews: 145,
    image: 'https://images.unsplash.com/photo-1664023304975-58b2e587d38d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBwbGFudHMlMjBvdXRkb29yfGVufDF8fHx8MTc2NTUzMzMwMHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 7,
    name: 'Папоротник комнатный',
    price: 1599,
    rating: 4.7,
    reviews: 203,
    image: 'https://images.unsplash.com/photo-1714235416342-1215c48540f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZXJuJTIwcGxhbnQlMjBpbmRvb3J8ZW58MXx8fHwxNzY1NDUxODM4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 8,
    name: 'Набор для садоводства',
    price: 2999,
    rating: 4.9,
    reviews: 324,
    image: 'https://images.unsplash.com/photo-1764442680289-8b380211e65f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjB0b29scyUyMHN1cHBsaWVzfGVufDF8fHx8MTc2NTUzMzMwMnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export default function FeaturedProducts() {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow group"
            >
              <Link to={`/product/${product.id}`}>
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
                      toggleFavorite(product.id);
                    }}
                  >
                    <Heart className={`w-5 h-5 ${favorites.has(product.id) ? 'fill-red-500 text-red-500' : 'text-[#2D2E30]'}`} />
                  </button>
                </div>
              </Link>

              <div className="p-4">
                <Link to={`/product/${product.id}`}>
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
      </div>
    </section>
  );
}


