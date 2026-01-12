import React, { useState } from 'react';
import { cn } from './ui/utils';

interface UserAvatarProps {
  /** URL кастомного аватара */
  avatarUrl?: string | null;
  /** Инициалы для fallback (напр. "ИП") */
  initials?: string;
  /** Цвет фона для fallback */
  backgroundColor?: string;
  /** Есть ли кастомный аватар */
  hasCustomAvatar?: boolean;
  /** Имя пользователя для alt */
  name?: string;
  /** Размер аватара */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Дополнительные классы */
  className?: string;
  /** Показывать ли border */
  bordered?: boolean;
  /** Дополнительные inline стили */
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
  '2xl': 'w-32 h-32 text-3xl',
};

/**
 * Генерирует инициалы из имени
 */
export function generateInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return '??';
}

/**
 * Компонент аватара пользователя с поддержкой fallback на инициалы
 */
export function UserAvatar({
  avatarUrl,
  initials = '??',
  backgroundColor = '#4F46E5',
  hasCustomAvatar = false,
  name = 'Пользователь',
  size = 'md',
  className,
  bordered = false,
  style,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Показываем изображение если есть URL и нет ошибки загрузки
  const showImage = avatarUrl && hasCustomAvatar && !imageError;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden flex-shrink-0',
        sizeClasses[size],
        bordered && 'border-4 border-white shadow-lg',
        className
      )}
      style={{
        backgroundColor: showImage && imageLoaded ? 'transparent' : backgroundColor,
        ...style,
      }}
    >
      {/* Инициалы (показываются как fallback или пока грузится изображение) */}
      {(!showImage || !imageLoaded) && (
        <span
          className="font-semibold text-white select-none"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          {initials}
        </span>
      )}

      {/* Изображение аватара */}
      {showImage && (
        <img
          src={avatarUrl}
          alt={name}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-200',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

export default UserAvatar;

