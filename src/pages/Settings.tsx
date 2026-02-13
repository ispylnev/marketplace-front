import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Camera, Upload, Trash2, Eye, EyeOff,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { userApi, UserProfileResponse, UpdateProfileRequest } from '../api/user';
import { UserAvatar, generateInitials } from '../components/UserAvatar';
import { useToast } from '../contexts/ToastContext';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const Settings = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userApi.getProfile();
      setProfile(data);
      setProfileForm({
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || '',
        phone: data.phone || '',
      });
    } catch {
      toast.error('Не удалось загрузить профиль');
      navigate('/profile/buyer');
    } finally {
      setLoading(false);
    }
  };

  // --- Profile ---

  const handleSaveProfile = async () => {
    if (!profileForm.firstName || !profileForm.lastName) {
      toast.error('Имя и фамилия обязательны');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await userApi.updateProfile(profileForm);
      setProfile(updated);
      toast.success('Профиль обновлён');
    } catch {
      toast.error('Не удалось сохранить профиль');
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Avatar ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Неподдерживаемый формат. Разрешены: JPEG, PNG, WebP');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Файл слишком большой. Максимум: ${MAX_FILE_SIZE_MB} МБ`);
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setAvatarPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const updated = await userApi.uploadAvatar(avatarFile);
      setProfile(updated);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Аватар обновлён');
    } catch {
      toast.error('Не удалось загрузить аватар');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.hasCustomAvatar) return;
    if (!confirm('Удалить текущий аватар?')) return;

    setUploadingAvatar(true);
    try {
      await userApi.deleteAvatar();
      const updated = await userApi.getProfile();
      setProfile(updated);
      toast.success('Аватар удалён');
    } catch {
      toast.error('Не удалось удалить аватар');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- Password ---

  const passwordError = (): string | null => {
    if (newPassword && newPassword.length < 6) return 'Минимум 6 символов';
    if (confirmPassword && newPassword !== confirmPassword) return 'Пароли не совпадают';
    return null;
  };

  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  const handleChangePassword = async () => {
    if (!canSubmitPassword) return;

    setSavingPassword(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Пароль успешно изменён');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Не удалось сменить пароль';
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  const initials = profile
    ? (profile.avatarInitials || generateInitials(profile.firstName, profile.lastName))
    : '';
  const bgColor = profile?.avatarBackgroundColor || '#4F46E5';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
          </div>

          <div className="space-y-6">
            {/* Section 1: Personal data */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Личные данные</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Превью"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <UserAvatar
                      avatarUrl={profile?.avatarUrl}
                      initials={initials}
                      backgroundColor={bgColor}
                      hasCustomAvatar={profile?.hasCustomAvatar ?? false}
                      name={profile?.fullName || ''}
                      size="xl"
                    />
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#2B4A39]" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex gap-2">
                  {avatarFile ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleUploadAvatar}
                        disabled={uploadingAvatar}
                        className="bg-[#2B4A39] hover:bg-[#234135] text-white gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingAvatar ? 'Загрузка...' : 'Сохранить'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                        disabled={uploadingAvatar}
                      >
                        Отмена
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Загрузить
                      </Button>
                      {profile?.hasCustomAvatar && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDeleteAvatar}
                          disabled={uploadingAvatar}
                          className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Удалить
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Profile fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder="Введите имя"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    placeholder="Введите фамилию"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="middleName">Отчество</Label>
                  <Input
                    id="middleName"
                    value={profileForm.middleName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, middleName: e.target.value })}
                    placeholder="Введите отчество"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+7 (999) 999-99-99"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !profileForm.firstName || !profileForm.lastName}
                  className="bg-[#2B4A39] hover:bg-[#234135] text-white"
                >
                  {savingProfile ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </div>

            {/* Section 2: Security */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Безопасность</h2>

              <div className="grid gap-4 max-w-md">
                <div className="grid gap-1.5">
                  <Label htmlFor="currentPassword">Текущий пароль</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Введите текущий пароль"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите новый пароль"
                  />
                  {passwordError() && (
                    <p className="text-sm text-red-600">{passwordError()}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !canSubmitPassword}
                  className="bg-[#2B4A39] hover:bg-[#234135] text-white"
                >
                  {savingPassword ? 'Сохранение...' : 'Сменить пароль'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
