import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, MessageCircle, Package, MessageSquare, Heart, Users,
  Settings, FileText, LogOut, Flag, Edit, Camera, Trash2, Upload,
  Store, Clock, AlertCircle, CheckCircle, XCircle
} from "lucide-react";
import ReportDialog from "../components/ReportDialog";
import { ProfileMenuItem } from "../components/ProfileMenuItem";
import { PlantCollection } from "../components/PlantCollection";
import Header from "../components/Header";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import api, { tokenManager } from '../api/client';
import { userApi, UserProfileResponse } from '../api/user';
import { sellerService } from '../api/sellerService';
import { SellerResponse, SellerStatus } from '../types/seller';
import { UserAvatar, generateInitials } from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import avatarBackground from '../assets/4068108bae8ada353e34675c0c754fb530d30e98.png';

interface UserInfo {
  id: number;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  roles: string[];
  avatarUrl?: string;
  avatarInitials?: string;
  avatarBackgroundColor?: string;
  hasCustomAvatar?: boolean;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const BuyerProfile = () => {
  const navigate = useNavigate();
  const { isSeller, refreshAuth } = useAuth();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [_sellerId, setSellerId] = useState<number | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSellerStatus, setLoadingSellerStatus] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileData>({});
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Загружаем базовую инфо о пользователе
      const userResponse = await api.get<UserInfo>('/api/users/me');
      setUser(userResponse.data);
      
      // Загружаем полный профиль с аватаром
      try {
        const profileData = await userApi.getProfile();
        setProfile(profileData);
        setEditForm({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          middleName: profileData.middleName || '',
          phone: profileData.phone || ''
        });
      } catch {
        // Если профиля нет, используем данные из user
        setEditForm({
          firstName: userResponse.data.firstName,
          lastName: userResponse.data.lastName,
          middleName: userResponse.data.middleName || '',
          phone: userResponse.data.phone || ''
        });
      }

      // Загружаем информацию о продавце (заявка может быть в любом статусе)
      setLoadingSellerStatus(true);
      try {
        const sellerData = await sellerService.getMySellerProfile();
        setSellerProfile(sellerData);
        setSellerId(sellerData.id);
        // Если продавец одобрен, но роль SELLER ещё не в кеше — обновляем
        if (sellerData.status === SellerStatus.APPROVED && !isSeller) {
          await refreshAuth();
        }
      } catch (error: any) {
        // 404 = пользователь еще не подавал заявку на продавца
        if (error.response?.status !== 404) {
          console.error('Ошибка загрузки данных продавца:', error);
        }
      } finally {
        setLoadingSellerStatus(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const profileData = await userApi.updateProfile(editForm);
      setProfile(profileData);
      // Обновляем также локальные данные user
      setUser(prev => prev ? {
        ...prev,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        middleName: profileData.middleName,
        phone: profileData.phone
      } : null);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      alert('Не удалось обновить профиль');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
    setAvatarDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Валидация типа файла
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setAvatarError(`Неподдерживаемый формат. Разрешены: JPEG, PNG, WebP`);
      return;
    }

    // Валидация размера
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAvatarError(`Файл слишком большой. Максимум: ${MAX_FILE_SIZE_MB} МБ`);
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);

    // Создаём превью
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    
    setUploadingAvatar(true);
    try {
      const updatedProfile = await userApi.uploadAvatar(avatarFile);
      setProfile(updatedProfile);
      setAvatarDialogOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: unknown) {
      console.error('Ошибка загрузки аватара:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setAvatarError(`Не удалось загрузить аватар: ${errorMessage}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.hasCustomAvatar) return;
    
    if (!confirm('Удалить текущий аватар? Будет использован аватар по умолчанию.')) {
      return;
    }

    setUploadingAvatar(true);
    try {
      await userApi.deleteAvatar();
      // Перезагружаем профиль для получения дефолтного аватара
      const updatedProfile = await userApi.getProfile();
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Ошибка удаления аватара:', error);
      alert('Не удалось удалить аватар');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResubmitSellerApplication = async () => {
    try {
      setLoadingSellerStatus(true);
      await sellerService.resubmitMySellerApplication();
      // Перезагружаем профиль продавца
      const profile = await sellerService.getMySellerProfile();
      setSellerProfile(profile);
      setSellerId(profile.id);
    } catch (error) {
      console.error('Ошибка повторной подачи заявки:', error);
      alert('Не удалось повторно подать заявку. Попробуйте позже.');
    } finally {
      setLoadingSellerStatus(false);
    }
  };

  const handleLogout = () => {
    tokenManager.clearToken();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B4A39] mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Используем данные профиля если есть, иначе из user
  const displayName = profile?.fullName || `${user.firstName} ${user.lastName}`;
  const initials = profile?.avatarInitials || generateInitials(user.firstName, user.lastName, user.email);
  const backgroundColor = profile?.avatarBackgroundColor || '#4F46E5';
  const avatarUrl = profile?.avatarUrl || user.avatarUrl;
  const hasCustomAvatar = profile?.hasCustomAvatar ?? !!user.avatarUrl;

  const userProfile = {
    name: displayName,
    rating: sellerProfile?.rating || 0,
    reviewsCount: sellerProfile?.reviewCount || 0
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="min-h-screen bg-white py-2 md:py-5">
        <div className="max-w-7xl mx-auto flex gap-5 items-start justify-center px-2 md:px-5">
          {/* Профиль */}
          <div className="w-full lg:max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden lg:pb-0 flex-shrink-0">
            {/* Шапка профиля */}
            <div 
              className="px-3 py-3 bg-cover bg-center relative"
              style={{ 
                backgroundImage: `url(${avatarBackground})`,
                padding: 'max(0.75rem, 0.78vw) max(0.75rem, 1.04vw)'
              }}
            >
              {/* Кнопка редактирования профиля */}
              <button
                onClick={handleEditProfile}
                className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-2 text-white transition-colors border border-white/30"
              >
                <Edit className="w-4 h-4" />
              </button>

              {/* Мобильная версия */}
              <div className="md:hidden flex flex-col items-center text-center">
                {/* Фото */}
                <div className="relative flex-shrink-0 mb-3">
                  <UserAvatar
                    avatarUrl={avatarUrl}
                    initials={initials}
                    backgroundColor={backgroundColor}
                    hasCustomAvatar={hasCustomAvatar}
                    name={displayName}
                    size="xl"
                    bordered
                  />
                  <button
                    onClick={handleChangeAvatar}
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-[#2B4A39]" />
                  </button>
                </div>
                
                {/* Никнейм */}
                <h1 className="text-white font-bold leading-tight text-lg mb-2">{userProfile.name}</h1>
                
                {/* Email */}
                <div className="text-[#BCCEA9] text-sm mb-3">
                  {user.email}
                </div>

                {/* Рейтинг — только для продавцов */}
                {isSeller && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            fill={i < Math.floor(userProfile.rating) ? "#eab308" : "rgba(255,255,255,0.4)"}
                            className={`w-4 h-4 ${
                              i < Math.floor(userProfile.rating)
                                ? "text-yellow-500"
                                : "text-white opacity-40"
                            }`}
                            style={
                              i < Math.floor(userProfile.rating)
                                ? {
                                    filter: "drop-shadow(0 2px 4px rgba(234,179,8,0.6)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
                                  }
                                : undefined
                            }
                          />
                        ))}
                      </div>
                      <span className="text-white font-bold text-sm">{userProfile.rating}</span>
                    </div>

                    <div className="text-[#BCCEA9] text-sm mb-3">
                      {userProfile.reviewsCount} отзывов
                    </div>
                  </>
                )}

              </div>

              {/* Десктопная версия */}
              <div className="hidden md:flex items-start" style={{ gap: 'max(0.75rem, 1.04vw)' }}>
                {/* Фото */}
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    avatarUrl={avatarUrl}
                    initials={initials}
                    backgroundColor={backgroundColor}
                    hasCustomAvatar={hasCustomAvatar}
                    name={displayName}
                    size="2xl"
                    bordered
                    className="!border-4"
                    style={{
                      width: 'clamp(8rem, 8rem + 3.66vw, 22.4rem)',
                      height: 'clamp(8rem, 8rem + 3.66vw, 22.4rem)'
                    }}
                  />
                  <button
                    onClick={handleChangeAvatar}
                    className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-[#2B4A39]" />
                  </button>
                </div>
                
                {/* Никнейм, статус и рейтинг */}
                <div className="flex flex-col justify-center flex-1 pt-1">
                  <h1 className="text-white text-lg md:font-bold leading-tight" style={{ fontSize: 'max(1.125rem, 2.08vw)' }}>
                    {userProfile.name}
                  </h1>
                  
                  {/* Email */}
                  <div className="text-[#BCCEA9] mb-2" style={{ fontSize: 'max(0.875rem, 0.94vw)' }}>
                    {user.email}
                  </div>


                  {/* Рейтинг — только для продавцов */}
                  {isSeller && (
                    <div className="flex items-center mb-2 md:mb-4" style={{ gap: 'max(0.25rem, 0.52vw)', marginBottom: 'max(0.5rem, 1.25vw)' }}>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            fill={i < Math.floor(userProfile.rating) ? "#eab308" : "rgba(255,255,255,0.4)"}
                            className={`w-4 h-4 ${
                              i < Math.floor(userProfile.rating)
                                ? "text-yellow-500"
                                : "text-white opacity-40"
                            }`}
                            style={
                              i < Math.floor(userProfile.rating)
                                ? {
                                    filter: "drop-shadow(0 2px 4px rgba(234,179,8,0.6)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                                    width: 'max(1rem, 1.67vw)',
                                    height: 'max(1rem, 1.67vw)'
                                  }
                                : {
                                    width: 'max(1rem, 1.67vw)',
                                    height: 'max(1rem, 1.67vw)'
                                  }
                            }
                          />
                        ))}
                      </div>
                      <span className="text-white font-bold" style={{ fontSize: 'max(0.875rem, 1.04vw)' }}>{userProfile.rating}</span>
                      <span className="text-[#BCCEA9]" style={{ fontSize: 'max(0.75rem, 0.94vw)' }}>• {userProfile.reviewsCount} отзывов</span>
                    </div>
                  )}
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
              <ProfileMenuItem icon={Package} label="Мои заказы" onClick={() => navigate('/orders')} />
              <ProfileMenuItem icon={MessageSquare} label="Мои отзывы" onClick={() => navigate('/my-reviews')} />
              <ProfileMenuItem icon={Heart} label="Избранное" />
              <ProfileMenuItem icon={Users} label="Подписки" />
            </div>

            <Separator />

            {/* Настройки и дополнительно */}
            <div className="py-2">
              <ProfileMenuItem icon={Settings} label="Настройки" onClick={() => navigate('/settings')} />

              {/* Умная кнопка "Стать продавцом" с разными состояниями */}
              {!sellerProfile && !loadingSellerStatus && (
                // Нет заявки - показываем активную кнопку
                <ProfileMenuItem
                  icon={Store}
                  label="Стать продавцом"
                  onClick={() => navigate('/register-store')}
                  variant="success"
                />
              )}

              {loadingSellerStatus && (
                // Загрузка статуса
                <ProfileMenuItem
                  icon={Clock}
                  label="Загрузка..."
                  disabled
                />
              )}

              {sellerProfile?.status === SellerStatus.PENDING && (
                // Заявка на рассмотрении
                <div>
                  <ProfileMenuItem
                    icon={Clock}
                    label="Заявка на рассмотрении"
                    disabled
                    variant="warning"
                  />
                  <p className="px-12 py-1 text-xs text-gray-500">
                    Ваша заявка проверяется модератором. Обычно это занимает 1-2 рабочих дня.
                  </p>
                </div>
              )}

              {sellerProfile?.status === SellerStatus.REJECTED && (
                // Заявка отклонена - можно исправить и отправить снова
                <div>
                  <ProfileMenuItem
                    icon={XCircle}
                    label="Заявка отклонена"
                    disabled
                    variant="danger"
                  />
                  {sellerProfile.blockReason && (
                    <div className="px-12 py-2 space-y-2">
                      <p className="text-xs text-red-600">
                        <strong>Причина:</strong> {sellerProfile.blockReason}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => navigate('/register-store')}
                        className="bg-[#2B4A39] hover:bg-[#1f3529] text-white text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Исправить данные
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleResubmitSellerApplication}
                        disabled={loadingSellerStatus}
                        variant="outline"
                        className="ml-2 border-[#2B4A39] text-[#2B4A39] hover:bg-[#2B4A39]/10 text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {loadingSellerStatus ? 'Отправка...' : 'Отправить снова'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {sellerProfile?.status === SellerStatus.APPROVED && (
                // Одобрен - показываем панель управления
                <ProfileMenuItem
                  icon={Store}
                  label="Мой магазин"
                  onClick={() => navigate('/seller/admin')}
                  variant="success"
                />
              )}

              {sellerProfile?.status === SellerStatus.BLOCKED && (
                // Заблокирован - показываем причину
                <div>
                  <ProfileMenuItem
                    icon={XCircle}
                    label="Магазин заблокирован"
                    disabled
                    variant="danger"
                  />
                  {sellerProfile.blockReason && (
                    <p className="px-12 py-1 text-xs text-red-600">
                      Причина: {sellerProfile.blockReason}
                    </p>
                  )}
                </div>
              )}

              {sellerProfile?.status === SellerStatus.SUSPENDED && (
                // Приостановлен
                <div>
                  <ProfileMenuItem
                    icon={AlertCircle}
                    label="Магазин приостановлен"
                    disabled
                  />
                  <p className="px-12 py-1 text-xs text-gray-500">
                    Ваш магазин временно приостановлен. Свяжитесь с поддержкой для уточнения деталей.
                  </p>
                </div>
              )}
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
                onClick={() => setReportDialogOpen(true)}
              />
            </div>
          </div>

          {/* Коллекция - только на десктопе */}
          <div className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
            <PlantCollection />
          </div>
        </div>
      </div>

      {/* Диалог редактирования профиля */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
            <DialogDescription>
              Обновите информацию о вашем профиле
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Имя *</Label>
              <Input
                id="firstName"
                value={editForm.firstName || ''}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                placeholder="Введите имя"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="lastName">Фамилия *</Label>
              <Input
                id="lastName"
                value={editForm.lastName || ''}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                placeholder="Введите фамилию"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="middleName">Отчество</Label>
              <Input
                id="middleName"
                value={editForm.middleName || ''}
                onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
                placeholder="Введите отчество"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+7 (999) 999-99-99"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving || !editForm.firstName || !editForm.lastName}
              className="bg-[#2B4A39] hover:bg-[#234135] text-white"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог изменения аватара */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить аватар</DialogTitle>
            <DialogDescription>
              Загрузите изображение для вашего профиля (JPEG, PNG или WebP, до {MAX_FILE_SIZE_MB} МБ)
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Скрытый input для файла */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Текущий/превью аватар */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Превью"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <UserAvatar
                    avatarUrl={avatarUrl}
                    initials={initials}
                    backgroundColor={backgroundColor}
                    hasCustomAvatar={hasCustomAvatar}
                    name={displayName}
                    size="2xl"
                    bordered
                  />
                )}
              </div>

              {/* Кнопки выбора файла */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  disabled={uploadingAvatar}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Выбрать файл
                </Button>
                
                {hasCustomAvatar && !avatarPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </Button>
                )}
              </div>

              {avatarFile && (
                <p className="text-sm text-gray-500">
                  Выбран: {avatarFile.name}
                </p>
              )}
              
              {avatarError && (
                <p className="text-sm text-red-600">
                  {avatarError}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAvatarDialogOpen(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                setAvatarError(null);
              }}
              disabled={uploadingAvatar}
            >
              Отмена
            </Button>
            <Button
              onClick={handleUploadAvatar}
              disabled={uploadingAvatar || !avatarFile}
              className="bg-[#2B4A39] hover:bg-[#234135] text-white gap-2"
            >
              {uploadingAvatar ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Загрузка...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог жалобы */}
      <ReportDialog
        entityType="USER"
        entityId={user.id}
        entityName={displayName}
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
    </div>
  );
};

export default BuyerProfile;
