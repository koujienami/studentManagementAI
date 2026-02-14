// ========================================
// 定数定義
// ========================================

/** API ベース URL */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** ローカルストレージキー */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/** ルートパス */
export const ROUTES = {
  // 公開画面
  APPLY: '/apply',
  APPLY_COMPLETE: '/apply/complete',
  HEARING: '/hearing/:token',
  HEARING_COMPLETE: '/hearing/complete',

  // 認証画面
  LOGIN: '/login',

  // 管理画面
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STUDENT_DETAIL: '/students/:id',
  STUDENT_EDIT: '/students/:id/edit',
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:id',
  COURSE_EDIT: '/courses/:id/edit',
  COURSE_NEW: '/courses/new',
  MAIL_TEMPLATES: '/mail-templates',
  MAIL_TEMPLATE_EDIT: '/mail-templates/:id/edit',
  MEMBERS: '/members',
  MEMBER_EDIT: '/members/:id/edit',
  MEMBER_NEW: '/members/new',
  PASSWORD_CHANGE: '/password',
} as const;

/** 受講生の状態ラベル */
export const STUDENT_STATUS_LABELS: Record<string, string> = {
  PROVISIONAL: '仮登録',
  PRE_HEARING: 'ヒアリング前',
  POST_HEARING: 'ヒアリング後',
  ENROLLED: '受講中',
  COMPLETED: '修了',
  WITHDRAWN: '退会',
} as const;

/** コースの状態ラベル */
export const COURSE_STATUS_LABELS: Record<string, string> = {
  RECRUITING: '募集中',
  ONGOING: '開講中',
  FULL: '満席',
  ENDED: '終了',
} as const;

/** 決済の状態ラベル */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: '未払い',
  PAID: '入金済み',
} as const;
