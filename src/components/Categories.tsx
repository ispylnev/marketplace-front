import { useEffect, useState } from 'react';
import { Flower2, Home, ShoppingBag, Sprout, LayoutGrid, Loader2, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogService, CategoryPublic } from '../api/catalogService';

// Маппинг slug -> иконка и цвет
const categoryStyles: Record<string, { icon: LucideIcon; color: string }> = {
  'garden': { icon: Flower2, color: '#BCCEA9' },
  'sadovye-rasteniya': { icon: Flower2, color: '#BCCEA9' },
  'indoor': { icon: Home, color: '#2B4A39' },
  'komnatnye-rasteniya': { icon: Home, color: '#2B4A39' },
  'accessories': { icon: ShoppingBag, color: '#BCCEA9' },
  'soputstvuyuschie-tovary': { icon: ShoppingBag, color: '#BCCEA9' },
  'seeds': { icon: Sprout, color: '#2B4A39' },
  'semena': { icon: Sprout, color: '#2B4A39' },
};

// Дефолтный стиль
const defaultStyle = { icon: Flower2, color: '#2B4A39' };

// Альтернативные цвета для категорий без маппинга
const alternateColors = ['#BCCEA9', '#2B4A39'];

export default function Categories() {
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await catalogService.getRootCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStyle = (category: CategoryPublic, index: number) => {
    const mapped = categoryStyles[category.slug];
    if (mapped) return mapped;

    // Для немаппленных категорий чередуем цвета
    return {
      icon: defaultStyle.icon,
      color: alternateColors[index % alternateColors.length]
    };
  };

  if (loading) {
    return (
      <section className="pt-6 bg-white" style={{ paddingBottom: '0px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-[#2B4A39]" />
            <h2 className="text-3xl text-[#2D2E30]">Категории</h2>
          </div>
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#2B4A39]" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pt-6 bg-white" style={{ paddingBottom: '0px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-[#2B4A39]" />
            <h2 className="text-3xl text-[#2D2E30]">Категории</h2>
          </div>
          <div className="text-center py-8 text-red-500">{error}</div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="pt-6 bg-white" style={{ paddingBottom: '0px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-[#2B4A39]" />
          <h2 className="text-3xl text-[#2D2E30]">Категории</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const style = getCategoryStyle(category, index);
            const Icon = style.icon;
            return (
              <Link
                key={category.id}
                to={`/catalog?category=${category.slug}`}
                className="group relative bg-white rounded-2xl p-4 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-18 h-18 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: style.color }}
                  >
                    <Icon className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-lg text-[#2D2E30]">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}