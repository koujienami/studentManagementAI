import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { deleteCourse, fetchCourse } from '@/lib/api/courses';
import { getApiErrorMessage } from '@/lib/api/errors';

export function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManageCourses = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const canDeleteCourse = user?.role === 'ADMIN';

  const courseId = Number(id);
  const [actionError, setActionError] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
    enabled: Number.isFinite(courseId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCourse(courseId),
    onSuccess: async () => {
      setIsDeleteDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate('/courses');
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, 'コースの削除に失敗しました'));
    },
  });

  if (!Number.isFinite(courseId)) {
    return <Navigate to="/courses" replace />;
  }

  const course = courseQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">コース詳細</h2>
          <p className="text-muted-foreground">コース情報を確認します。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/courses">一覧へ戻る</Link>
          </Button>
          {canManageCourses && course && (
            <Button asChild>
              <Link to={`/courses/${course.id}/edit`}>編集</Link>
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {courseQuery.isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : courseQuery.isError ? (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(courseQuery.error, 'コース詳細の取得に失敗しました')}
        </p>
      ) : course ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{course.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">担当講師</p>
                <p>{course.instructorName ?? '未設定'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">料金</p>
                <p>{course.price.toLocaleString()}円</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-muted-foreground">説明</p>
                <p className="whitespace-pre-wrap">{course.description || '未入力'}</p>
              </div>
            </CardContent>
          </Card>

          {canDeleteCourse && (
            <Card>
              <CardHeader>
                <CardTitle>管理操作</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={deleteMutation.isPending}
                >
                  コースを削除
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">コースが見つかりません。</p>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>コースを削除しますか？</DialogTitle>
            <DialogDescription>
              {course ? `「${course.name}」を削除します。この操作は元に戻せません。` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? '削除中...' : '削除する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
