import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ENROLLMENT_STATUS_LABELS } from '@/constants';
import { fetchCourses } from '@/lib/api/courses';
import { fetchEnrollments, type EnrollmentListParams } from '@/lib/api/enrollments';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { EnrollmentStatus } from '@/types';

const PAGE_SIZE = 20;
const EMPTY = '__ALL__';

const STATUS_OPTIONS: EnrollmentStatus[] = ['ENROLLED', 'COMPLETED', 'WITHDRAWN'];

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ja-JP');
}

export function EnrollmentListPage() {
  const [courseId, setCourseId] = useState<string>(EMPTY);
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');
  const [page, setPage] = useState(1);

  const filters: EnrollmentListParams = {
    courseId: courseId === EMPTY ? null : Number(courseId),
    status,
    page,
    size: PAGE_SIZE,
  };

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', filters],
    queryFn: () => fetchEnrollments(filters),
  });

  const coursesQuery = useQuery({
    queryKey: ['course-options'],
    queryFn: () => fetchCourses(),
  });

  const data = enrollmentsQuery.data;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">受講履歴</h2>
        <p className="text-muted-foreground">受講生とコースの紐付けを一覧します。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex min-w-[200px] flex-col gap-2">
            <span className="text-sm text-muted-foreground">コース</span>
            <Select
              value={courseId}
              onValueChange={(v) => {
                setCourseId(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY}>すべて</SelectItem>
                {(coursesQuery.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-[180px] flex-col gap-2">
            <span className="text-sm text-muted-foreground">受講状況</span>
            <Select
              value={status || EMPTY}
              onValueChange={(v) => {
                setStatus(v === EMPTY ? '' : (v as EnrollmentStatus));
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY}>すべて</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ENROLLMENT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>一覧</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollmentsQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : enrollmentsQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(enrollmentsQuery.error, '一覧の取得に失敗しました')}
            </p>
          ) : data && data.content.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>受講生</TableHead>
                    <TableHead>コース</TableHead>
                    <TableHead>開始日</TableHead>
                    <TableHead>終了日</TableHead>
                    <TableHead>状況</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link className="text-primary underline" to={`/students/${row.studentId}`}>
                          {row.studentName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link className="text-primary underline" to={`/courses/${row.courseId}`}>
                          {row.courseName}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(row.startDate)}</TableCell>
                      <TableCell>{formatDate(row.endDate)}</TableCell>
                      <TableCell>{ENROLLMENT_STATUS_LABELS[row.status]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {data.totalElements} 件中 {Math.min((page - 1) * PAGE_SIZE + 1, data.totalElements)}–
                  {Math.min(page * PAGE_SIZE, data.totalElements)} 件を表示
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    前へ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={totalPages === 0 || page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    次へ
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">該当する受講履歴はありません。</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
