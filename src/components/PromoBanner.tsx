import { Percent, Gift, Truck } from 'lucide-react';

const PromoBanner = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <Percent className="w-10 h-10 mb-3" />
        <h3 className="text-xl font-bold mb-2">Скидки до 50%</h3>
        <p className="text-primary-100 text-sm">На первую покупку</p>
      </div>

      <div className="bg-gradient-to-br from-accent-500 to-accent-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <Gift className="w-10 h-10 mb-3" />
        <h3 className="text-xl font-bold mb-2">Подарки</h3>
        <p className="text-accent-100 text-sm">При заказе от 5000 ₽</p>
      </div>

      <div className="bg-gradient-to-br from-earth-500 to-earth-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <Truck className="w-10 h-10 mb-3" />
        <h3 className="text-xl font-bold mb-2">Бесплатная доставка</h3>
        <p className="text-earth-100 text-sm">От 3000 ₽ по городу</p>
      </div>
    </div>
  );
};

export default PromoBanner;


