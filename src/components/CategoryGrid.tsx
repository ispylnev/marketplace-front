import { Link } from 'react-router-dom';
import { Flower, TreePine, Leaf, Sprout, Droplets, Sun } from 'lucide-react';

const CategoryGrid = () => {
  const categories = [
    {
      id: 1,
      name: 'Комнатные растения',
      icon: Flower,
      color: 'from-green-500 to-emerald-600',
      count: '1200+',
    },
    {
      id: 2,
      name: 'Садовые растения',
      icon: TreePine,
      color: 'from-lime-500 to-green-600',
      count: '850+',
    },
    {
      id: 3,
      name: 'Суккуленты',
      icon: Leaf,
      color: 'from-teal-500 to-cyan-600',
      count: '420+',
    },
    {
      id: 4,
      name: 'Семена',
      icon: Sprout,
      color: 'from-amber-500 to-orange-600',
      count: '650+',
    },
    {
      id: 5,
      name: 'Удобрения',
      icon: Droplets,
      color: 'from-blue-500 to-indigo-600',
      count: '320+',
    },
    {
      id: 6,
      name: 'Горшки и кашпо',
      icon: Sun,
      color: 'from-rose-500 to-pink-600',
      count: '580+',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link
            key={category.id}
            to={`/catalog?category=${category.id}`}
            className="group"
          >
            <div className="bg-white rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                {category.name}
              </h3>
              <p className="text-xs text-gray-500">{category.count} товаров</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default CategoryGrid;

