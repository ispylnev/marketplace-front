# Быстрый старт: Интеграция регистрации продавца

## Что было создано

Я создал полную интеграцию между backend (SellerController) и frontend (RegisterStore.tsx) для регистрации продавцов.

## Созданные файлы

### Frontend (`/Users/ispylnev/IdeaProjects/vega-frontend/`)

1. **src/types/seller.ts** - TypeScript типы для работы с продавцами
2. **src/api/sellerService.ts** - API сервис для работы с продавцами
3. **src/components/ui/textarea.tsx** - UI компонент Textarea
4. **src/pages/SellerModeration.tsx** - Страница модерации продавцов (пример)

### Обновленные файлы

1. **src/pages/RegisterStore.tsx** - Форма регистрации магазина (интегрирована с backend)
2. **src/pages/SellerProfile.tsx** - Страница профиля продавца (использует новый API)

### Документация

1. **SELLER_INTEGRATION.md** - Подробная документация по интеграции
2. **QUICK_START.md** - Этот файл

## Как использовать

### 1. Регистрация продавца

Пользователь переходит на страницу `/register-store` и заполняет форму:

**Обязательные поля:**
- Тип организации (ИП, ООО, АО, Самозанятый)
- Название магазина
- Юридическое название
- ИНН
- Email

**Опциональные поля:**
- ОГРН
- Юридический адрес
- Телефон
- Описание магазина

После отправки формы:
- Данные отправляются на `POST /api/sellers/register`
- При успешной регистрации пользователь перенаправляется на профиль продавца
- Продавец получает статус `PENDING` и ожидает одобрения модератора

### 2. Просмотр профиля продавца

Страница `/seller/:sellerId` загружает и отображает информацию о продавце через API `GET /api/sellers/:sellerId`.

### 3. Модерация продавцов (для модераторов/админов)

Создана страница `SellerModeration.tsx` (пример использования API):
- Показывает список продавцов со статусом `PENDING`
- Позволяет одобрить или заблокировать продавца
- Требует прав модератора или администратора

## API Endpoints

Все endpoints находятся в backend проекте `SellerController.java`:

### Публичные
- `GET /api/sellers/:id` - информация о продавце
- `GET /api/sellers` - список одобренных продавцов

### Для авторизованных пользователей
- `POST /api/sellers/register` - регистрация продавца ✅
- `GET /api/sellers/me` - свой профиль
- `PUT /api/sellers/me` - обновить свой профиль
- `POST /api/sellers/me/logo` - загрузить логотип
- `DELETE /api/sellers/me/logo` - удалить логотип

### Для модераторов/админов
- `GET /api/sellers/pending` - список ожидающих одобрения
- `POST /api/sellers/:id/approve` - одобрить продавца
- `POST /api/sellers/:id/block` - заблокировать продавца
- `POST /api/sellers/:id/unblock` - разблокировать продавца

## Пример кода

### Регистрация продавца

```typescript
import { sellerService } from '../api/sellerService';
import { CompanyType } from '../types/seller';

const seller = await sellerService.registerSeller({
  shopName: 'Мой магазин',
  legalName: 'ООО "Мой магазин"',
  companyType: CompanyType.LLC,
  inn: '1234567890',
  contactEmail: 'info@myshop.ru',
});
```

### Получение своего профиля

```typescript
import { sellerService } from '../api/sellerService';

const myProfile = await sellerService.getMySellerProfile();
```

### Загрузка логотипа

```typescript
import { sellerService } from '../api/sellerService';

const seller = await sellerService.uploadLogo(file);
```

## Добавление роута в приложение

Если страница модерации нужна в приложении, добавьте роут в ваш роутер:

```typescript
import SellerModeration from './pages/SellerModeration';

// В вашем роутере:
<Route path="/admin/sellers/moderation" element={<SellerModeration />} />
```

## Аутентификация

Все защищенные endpoints требуют JWT токен. Токен автоматически добавляется к запросам через interceptor в `src/api/client.ts`.

Убедитесь, что пользователь авторизован перед доступом к защищенным endpoints.

## Что дальше?

1. **Тестирование**: Проверьте регистрацию продавца через форму
2. **Роутинг**: Добавьте роуты для новых страниц в ваш роутер
3. **Права доступа**: Настройте проверку прав для страницы модерации
4. **UI/UX**: Доработайте дизайн форм по вашему усмотрению

## Структура типов

```typescript
// Типы компаний
enum CompanyType {
  INDIVIDUAL_ENTREPRENEUR = 'ИП',
  LLC = 'ООО',
  JSC = 'АО',
  SELF_EMPLOYED = 'Самозанятый'
}

// Статусы продавца
enum SellerStatus {
  PENDING = 'Ожидает одобрения',
  APPROVED = 'Одобрен',
  BLOCKED = 'Заблокирован',
  SUSPENDED = 'Приостановлен'
}
```

## Обработка ошибок

Все методы API выбрасывают исключения при ошибках. Рекомендуется использовать try-catch:

```typescript
try {
  const seller = await sellerService.registerSeller(data);
  // успех
} catch (error) {
  const message = error.response?.data?.message || 'Ошибка регистрации';
  // показать ошибку пользователю
}
```

## Проблемы и решения

### Проблема: Ошибка 401 (Unauthorized)
**Решение**: Убедитесь, что пользователь авторизован и токен действителен.

### Проблема: Ошибка 403 (Forbidden)
**Решение**: У пользователя недостаточно прав. Для модерации нужна роль MODERATOR или ADMIN.

### Проблема: Ошибка 400 (Bad Request)
**Решение**: Проверьте валидность данных. Убедитесь, что:
- ИНН содержит 10 или 12 цифр
- ОГРН содержит 13 или 15 цифр
- Email в правильном формате
- Все обязательные поля заполнены

## Контакты

Если возникнут вопросы по интеграции, обратитесь к:
- **SELLER_INTEGRATION.md** - подробная документация
- **Backend**: `vega-api/src/main/java/com/vega/api/controller/SellerController.java`
- **Frontend types**: `src/types/seller.ts`
- **Frontend service**: `src/api/sellerService.ts`

