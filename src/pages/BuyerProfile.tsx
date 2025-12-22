import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageCircle, Package, MessageSquare, Heart, Users, Settings, FileText, LogOut, Flag } from "lucide-react";
import { ProfileMenuItem } from "../components/ProfileMenuItem";
import { PlantCollection } from "../components/PlantCollection";
import Header from "../components/Header";
import { Separator } from "../components/ui/separator";
import api, { tokenManager } from '../api/client';
import profileAvatar from '../assets/a634557b5bed81db3f58ede7a007e37cd204cd27.png';
import avatarBackground from '../assets/4068108bae8ada353e34675c0c754fb530d30e98.png';

interface UserInfo {
  id: number;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  roles: string[];
}

const BuyerProfile = () => {
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

  const handleLogout = () => {
    tokenManager.clearToken();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

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

  if (!user) {
    return null;
  }

  const userProfile = {
    name: `${user.firstName} ${user.lastName}`,
    avatar: profileAvatar,
    rating: 4.8,
    reviewsCount: 24,
    status: "Коллекционирую ирисы 🌸"
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="min-h-screen bg-white py-5">
        <div className="max-w-6xl mx-auto flex gap-5 px-5 items-start">
          {/* Профиль */}
          <div className="w-full lg:max-w-md bg-white shadow-lg rounded-2xl overflow-hidden lg:pb-0 flex-shrink-0">
            {/* Шапка профиля */}
            <div 
              className="px-3 md:px-4 py-3 md:py-4 bg-cover bg-center"
              style={{ backgroundImage: `url(${avatarBackground})` }}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {/* Фото */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={userProfile.avatar} 
                    alt={userProfile.name}
                    className="w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                </div>
                
                {/* Никнейм, статус и рейтинг */}
                <div className="flex flex-col justify-center flex-1 pt-1 md:pt-2">
                  <h1 className="text-white text-xl md:text-2xl font-bold">{userProfile.name}</h1>
                  
                  {/* Статус */}
                  {userProfile.status && (
                    <div className="mt-2 md:mt-3 mb-3 md:mb-4 bg-white/20 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-white/30">
                      <p className="text-white text-xs md:text-sm">
                        {userProfile.status}
                      </p>
                    </div>
                  )}
                  
                  {/* Рейтинг */}
                  <div className="flex items-center gap-1 md:gap-2">
                    <div className="flex items-center gap-0.5 md:gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          fill={i < Math.floor(userProfile.rating) ? "#eab308" : "rgba(255,255,255,0.4)"}
                          className={`w-5 h-5 md:w-7 md:h-7 ${
                            i < Math.floor(userProfile.rating)
                              ? "text-yellow-500"
                              : "text-white opacity-40"
                          }`}
                          style={
                            i < Math.floor(userProfile.rating)
                              ? { filter: "drop-shadow(0 2px 4px rgba(234,179,8,0.6)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                    <span className="text-white text-base md:text-lg font-bold">{userProfile.rating}</span>
                    <span className="text-[#BCCEA9] text-sm md:text-base font-semibold">({userProfile.reviewsCount})</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Коллекция - только на мобильных, сразу после шапки */}
            <div className="lg:hidden">
              <div className="p-4">
                <PlantCollection />
              </div>
              <Separator />
            </div>

            {/* Основное меню */}
            <div className="py-2">
              <ProfileMenuItem icon={MessageCircle} label="Сообщения" />
              <ProfileMenuItem icon={Package} label="История заказов" />
              <ProfileMenuItem icon={MessageSquare} label="Мои отзывы" />
              <ProfileMenuItem icon={Heart} label="Избранное" />
              <ProfileMenuItem icon={Users} label="Подписки" />
            </div>

            <Separator />

            {/* Настройки и дополнительно */}
            <div className="py-2">
              <ProfileMenuItem icon={Settings} label="Настройки" />
              <ProfileMenuItem icon={FileText} label="Оферта" />
              <ProfileMenuItem icon={LogOut} label="Выход" onClick={handleLogout} />
            </div>

            <Separator />

            {/* Пожаловаться на профиль */}
            <div className="py-2 pb-0">
              <ProfileMenuItem 
                icon={Flag} 
                label="Пожаловаться на профиль" 
                variant="danger"
              />
            </div>
          </div>

          {/* Коллекция - только на десктопе */}
          <div className="hidden lg:block lg:flex-1">
            <PlantCollection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerProfile;

