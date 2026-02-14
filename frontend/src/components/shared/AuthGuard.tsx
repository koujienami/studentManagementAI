import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';

interface AuthGuardProps {
  /** 許可するロール（省略時は全ロール許可） */
  allowedRoles?: Role[];
}

/**
 * 認証ガードコンポーネント
 * - 未認証の場合はログイン画面にリダイレクト
 * - ロール制限がある場合はロールチェック
 */
export function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // 認証状態の読み込み中
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  // 未認証の場合はログイン画面へ
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ロール制限チェック
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
