import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

/**
 * 認証情報にアクセスするカスタムフック
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth は AuthProvider 内で使用してください');
  }
  return context;
}
