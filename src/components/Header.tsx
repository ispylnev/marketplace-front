import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogIn, UserPlus, LogOut, Heart, Package } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { tokenManager } from '../api/client';
import { cartService } from '../api/cartService';
import SearchBar from './SearchBar';
import heroBg from '../assets/8e51749862af8a39de8862be61345a3928582e1e.png';
import vegaLogo from '../assets/9f8522ff5c46c241fe026950d295cfdf39fe881b.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверка авторизации при загрузке и при изменении
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(tokenManager.isAuthenticated());
    };

    checkAuth();

    // Слушаем события изменения авторизации
    window.addEventListener('auth-change', checkAuth);

    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  // Загрузка количества товаров в корзине
  useEffect(() => {
    const loadCartCount = async () => {
      try {
        const count = await cartService.getCartCount();
        setCartCount(count);
      } catch (error) {
        // Корзина может быть недоступна, игнорируем
      }
    };

    loadCartCount();

    // Обновляем при изменении корзины
    const handleCartChange = () => loadCartCount();
    window.addEventListener('cart-change', handleCartChange);

    return () => {
      window.removeEventListener('cart-change', handleCartChange);
    };
  }, []);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 relative">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[73.6px]">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src={vegaLogo} alt="VEGA" className="h-[69px] w-auto" />
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <SearchBar
              compact
              variant="dark"
              placeholder="Поиск растений и товаров..."
            />
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-6">
            <button className="hover:text-[#BCCEA9] transition-colors text-white hidden md:block">
              <Heart className="w-6 h-6" />
            </button>
            <button className="hover:text-[#BCCEA9] transition-colors text-white hidden md:block">
              <Package className="w-6 h-6" />
            </button>
            <Link to="/cart" className="hover:text-[#BCCEA9] transition-colors relative text-white">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#BCCEA9] text-[#2D2E30] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="hover:text-[#BCCEA9] transition-colors text-white cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <User className="w-6 h-6" />
              </button>
              
              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Профиль
                      </Link>
                      <button
                        onClick={() => {
                          tokenManager.clearToken();
                          setIsAuthenticated(false);
                          setIsUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Выйти
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Войти
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Регистрация
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <button 
              className="md:hidden p-2 text-white hover:text-[#BCCEA9] transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 py-3 border-t border-white/20">
          <Link to="/catalog?category=garden" className="text-white hover:text-[#BCCEA9] transition-colors">
            Садовые растения
          </Link>
          <Link to="/catalog?category=indoor" className="text-white hover:text-[#BCCEA9] transition-colors">
            Комнатные растения
          </Link>
          <Link to="/catalog?category=accessories" className="text-white hover:text-[#BCCEA9] transition-colors">
            Сопутствующие товары
          </Link>
          <Link to="/catalog?promo=true" className="text-[#BCCEA9] hover:text-white transition-colors">
            Акции
          </Link>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 animate-slide-up">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-white hover:text-[#BCCEA9] transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Главная
              </Link>
              <Link 
                to="/catalog" 
                className="text-white hover:text-[#BCCEA9] transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Каталог
              </Link>
              {!isAuthenticated && (
                <>
                  <Link 
                    to="/login" 
                    className="text-white hover:text-[#BCCEA9] transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-white hover:text-[#BCCEA9] transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
