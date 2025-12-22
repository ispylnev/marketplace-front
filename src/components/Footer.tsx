import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#2D2E30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white text-xl mb-4">Vega</h3>
            <p className="text-sm mb-4 text-white">
              Ваш надежный магазин растений и товаров для садоводства. Качество и забота о каждом растении.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white mb-4">Быстрые ссылки</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  О нас
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Контакты
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Вакансии
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Блог
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white mb-4">Обслуживание</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Помощь
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Отследить заказ
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Возврат
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Доставка
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white mb-4">Правовая информация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Политика конфиденциальности
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Условия использования
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Политика cookie
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#BCCEA9] transition-colors">
                  Соглашение продавца
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 text-sm text-center">
          <p className="text-white">&copy; 2025 Vega. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
