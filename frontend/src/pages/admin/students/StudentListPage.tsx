import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StudentStatusBadge } from '@/components/shared/StudentStatusBadge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { fetchCourses } from '@/lib/api/courses';
import { getApiErrorMessage } from '@/lib/api/errors';
import { fetchReferralSourceOptions } from '@/lib/api/masterData';
import { deleteStudent, fetchStudents, type StudentListParams } from '@/lib/api/students';
import type { StudentStatus } from '@/types';

const EMPTY_VALUE = '__ALL__';
const UNPAID_FILTER_OPTIONS: Array<{ value: 'all' | 'true' | 'false'; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'true', label: '未払いあり' },
  { value: 'false', label: '未払いなし' },
];

const STUDENT_STATUSES: StudentStatus[] = [
  'PROVISIONAL',
  'PRE_HEARING',
  'POST_HEARING',
  'ENROLLED',
  'COMPLETED',
  'WITHDRAWN',
];

interface StudentSearchFormState {
  keyword: string;
  status: StudentStatus | '';
  referralSourceId: string;
  hasUnpaid: 'all' | 'true' | 'false';
  courseId: string;
}

const initialSearchForm: StudentSearchFormState = {
  keyword: '',
  status: '',
  referralSourceId: EMPTY_VALUE,
  hasUnpaid: 'all',
  courseId: EMPTY_VALUE,
};

function toQueryFilters(form: StudentSearchFormState): StudentListParams {
  return {
    keyword: form.keyword.trim() || undefined,
    status: form.status || undefined,
    referralSourceId: form.referralSourceId === EMPTY_VALUE ? null : Number(form.referralSourceId),
    hasUnpaid: form.hasUnpaid === 'all' ? null : form.hasUnpaid === 'true',
    courseId: form.courseId === EMPTY_VALUE ? null : Number(form.courseId),
  };
}

export function StudentListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManageStudents = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const canDeleteStudents = user?.role === 'ADMIN';

  const [searchForm, setSearchForm] = useState<StudentSearchFormState>(initialSearchForm);
  const [filters, setFilters] = useState<StudentListParams>({});
  const [actionError, setActionError] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<{ id: number; name: string } | null>(null);

  const studentsQuery = useQuery({
    queryKey: ['students', filters],
    queryFn: () => fetchStudents(filters),
  });

  const referralSourceQuery = useQuery({
    queryKey: ['referral-source-options'],
    queryFn: fetchReferralSourceOptions,
  });

  const courseOptionsQuery = useQuery({
    queryKey: ['course-options'],
    queryFn: () => fetchCourses(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: async () => {
      setActionError('');
      setStudentToDelete(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['student'] }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '受講生の削除に失敗しました'));
    },
  });

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters(toQueryFilters(searchForm));
  };

  const handleDelete = () => {
    if (!studentToDelete) {
      return;
    }

    deleteMutation.mutate(studentToDelete.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">受講生一覧</h2>
          <p className="text-muted-foreground">受講生の検索、詳細確認、登録・編集を行えます。</p>
        </div>
        {canManageStudents && (
          <Button asChild>
            <Link to="/students/new">受講生を登録</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleSearch}>
            <Input
              value={searchForm.keyword}
              onChange={(event) => setSearchForm((prev) => ({ ...prev, keyword: event.target.value }))}
              placeholder="氏名・メール・電話番号で検索"
            />
            <Select
              value={searchForm.status || EMPTY_VALUE}
              onValueChange={(value) =>
                setSearchForm((prev) => ({
                  ...prev,
                  status: value === EMPTY_VALUE ? '' : (value as StudentStatus),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="状態を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_VALUE}>すべての状態</SelectItem>
                {STUDENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <StudentStatusBadge status={status} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchForm.referralSourceId}
              onValueChange={(value) => setSearchForm((prev) => ({ ...prev, referralSourceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="申込経路を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_VALUE}>すべての申込経路</SelectItem>
                {(referralSourceQuery.data ?? []).map((source) => (
                  <SelectItem key={source.id} value={String(source.id)}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchForm.hasUnpaid}
              onValueChange={(value) =>
                setSearchForm((prev) => ({ ...prev, hasUnpaid: value as 'all' | 'true' | 'false' }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="未払い条件を選択" />
              </SelectTrigger>
              <SelectContent>
                {UNPAID_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] xl:grid-cols-[1fr_auto]">
              <Select
                value={searchForm.courseId}
                onValueChange={(value) => setSearchForm((prev) => ({ ...prev, courseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="コースを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>すべてのコース</SelectItem>
                  {(courseOptionsQuery.data ?? []).map((course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={studentsQuery.isFetching}>
                検索
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>受講生一覧</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}

          {studentsQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : studentsQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(studentsQuery.error, '受講生一覧の取得に失敗しました')}
            </p>
          ) : studentsQuery.data && studentsQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>申込経路</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>受講コース</TableHead>
                  <TableHead>未払い</TableHead>
                  <TableHead className="w-[180px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsQuery.data.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.referralSourceName}</TableCell>
                    <TableCell>
                      <StudentStatusBadge status={student.status} />
                    </TableCell>
                    <TableCell>{student.courseNames ?? '未登録'}</TableCell>
                    <TableCell>{student.hasUnpaid ? 'あり' : 'なし'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/students/${student.id}`}>詳細</Link>
                        </Button>
                        {canManageStudents && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/students/${student.id}/edit`}>編集</Link>
                          </Button>
                        )}
                        {canDeleteStudents && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => setStudentToDelete({ id: student.id, name: student.name })}
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
            <p className="text-muted-foreground">条件に一致する受講生はありません。</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>受講生を削除しますか？</DialogTitle>
            <DialogDescription>
              {studentToDelete
                ? `「${studentToDelete.name}」を削除します。関連データがある場合は削除できません。`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentToDelete(null)}>
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
