import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Требуемая роль (пользователь должен иметь эту роль)
   */
  requiredRole?: UserRole;
  /**
   * Любая из этих ролей (пользователь должен иметь хотя бы одну)
   */
  requiredRoles?: UserRole[];
  /**
   * Только для авторизованных (без проверки ролей)
   */
  authOnly?: boolean;
  /**
   * URL для редиректа при отсутствии авторизации
   */
  redirectTo?: string;
  /**
   * URL для редиректа при отсутствии прав
   */
  forbiddenRedirectTo?: string;
}

/**
 * Компонент для защиты роутов
 *
 * @example
 * // Только для авторизованных
 * <ProtectedRoute authOnly>
 *   <Profile />
 * </ProtectedRoute>
 *
 * @example
 * // Только для админов
 * <ProtectedRoute requiredRole="ROLE_ADMIN">
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Для модераторов или админов
 * <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_MODERATOR']}>
 *   <ModerationPanel />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  authOnly = false,
  redirectTo = '/login',
  forbiddenRedirectTo = '/',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  // authOnly is used implicitly - if no requiredRole/requiredRoles, just need auth
  void authOnly;

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#2B4A39] mx-auto mb-4" />
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Не авторизован -> редирект на логин
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Проверяем права доступа
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={forbiddenRedirectTo} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to={forbiddenRedirectTo} replace />;
  }

  // Если authOnly - достаточно быть авторизованным
  // Если есть requiredRole/requiredRoles - уже проверили выше

  return <>{children}</>;
}

/**
 * Компонент для роутов только для гостей (неавторизованных)
 */
export function GuestRoute({
  children,
  redirectTo = '/',
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#2B4A39]" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Если пользователь пришёл с другой страницы - вернуть туда
    const from = (location.state as { from?: Location })?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
