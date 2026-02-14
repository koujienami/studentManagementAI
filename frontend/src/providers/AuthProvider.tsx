import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthTokens, User } from '@/types';
import { AuthContext } from '@/contexts/AuthContext';
import {
  clearTokens,
  hasAccessToken,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth/token';
import apiClient from '@/lib/api/client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /** ユーザー情報を取得 */
  const fetchUser = useCallback(async () => {
    try {
      const response = await apiClient.get<User>('/auth/me');
      setUser(response.data);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  /** ログイン処理 */
  const login = useCallback(
    async (tokens: AuthTokens) => {
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      await fetchUser();
    },
    [fetchUser],
  );

  /** ログアウト処理 */
  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  /** 初期化: トークンがあればユーザー情報を取得 */
  useEffect(() => {
    const init = async () => {
      if (hasAccessToken()) {
        await fetchUser();
      }
      setIsLoading(false);
    };
    init();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
