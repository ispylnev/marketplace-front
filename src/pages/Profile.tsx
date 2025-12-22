import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface UserInfo {
  id: number;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  roles: string[];
}

// Этот компонент перенаправляет на правильный профиль в зависимости от роли пользователя
const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.get('/api/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // Перенаправляем на соответствующий профиль
  useEffect(() => {
    if (user && !loading) {
      const isSeller = user.roles && user.roles.includes('SELLER');
      if (isSeller) {
        navigate('/profile/seller', { replace: true });
      } else {
        navigate('/profile/buyer', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // Показываем загрузку во время перенаправления
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Перенаправление...</p>
      </div>
    </div>
  );
};

export default Profile;
