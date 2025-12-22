import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PromoSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'Весенняя распродажа',
      subtitle: 'Скидки до 50% на комнатные растения',
      image: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=1200&h=400&fit=crop',
      buttonText: 'Смотреть акции',
      gradient: 'from-primary-600/90 to-primary-800/90',
    },
    {
      id: 2,
      title: 'Новая коллекция кактусов',
      subtitle: 'Более 100 видов редких суккулентов',
      image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=1200&h=400&fit=crop',
      buttonText: 'Перейти в каталог',
      gradient: 'from-accent-600/90 to-accent-800/90',
    },
    {
      id: 3,
      title: 'Готовые композиции',
      subtitle: 'Профессиональные флористы создали для вас',
      image: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1200&h=400&fit=crop',
      buttonText: 'Заказать композицию',
      gradient: 'from-earth-600/90 to-earth-800/90',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-3xl shadow-2xl">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`}>
            <div className="container mx-auto px-4 h-full flex items-center">
              <div className="max-w-2xl text-white">
                <h2 className="text-5xl md:text-7xl font-bold mb-4 animate-slide-up">
                  {slide.title}
                </h2>
                <p className="text-xl md:text-2xl mb-8 animate-fade-in">
                  {slide.subtitle}
                </p>
                <button className="px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-all hover:scale-105 shadow-xl">
                  {slide.buttonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoSlider;

