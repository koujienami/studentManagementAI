// ========================================
// 共通型定義
// ========================================

/** ユーザーロール */
export type Role = 'ADMIN' | 'STAFF' | 'INSTRUCTOR';

/** ログインユーザー情報 */
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: Role;
}

/** 認証トークン */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** API エラーレスポンス */
export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, string>;
}

/** ページネーション */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** 受講生の状態 */
export type StudentStatus =
  | 'PROVISIONAL'    // 仮登録
  | 'PRE_HEARING'    // ヒアリング前
  | 'POST_HEARING'   // ヒアリング後
  | 'ENROLLED'       // 受講中
  | 'COMPLETED'      // 修了
  | 'WITHDRAWN';     // 退会

/** コースの状態 */
export type CourseStatus =
  | 'RECRUITING'     // 募集中
  | 'ONGOING'        // 開講中
  | 'FULL'           // 満席
  | 'ENDED';         // 終了

/** 決済の状態 */
export type PaymentStatus =
  | 'UNPAID'         // 未払い
  | 'PAID';          // 入金済み
