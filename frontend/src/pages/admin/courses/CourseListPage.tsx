import { useState } from 'react';
import { Link } from 'react-router';
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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { deleteCourse, fetchCourses } from '@/lib/api/courses';
import { getApiErrorMessage } from '@/lib/api/errors';

export function CourseListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManageCourses = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [keywordInput, setKeywordInput] = useState('');
  const [filters, setFilters] = useState<{ keyword: string }>({ keyword: '' });
  const [actionError, setActionError] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<{ id: number; name: string } | null>(null);

  const coursesQuery = useQuery({
    queryKey: ['courses', filters],
    queryFn: () => fetchCourses(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: async () => {
      setActionError('');
      setCourseToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, 'コースの削除に失敗しました'));
    },
  });

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      keyword: keywordInput.trim(),
    });
  };

  const handleDelete = () => {
    if (!courseToDelete) {
      return;
    }

    deleteMutation.mutate(courseToDelete.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">コース一覧</h2>
          <p className="text-muted-foreground">コースの検索、詳細確認、登録・編集を行えます。</p>
        </div>
        {canManageCourses && (
          <Button asChild>
            <Link to="/courses/new">コースを登録</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
            <Input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="コース名・説明で検索"
            />
            <Button type="submit" disabled={coursesQuery.isFetching}>
              検索
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>コース一覧</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}

          {coursesQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : coursesQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(coursesQuery.error, 'コース一覧の取得に失敗しました')}
            </p>
          ) : coursesQuery.data && coursesQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コース名</TableHead>
                  <TableHead>料金</TableHead>
                  <TableHead>担当講師</TableHead>
                  <TableHead className="w-[180px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesQuery.data.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.price.toLocaleString()}円</TableCell>
                    <TableCell>{course.instructorName ?? '未設定'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/courses/${course.id}`}>詳細</Link>
                        </Button>
                        {canManageCourses && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/courses/${course.id}/edit`}>編集</Link>
                          </Button>
                        )}
                        {user?.role === 'ADMIN' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => setCourseToDelete({ id: course.id, name: course.name })}
                            disabled={deleteMutation.isPending}
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">条件に一致するコースはありません。</p>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>コースを削除しますか？</DialogTitle>
            <DialogDescription>
              {courseToDelete
                ? `「${courseToDelete.name}」を削除します。この操作は元に戻せません。`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseToDelete(null)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? '削除中...' : '削除する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
