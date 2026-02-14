import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';

// 公開画面
import { ApplyPage } from '@/pages/public/ApplyPage';
import { ApplyCompletePage } from '@/pages/public/ApplyCompletePage';
import { HearingPage } from '@/pages/public/HearingPage';
import { HearingCompletePage } from '@/pages/public/HearingCompletePage';

// 認証画面
import { LoginPage } from '@/pages/auth/LoginPage';

// 管理画面
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { StudentListPage } from '@/pages/admin/students/StudentListPage';
import { StudentDetailPage } from '@/pages/admin/students/StudentDetailPage';
import { StudentEditPage } from '@/pages/admin/students/StudentEditPage';
import { CourseListPage } from '@/pages/admin/courses/CourseListPage';
import { CourseDetailPage } from '@/pages/admin/courses/CourseDetailPage';
import { CourseEditPage } from '@/pages/admin/courses/CourseEditPage';
import { MailTemplateListPage } from '@/pages/admin/mail-templates/MailTemplateListPage';
import { MailTemplateEditPage } from '@/pages/admin/mail-templates/MailTemplateEditPage';
import { MemberListPage } from '@/pages/admin/members/MemberListPage';
import { MemberEditPage } from '@/pages/admin/members/MemberEditPage';
import { PasswordChangePage } from '@/pages/admin/PasswordChangePage';

// エラー画面
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ルートはダッシュボードへリダイレクト */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 公開画面（認証不要） */}
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/apply/complete" element={<ApplyCompletePage />} />
            <Route path="/hearing/:token" element={<HearingPage />} />
            <Route path="/hearing/complete" element={<HearingCompletePage />} />

            {/* 認証画面 */}
            <Route path="/login" element={<LoginPage />} />

            {/* 管理画面（認証必要） */}
            <Route element={<AuthGuard />}>
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* 受講生管理 */}
                <Route path="/students" element={<StudentListPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/students/:id/edit" element={<StudentEditPage />} />

                {/* コース管理 */}
                <Route path="/courses" element={<CourseListPage />} />
                <Route path="/courses/new" element={<CourseEditPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/courses/:id/edit" element={<CourseEditPage />} />

                {/* メールテンプレート管理（管理者のみ） */}
                <Route element={<AuthGuard allowedRoles={['ADMIN']} />}>
                  <Route path="/mail-templates" element={<MailTemplateListPage />} />
                  <Route path="/mail-templates/:id/edit" element={<MailTemplateEditPage />} />
                </Route>

                {/* 運営メンバー管理（管理者のみ） */}
                <Route element={<AuthGuard allowedRoles={['ADMIN']} />}>
                  <Route path="/members" element={<MemberListPage />} />
                  <Route path="/members/new" element={<MemberEditPage />} />
                  <Route path="/members/:id/edit" element={<MemberEditPage />} />
                </Route>

                {/* パスワード変更 */}
                <Route path="/password" element={<PasswordChangePage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
}
