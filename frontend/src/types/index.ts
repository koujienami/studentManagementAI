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

/** 性別 */
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/** 決済の状態 */
export type PaymentStatus =
  | 'UNPAID'         // 未払い
  | 'PAID';          // 入金済み

/** 受講履歴の受講状況 */
export type EnrollmentStatus = 'ENROLLED' | 'COMPLETED' | 'WITHDRAWN';

/** 受講履歴（API 一覧・詳細） */
export interface EnrollmentListItem {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  startDate: string;
  endDate: string | null;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

/** 決済（API 一覧・詳細） */
export interface PaymentListItem {
  id: number;
  studentId: number;
  studentName: string;
  enrollmentId: number;
  courseId: number;
  courseName: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

/** 受講生一覧項目 */
export interface StudentListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: StudentStatus;
  referralSourceId: number;
  referralSourceName: string;
  courseNames: string | null;
  hasUnpaid: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 受講履歴サマリ */
export interface StudentEnrollmentSummary {
  id: number;
  courseId: number;
  courseName: string;
  startDate: string;
  endDate: string | null;
  status: 'ENROLLED' | 'COMPLETED' | 'WITHDRAWN';
}

/** 決済サマリ */
export interface StudentPaymentSummary {
  id: number;
  enrollmentId: number;
  courseName: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: PaymentStatus;
}

/** 受講生詳細 */
export interface StudentDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  birthdate: string | null;
  gender: Gender | null;
  status: StudentStatus;
  chatUsername: string | null;
  referralSourceId: number;
  referralSourceName: string;
  referralSourceCategory: string;
  createdAt: string;
  updatedAt: string;
  enrollments: StudentEnrollmentSummary[];
  payments: StudentPaymentSummary[];
}

/** 受講生登録・更新入力 */
export interface StudentInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  birthdate: string;
  gender: Gender | '';
  status: StudentStatus;
  chatUsername: string;
  referralSourceId: number | null;
}

/** コース */
export interface Course {
  id: number;
  name: string;
  description: string | null;
  price: number;
  instructorId: number | null;
  instructorName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** コース一覧項目 */
export interface CourseListItem {
  id: number;
  name: string;
  price: number;
  instructorId: number | null;
  instructorName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** コース登録・更新入力 */
export interface CourseInput {
  name: string;
  description: string;
  price: number;
  instructorId: number | null;
}

/** 講師選択肢 */
export interface UserOption {
  id: number;
  name: string;
  username: string;
}

/** 申込経路選択肢 */
export interface ReferralSourceOption {
  id: number;
  name: string;
  category: string;
}

/** 公開申込フォーム用コース */
export interface ApplyCourse {
  id: number;
  name: string;
  description: string | null;
  price: number;
}

/** 公開申込送信ペイロード */
export interface ApplyInput {
  name: string;
  email: string;
  phone: string;
  courseId: number;
  referralSourceId: number;
}

/** 公開申込 API レスポンス（内部 ID は含まない） */
export interface ApplyResult {
  courseName: string;
  amount: number;
  paymentDueDate: string;
}

/** 申込完了画面へ渡す状態（API レスポンスと同一形状） */
export type ApplyCompleteState = ApplyResult;
