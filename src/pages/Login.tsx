import { useState } from 'react';
import { authApi, LoginRequest } from '../api/auth';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ErrorAlert } from '../components/ui/ErrorAlert';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Получаем redirect параметр из URL (например: /login?redirect=/admin)
  const redirectPath = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      console.log('✅ Успешный вход:', response.user);
      console.log('👥 User roles:', response.user.roles);
      console.log('🎯 Redirect path:', redirectPath);
      
      // Обновляем состояние авторизации
      console.log('📢 Dispatching auth-change event...');
      window.dispatchEvent(new Event('auth-change'));
      
      // Небольшая задержка для надежности (дать время событию обработаться)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Перенаправляем на страницу откуда пришли или на главную
      console.log('🚀 Navigating to:', redirectPath);
      navigate(redirectPath);
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 10 }}>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg" style={{ position: 'relative', zIndex: 20 }}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в аккаунт
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <ErrorAlert
            error={error}
            onClose={() => setError(null)}
            closable={true}
          />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ pointerEvents: loading ? 'none' : 'auto' }}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/register"
              className="font-medium text-green-600 hover:text-green-500"
            >
              Нет аккаунта? Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

