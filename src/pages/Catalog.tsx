import { useState } from 'react';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { Filter, Grid, List } from 'lucide-react';
import { Product } from '../types';

const Catalog = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Mock products
  const products: Product[] = [
    {
      id: '1',
      name: 'Монстера Деликатесная (Monstera Deliciosa)',
      price: '2 990',
      oldPrice: '3 500',
      image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&h=500&fit=crop',
      rating: 5,
      reviews: 234,
      discount: 15,
    },
    {
      id: '2',
      name: 'Фикус Лирата (Fiddle Leaf Fig)',
      price: '3 500',
      image: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=500&h=500&fit=crop',
      rating: 5,
      reviews: 189,
    },
    {
      id: '3',
      name: 'Суккуленты Микс (5 растений)',
      price: '1 290',
      oldPrice: '1 690',
      image: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=500&h=500&fit=crop',
      rating: 5,
      reviews: 456,
      discount: 24,
    },
    {
      id: '4',
      name: 'Алоказия Полли (Alocasia Polly)',
      price: '4 500',
      image: 'https://images.unsplash.com/photo-1616423622877-68ad9895c813?w=500&h=500&fit=crop',
      rating: 5,
      reviews: 123,
    },
    {
      id: '5',
      name: 'Пальма Арека (Dypsis Lutescens)',
      price: '5 990',
      image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=500&h=500&fit=crop',
      rating: 5,
      reviews: 567,
    },
    {
      id: '6',
      name: 'Антуриум Красный (Anthurium)',
      price: '2 790',
      oldPrice: '3 400',
      image: 'https://images.unsplash.com/photo-1591958911259-bee2173bdccc?w=500&h=500&fit=crop',
      rating: 5,
      reviews: 234,
      discount: 18,
    },
    {
      id: '7',
      name: 'Сансевиерия (Тёщин язык)',
      price: '1 490',
      image: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb8?w=500&h=500&fit=crop',
      rating: 5,
      reviews: 890,
    },
    {
      id: '8',
      name: 'Кактус Микс (3 растения)',
      price: '890',
      image: 'https://images.unsplash.com/photo-1509937528035-ad76254b0356?w=500&h=500&fit=crop',
      rating: 5,
      reviews: 456,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Каталог растений</h1>
          <p className="text-primary-100 mb-6">Найдите идеальное растение для вашего дома</p>
          <SearchBar />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" className="hover:text-primary-600">Главная</a>
            <span>→</span>
            <span className="text-gray-900 font-medium">Каталог</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-72 flex-shrink-0`}>
            <div className="bg-white rounded-3xl shadow-sm p-6 sticky top-24 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">🔍 Фильтры</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="md:hidden text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Цена</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0 ₽</span>
                    <span>200 000 ₽</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Рейтинг</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">{rating} звезд и выше</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Только со скидкой</span>
                </label>
              </div>
            </div>
          </aside>

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
                </button>
                <span className="text-gray-700 font-medium">Найдено: <span className="text-primary-600 font-bold">{products.length}</span> растений</span>
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

            {/* Products Grid */}
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
            <div className="mt-12 flex justify-center">
              <div className="flex items-center space-x-2">
                <button className="px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-colors font-medium">
                  ← Назад
                </button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    className={`px-5 py-3 rounded-xl font-medium transition-all ${
                      page === 1
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                        : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button className="px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-colors font-medium">
                  Вперед →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
