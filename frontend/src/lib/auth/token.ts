import { STORAGE_KEYS } from '@/constants';

/**
 * JWT トークン管理ユーティリティ
 */

/** アクセストークンを保存 */
export function setAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
}

/** リフレッシュトークンを保存 */
export function setRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

/** アクセストークンを取得 */
export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/** リフレッシュトークンを取得 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/** トークンを全て削除 */
export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/** アクセストークンが存在するかチェック */
export function hasAccessToken(): boolean {
  return !!getAccessToken();
}

/**
 * JWT トークンのペイロードをデコード
 * ※ 署名検証はサーバー側で行うため、ここでは単純なデコードのみ
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = atob(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** トークンが期限切れかチェック */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  // 10秒のバッファを設ける
  return Date.now() >= (payload.exp * 1000 - 10000);
}
