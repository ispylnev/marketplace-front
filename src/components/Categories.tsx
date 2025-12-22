import { Flower2, Home, ShoppingBag, Sprout, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 1,
    name: 'Садовые растения',
    icon: Flower2,
    description: 'Растения для сада и огорода',
    color: '#BCCEA9',
    link: '/catalog?category=garden'
  },
  {
    id: 2,
    name: 'Комнатные растения',
    icon: Home,
    description: 'Растения для дома и офиса',
    color: '#2B4A39',
    link: '/catalog?category=indoor'
  },
  {
    id: 3,
    name: 'Сопутствующие товары',
    icon: ShoppingBag,
    description: 'Горшки, грунт, удобрения',
    color: '#BCCEA9',
    link: '/catalog?category=accessories'
  },
  {
    id: 4,
    name: 'Семена',
    icon: Sprout,
    description: 'Семена овощей и цветов',
    color: '#2B4A39',
    link: '/catalog?category=seeds'
  }
];

export default function Categories() {
  return (
    <section className="pt-6 bg-white" style={{ paddingBottom: '0px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-[#2B4A39]" />
          <h2 className="text-3xl text-[#2D2E30]">Категории</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={category.link}
                className="group relative bg-white rounded-2xl p-4 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div 
                    className="w-18 h-18 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: category.color }}
                  >
                    <Icon className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-lg text-[#2D2E30]">
                    {category.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}


