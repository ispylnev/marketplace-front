import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, FileText, Phone, Mail, CheckCircle, MapPin, MessageSquare } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import logo from '../assets/9f8522ff5c46c241fe026950d295cfdf39fe881b.png';
import storeBg from '../assets/360f7c218f446eef35b2ee6d0108ba5e9ce5eb5d.png';
import { CompanyType, CompanyTypeLabels } from '../types/seller';
import { sellerService } from '../api/sellerService';

interface StoreRegistrationFormData {
  shopName: string;
  legalName: string;
  companyType: CompanyType;
  inn: string;
  ogrn: string;
  legalAddress: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
}

export default function RegisterStore() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<StoreRegistrationFormData>({
    shopName: '',
    legalName: '',
    companyType: CompanyType.LLC,
    inn: '',
    ogrn: '',
    legalAddress: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StoreRegistrationFormData, string>>>({});
  const [submitError, setSubmitError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateField = (field: keyof StoreRegistrationFormData, value: string | CompanyType): string => {
    switch (field) {
      case 'shopName':
        return !String(value).trim() ? 'Название магазина обязательно' : '';
      case 'legalName':
        return !String(value).trim() ? 'Юридическое название обязательно' : '';
      case 'companyType':
        return !value ? 'Тип юридического лица обязателен' : '';
      case 'inn':
        if (!String(value).trim()) return 'ИНН обязателен';
        if (!/^\d{10}$|^\d{12}$/.test(String(value))) return 'ИНН должен содержать 10 или 12 цифр';
        return '';
      case 'ogrn':
        // ОГРН опциональный
        if (String(value).trim() && !/^\d{13}$|^\d{15}$/.test(String(value))) {
          return 'ОГРН должен содержать 13 или 15 цифр';
        }
        return '';
      case 'legalAddress':
        // Опциональное поле
        return '';
      case 'contactEmail':
        if (!String(value).trim()) return 'Email обязателен';
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(String(value))) return 'Некорректный email';
        return '';
      case 'contactPhone':
        // Опциональное поле
        if (String(value).trim() && !/^\+?[0-9]{10,15}$/.test(String(value).replace(/[\s\-\(\)]/g, ''))) {
          return 'Некорректный формат телефона';
        }
        return '';
      case 'description':
        // Опциональное поле
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field: keyof StoreRegistrationFormData, value: string | CompanyType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);
    setLoading(true);
    setSubmitted(false);

    // Валидация всех полей
    const newErrors: Partial<Record<keyof StoreRegistrationFormData, string>> = {};
    Object.keys(formData).forEach(key => {
      const field = key as keyof StoreRegistrationFormData;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Регистрируем продавца через API
      const seller = await sellerService.registerSeller({
        shopName: formData.shopName,
        legalName: formData.legalName,
        companyType: formData.companyType,
        inn: formData.inn,
        ogrn: formData.ogrn || undefined,
        legalAddress: formData.legalAddress || undefined,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        description: formData.description || undefined,
      });
      
      console.log('Магазин успешно зарегистрирован:', seller);
      setSubmitted(true);
      
      // Перенаправляем на страницу профиля продавца через 2 секунды
      setTimeout(() => {
        // Перенаправляем на профиль зарегистрированного продавца
        navigate(`/seller/${seller.id}`);
      }, 2000);
    } catch (err: any) {
      setSubmitted(false);
      console.error('Ошибка регистрации магазина:', err);
      
      // Сохраняем объект ошибки для ErrorAlert
      setSubmitError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `url(${storeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: '#BCCEA9',
      }}
    >
      {/* Хедер */}
      <header className="py-6">
        <div className="container mx-auto px-4 flex justify-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src={logo} alt="VEGA" className="h-24" />
          </Link>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {/* Заголовок */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold text-[#2D2E30] mb-2">
                Регистрация магазина
              </h1>
              <p className="text-lg text-[#2D2E30]">
                Заполните все необходимые данные для регистрации вашего магазина
              </p>
            </div>

            <ErrorAlert
              error={submitError}
              title="Ошибка регистрации"
              className="mb-6"
              onClose={() => setSubmitError(null)}
              closable={true}
            />

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Тип организации */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-5 h-5 text-[#2B4A39]" />
                  <h2 className="text-xl font-semibold text-[#2D2E30]">Тип организации</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.values(CompanyType).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center justify-center cursor-pointer transition-all p-4 rounded-lg border-2 ${
                        formData.companyType === type
                          ? 'border-[#2B4A39] bg-[#BCCEA9] text-[#2B4A39]'
                          : 'border-[#BCCEA9] bg-transparent text-[#2D2E30] hover:border-[#2B4A39]'
                      }`}
                    >
                      <input
                        type="radio"
                        value={type}
                        checked={formData.companyType === type}
                        onChange={(e) => {
                          const newType = e.target.value as CompanyType;
                          handleChange('companyType', newType);
                        }}
                        className="sr-only"
                      />
                      <span className="font-medium">{CompanyTypeLabels[type]}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Основная информация */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-[#2B4A39]" />
                  <h2 className="text-xl font-semibold text-[#2D2E30]">Основная информация</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="shopName" className="text-[#2D2E30]">
                      Название магазина <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="shopName"
                      value={formData.shopName}
                      onChange={(e) => handleChange('shopName', e.target.value)}
                      placeholder="Введите название магазина"
                      className="mt-1 border-[#BCCEA9]"
                    />
                    {errors.shopName && (
                      <p className="text-red-600 text-sm mt-1">{errors.shopName}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="legalName" className="text-[#2D2E30]">
                      Юридическое название <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="legalName"
                      value={formData.legalName}
                      onChange={(e) => handleChange('legalName', e.target.value)}
                      placeholder="ООО 'Название компании'"
                      className="mt-1 border-[#BCCEA9]"
                    />
                    {errors.legalName && (
                      <p className="text-red-600 text-sm mt-1">{errors.legalName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="inn" className="text-[#2D2E30]">
                      ИНН <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="inn"
                      value={formData.inn}
                      onChange={(e) => handleChange('inn', e.target.value.replace(/\D/g, ''))}
                      placeholder="1234567890"
                      maxLength={12}
                      className="mt-1 border-[#BCCEA9]"
                    />
                    {errors.inn && (
                      <p className="text-red-600 text-sm mt-1">{errors.inn}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ogrn" className="text-[#2D2E30]">
                      ОГРН
                    </Label>
                    <Input
                      id="ogrn"
                      value={formData.ogrn}
                      onChange={(e) => handleChange('ogrn', e.target.value.replace(/\D/g, ''))}
                      placeholder="1234567890123"
                      maxLength={15}
                      className="mt-1 border-[#BCCEA9]"
                    />
                    {errors.ogrn && (
                      <p className="text-red-600 text-sm mt-1">{errors.ogrn}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="legalAddress" className="text-[#2D2E30]">
                      Юридический адрес
                    </Label>
                    <Input
                      id="legalAddress"
                      value={formData.legalAddress}
                      onChange={(e) => handleChange('legalAddress', e.target.value)}
                      placeholder="г. Москва, ул. Ленина, д. 1"
                      className="mt-1 border-[#BCCEA9]"
                    />
                    {errors.legalAddress && (
                      <p className="text-red-600 text-sm mt-1">{errors.legalAddress}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Контактные данные */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="w-5 h-5 text-[#2B4A39]" />
                  <h2 className="text-xl font-semibold text-[#2D2E30]">Контактные данные</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail" className="text-[#2D2E30]">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      placeholder="info@yourstore.ru"
                      className="mt-1 border-[#BCCEA9]"
                    />
                    {errors.contactEmail && (
                      <p className="text-red-600 text-sm mt-1">{errors.contactEmail}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactPhone" className="text-[#2D2E30]">
                      Телефон
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      placeholder="+79991234567"
                      className="mt-1 border-[#BCCEA9]"
                    />
                    {errors.contactPhone && (
                      <p className="text-red-600 text-sm mt-1">{errors.contactPhone}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Описание магазина */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-5 h-5 text-[#2B4A39]" />
                  <h2 className="text-xl font-semibold text-[#2D2E30]">Описание магазина</h2>
                </div>
                <div>
                  <Label htmlFor="description" className="text-[#2D2E30]">
                    Расскажите о вашем магазине
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Опишите ваш магазин, специализацию, преимущества..."
                    rows={4}
                    className="mt-1 border-[#BCCEA9] resize-none"
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                  )}
                </div>
              </section>

              {/* Кнопка отправки */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="!bg-[#2B4A39] hover:!bg-[#1f3329] !text-white px-8 py-3 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    'Отправка...'
                  ) : submitted ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Регистрация успешна!
                    </>
                  ) : (
                    'Зарегистрировать магазин'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

