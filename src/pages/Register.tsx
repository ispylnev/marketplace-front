import { useState } from 'react';
import { authApi, RegisterRequest } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Lock, CheckCircle } from 'lucide-react';
import logo from '../assets/9f8522ff5c46c241fe026950d295cfdf39fe881b.png';
import headerBg from '../assets/3ad5f1be4761137284dc7fc853d7818c30549815.png';
import phoneImage from '../assets/84effd99c3d9e668f86768185911046b6601ef7d.png';
import { ErrorAlert } from '../components/ui/ErrorAlert';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    middleName: undefined,
    phone: undefined,
  });
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSubmitted(false);

    try {
      // Подготавливаем данные для отправки: убираем пустые строки для опциональных полей
      const dataToSend: RegisterRequest = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      };
      
      const response = await authApi.register(dataToSend);
      console.log('Успешная регистрация:', response.user);
      setSubmitted(true);
      
      // Обновляем состояние авторизации
      window.dispatchEvent(new Event('auth-change'));
      
      // Перенаправляем на главную страницу через 2 секунды
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setSubmitted(false);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof RegisterRequest, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value || (field === 'middleName' || field === 'phone' ? undefined : '') 
    }));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Хедер маркетплейса */}
      <header 
        className="text-white shadow-lg relative"
        style={{
          backgroundImage: `url(${headerBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-center relative z-10">
          <Link to="/">
            <img src={logo} alt="VEGA" className="h-[94px]" />
          </Link>
        </div>
      </header>

      {/* Основной контент */}
      <main className="container mx-auto px-4 pt-4 flex-1 overflow-visible">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          {/* Левая колонка - форма регистрации */}
          <div className="flex justify-center pt-4">
            <div className="w-full max-w-[900px] bg-white rounded-lg shadow-lg overflow-hidden border border-[#bccea9]">
              <div 
                className="px-3 py-3 text-white relative"
                style={{
                  backgroundImage: `url(${headerBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="relative z-10">
                  <h2 className="text-white mb-1 text-base">Регистрация</h2>
                  <p className="text-white/90 text-[11px]">Присоединяйтесь к VEGA</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-3 space-y-2">
                <ErrorAlert
                  error={error}
                  className="mb-2"
                  onClose={() => setError(null)}
                  closable={true}
                />

                {/* Два столбца: левый - ФИО, правый - контакты и пароль */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Левый столбец - ФИО */}
                  <div className="space-y-2">
                    <div>
                      <label htmlFor="firstName" className="block text-[#2d2e30] mb-1 text-[11px]">
                        Имя <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="text"
                          id="firstName"
                          required
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-[11px] border border-[#bccea9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b4a39] focus:border-transparent transition-all placeholder:text-[12px]"
                          placeholder="Иван"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-[#2d2e30] mb-1 text-[11px]">
                        Фамилия <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="text"
                          id="lastName"
                          required
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-[11px] border border-[#bccea9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b4a39] focus:border-transparent transition-all placeholder:text-[12px]"
                          placeholder="Иванов"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="middleName" className="block text-[#2d2e30] mb-1 text-[11px]">
                        Отчество
                      </label>
                      <div className="relative">
                        <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="text"
                          id="middleName"
                          value={formData.middleName || ''}
                          onChange={(e) => handleChange('middleName', e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-[11px] border border-[#bccea9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b4a39] focus:border-transparent transition-all placeholder:text-[12px]"
                          placeholder="Иванович"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Правый столбец - контакты и пароль */}
                  <div className="space-y-2">
                    <div>
                      <label htmlFor="phone" className="block text-[#2d2e30] mb-1 text-[11px]">
                        Номер телефона
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-[11px] border border-[#bccea9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b4a39] focus:border-transparent transition-all placeholder:text-[12px]"
                          placeholder="+7 (999) 123-45-67"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-[#2d2e30] mb-1 text-[11px]">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-[11px] border border-[#bccea9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b4a39] focus:border-transparent transition-all placeholder:text-[12px]"
                          placeholder="example@mail.ru"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-[#2d2e30] mb-1 text-[11px]">
                        Пароль <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="password"
                          id="password"
                          required
                          minLength={8}
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-[11px] border border-[#bccea9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b4a39] focus:border-transparent transition-all placeholder:text-[12px]"
                          placeholder="Минимум 8 символов"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Кнопка */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2b4a39] hover:bg-[#1f3529] text-white py-1.5 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mt-2.5 text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    'Регистрация...'
                  ) : submitted ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Регистрация успешна!
                    </>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </button>

                <p className="text-[9px] text-gray-500 text-center mt-1.5">
                  Регистрируясь, вы соглашаетесь с условиями использования и политикой конфиденциальности
                </p>

                <div className="text-center mt-2">
                  <Link
                    to="/login"
                    className="font-medium text-[#2b4a39] hover:text-[#1f3529] text-[11px]"
                  >
                    Уже есть аккаунт? Войти
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Правая колонка - изображение телефона */}
          <div className="hidden lg:flex items-end justify-start overflow-visible relative">
            <img 
              src={phoneImage} 
              alt="VEGA Mobile App" 
              className="w-full max-w-lg h-auto object-contain object-bottom drop-shadow-2xl"
            />
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-[#2d2e30] text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/70 text-sm">© 2025 VEGA. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
