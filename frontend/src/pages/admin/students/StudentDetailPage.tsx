import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentStatusBadge } from '@/components/shared/PaymentStatusBadge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { deleteStudent, fetchStudent, updateStudentStatus } from '@/lib/api/students';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { StudentStatus } from '@/types';

const STATUS_TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  PROVISIONAL: ['PRE_HEARING', 'WITHDRAWN'],
  PRE_HEARING: ['POST_HEARING', 'WITHDRAWN'],
  POST_HEARING: ['ENROLLED', 'WITHDRAWN'],
  ENROLLED: ['COMPLETED', 'WITHDRAWN'],
  COMPLETED: [],
  WITHDRAWN: [],
};

function formatDate(value: string | null) {
  if (!value) {
    return '未設定';
  }

  return new Date(value).toLocaleDateString('ja-JP');
}

export function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManageStudents = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const canDeleteStudents = user?.role === 'ADMIN';

  const studentId = Number(id);
  const [actionError, setActionError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus | ''>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const studentQuery = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchStudent(studentId),
    enabled: Number.isFinite(studentId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: StudentStatus) => updateStudentStatus(studentId, status),
    onSuccess: async () => {
      setActionError('');
      setSelectedStatus('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['student', studentId] }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '受講生状態の更新に失敗しました'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStudent(studentId),
    onSuccess: async () => {
      setIsDeleteDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/students');
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '受講生の削除に失敗しました'));
    },
  });

  const student = studentQuery.data;
  const availableTransitions = useMemo(
    () => (student ? STATUS_TRANSITIONS[student.status] : []),
    [student]
  );

  if (!Number.isFinite(studentId)) {
    return <Navigate to="/students" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">受講生詳細</h2>
          <p className="text-muted-foreground">受講生の基本情報と関連サマリを確認します。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/students">一覧へ戻る</Link>
          </Button>
          {canManageStudents && student && (
            <Button asChild>
              <Link to={`/students/${student.id}/edit`}>編集</Link>
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {studentQuery.isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : studentQuery.isError ? (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(studentQuery.error, '受講生詳細の取得に失敗しました')}
        </p>
      ) : student ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{student.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">状態</p>
                <StudentStatusBadge status={student.status} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">申込経路</p>
                <p>{student.referralSourceName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">メールアドレス</p>
                <p>{student.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">電話番号</p>
                <p>{student.phone ?? '未設定'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">性別</p>
                <p>{student.gender ? GENDER_LABELS[student.gender] : '未設定'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">生年月日</p>
                <p>{formatDate(student.birthdate)}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-muted-foreground">住所</p>
                <p>{student.address ?? '未設定'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">チャットユーザー名</p>
                <p>{student.chatUsername ?? '未設定'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">登録日</p>
                <p>{formatDate(student.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {canManageStudents && (
            <Card>
              <CardHeader>
                <CardTitle>状態変更</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
                <Select
                  value={selectedStatus || student.status}
                  onValueChange={(value) => setSelectedStatus(value as StudentStatus)}
                  disabled={availableTransitions.length === 0}
                >
                  <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder="変更先の状態を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={student.status}>
                      現在の状態: {STUDENT_STATUS_LABELS[student.status]}
                    </SelectItem>
                    {availableTransitions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STUDENT_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() =>
                    selectedStatus && selectedStatus !== student.status
                      ? statusMutation.mutate(selectedStatus)
                      : undefined
                  }
                  disabled={
                    statusMutation.isPending ||
                    !selectedStatus ||
                    selectedStatus === student.status
                  }
                >
                  {statusMutation.isPending ? '更新中...' : '状態を更新'}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>受講履歴</CardTitle>
            </CardHeader>
            <CardContent>
              {student.enrollments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>コース</TableHead>
                      <TableHead>開始日</TableHead>
                      <TableHead>終了日</TableHead>
                      <TableHead>状態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.courseName}</TableCell>
                        <TableCell>{formatDate(enrollment.startDate)}</TableCell>
                        <TableCell>{formatDate(enrollment.endDate)}</TableCell>
                        <TableCell>{enrollment.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">受講履歴はありません。</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>決済サマリ</CardTitle>
            </CardHeader>
            <CardContent>
              {student.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>コース</TableHead>
                      <TableHead>金額</TableHead>
                      <TableHead>支払期限</TableHead>
                      <TableHead>入金日</TableHead>
                      <TableHead>状態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.courseName}</TableCell>
                        <TableCell>{payment.amount.toLocaleString()}円</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>{formatDate(payment.paidDate)}</TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">決済情報はありません。</p>
              )}
            </CardContent>
          </Card>

          {canDeleteStudents && (
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
                  受講生を削除
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">受講生が見つかりません。</p>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>受講生を削除しますか？</DialogTitle>
            <DialogDescription>
              {student
                ? `「${student.name}」を削除します。関連データがある場合は削除できません。`
                : ''}
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
