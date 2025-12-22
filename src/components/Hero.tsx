import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/8e51749862af8a39de8862be61345a3928582e1e.png';
import heroImage from '../assets/826b1953f9491cb74d2882144fe9f7c5374b34cc.png';

const Hero = () => {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative text-white overflow-hidden rounded-2xl">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={heroBg} 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content */}
          <div className="relative px-4 sm:px-6 lg:px-8 py-[34px]">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-5xl mb-6">
                  Растения для вашего дома и сада
                </h2>
                <p className="text-xl text-[#BCCEA9] mb-8 font-bold" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  Большой выбор комнатных и садовых растений. Качественные товары для садоводства с доставкой по всей стране.
                </p>
                <div className="flex gap-4">
                  <Link
                    to="/catalog"
                    className="bg-[#BCCEA9] text-[#2D2E30] px-8 py-3 rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                  >
                    Перейти к покупкам
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button className="border-2 border-[#BCCEA9] text-white px-8 py-3 rounded-lg hover:bg-[#BCCEA9] hover:text-[#2D2E30] transition-colors">
                    Узнать больше
                  </button>
                </div>
              </div>
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Интерьер с растениями"
                  className="rounded-lg shadow-2xl max-h-80 w-auto mx-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
