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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ENROLLMENT_STATUS_LABELS, GENDER_LABELS, STUDENT_STATUS_LABELS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { fetchCourses } from '@/lib/api/courses';
import { createEnrollment, updateEnrollment } from '@/lib/api/enrollments';
import { updatePayment } from '@/lib/api/payments';
import { deleteStudent, fetchStudent, updateStudentStatus } from '@/lib/api/students';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { EnrollmentStatus, StudentEnrollmentSummary, StudentPaymentSummary, StudentStatus } from '@/types';

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
  const canViewPayments = user?.role !== 'INSTRUCTOR';

  const studentId = Number(id);
  const [actionError, setActionError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus | ''>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [editEnrollment, setEditEnrollment] = useState<StudentEnrollmentSummary | null>(null);
  const [confirmPayment, setConfirmPayment] = useState<StudentPaymentSummary | null>(null);
  const [enrollForm, setEnrollForm] = useState({
    courseId: '',
    startDate: '',
    endDate: '',
    dueDate: '',
    amount: '',
  });
  const [editEnrollmentForm, setEditEnrollmentForm] = useState({
    startDate: '',
    endDate: '',
    status: 'ENROLLED' as EnrollmentStatus,
  });

  const studentQuery = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchStudent(studentId),
    enabled: Number.isFinite(studentId),
  });

  const coursesQuery = useQuery({
    queryKey: ['course-options'],
    queryFn: () => fetchCourses(),
    enabled: canManageStudents && enrollDialogOpen,
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: () =>
      createEnrollment({
        studentId,
        courseId: Number(enrollForm.courseId),
        startDate: enrollForm.startDate,
        endDate: enrollForm.endDate || null,
        dueDate: enrollForm.dueDate,
        amount: enrollForm.amount.trim() === '' ? null : Number(enrollForm.amount),
      }),
    onSuccess: async () => {
      setActionError('');
      setEnrollDialogOpen(false);
      setEnrollForm({ courseId: '', startDate: '', endDate: '', dueDate: '', amount: '' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['student', studentId] }),
        queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '受講の登録に失敗しました'));
    },
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: () => {
      if (!editEnrollment) {
        return Promise.reject(new Error());
      }
      return updateEnrollment(editEnrollment.id, {
        startDate: editEnrollmentForm.startDate,
        endDate: editEnrollmentForm.endDate || null,
        status: editEnrollmentForm.status,
      });
    },
    onSuccess: async () => {
      setActionError('');
      setEditEnrollment(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['student', studentId] }),
        queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '受講履歴の更新に失敗しました'));
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (p: StudentPaymentSummary) =>
      updatePayment(p.id, {
        amount: p.amount,
        dueDate: p.dueDate,
        paidDate: null,
        status: 'PAID',
      }),
    onSuccess: async () => {
      setActionError('');
      setConfirmPayment(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['student', studentId] }),
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '入金確認に失敗しました'));
    },
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
      setIsDeleteDialogOpen(false);
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
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <CardTitle>受講履歴</CardTitle>
              {canManageStudents && (
                <Button type="button" size="sm" onClick={() => setEnrollDialogOpen(true)}>
                  受講を登録
                </Button>
              )}
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
                      {canManageStudents && <TableHead className="w-[100px]">操作</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.courseName}</TableCell>
                        <TableCell>{formatDate(enrollment.startDate)}</TableCell>
                        <TableCell>{formatDate(enrollment.endDate)}</TableCell>
                        <TableCell>{ENROLLMENT_STATUS_LABELS[enrollment.status]}</TableCell>
                        {canManageStudents && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditEnrollment(enrollment);
                                setEditEnrollmentForm({
                                  startDate: enrollment.startDate.slice(0, 10),
                                  endDate: enrollment.endDate ? enrollment.endDate.slice(0, 10) : '',
                                  status: enrollment.status,
                                });
                              }}
                            >
                              編集
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">受講履歴はありません。</p>
              )}
            </CardContent>
          </Card>

          {canViewPayments && (
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
                        {canManageStudents && <TableHead className="w-[120px]">操作</TableHead>}
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
                          {canManageStudents && (
                            <TableCell>
                              {payment.status === 'UNPAID' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setConfirmPayment(payment)}
                                >
                                  入金確認
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">決済情報はありません。</p>
                )}
              </CardContent>
            </Card>
          )}

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

      <Dialog
        open={enrollDialogOpen}
        onOpenChange={(open) => {
          setEnrollDialogOpen(open);
          if (!open) {
            setEnrollForm({ courseId: '', startDate: '', endDate: '', dueDate: '', amount: '' });
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>受講を登録</DialogTitle>
            <DialogDescription>コースを紐付け、未払いの決済を同時に作成します。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="enroll-course">コース</Label>
              <Select
                value={enrollForm.courseId}
                onValueChange={(v) => setEnrollForm((f) => ({ ...f, courseId: v }))}
              >
                <SelectTrigger id="enroll-course">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {(coursesQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}（{c.price.toLocaleString()}円）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enroll-start">受講開始日</Label>
              <Input
                id="enroll-start"
                type="date"
                value={enrollForm.startDate}
                onChange={(e) => setEnrollForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enroll-end">受講終了日（任意）</Label>
              <Input
                id="enroll-end"
                type="date"
                value={enrollForm.endDate}
                onChange={(e) => setEnrollForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enroll-due">決済期日</Label>
              <Input
                id="enroll-due"
                type="date"
                value={enrollForm.dueDate}
                onChange={(e) => setEnrollForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enroll-amount">金額（任意・未入力時はコース料金）</Label>
              <Input
                id="enroll-amount"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="例: 50000"
                value={enrollForm.amount}
                onChange={(e) => setEnrollForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnrollDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              type="button"
              disabled={createEnrollmentMutation.isPending}
              onClick={() => {
                if (!enrollForm.courseId || !enrollForm.startDate || !enrollForm.dueDate) {
                  setActionError('コース・受講開始日・決済期日は必須です');
                  return;
                }
                if (enrollForm.amount.trim() !== '' && Number.isNaN(Number(enrollForm.amount))) {
                  setActionError('金額の形式が不正です');
                  return;
                }
                setActionError('');
                createEnrollmentMutation.mutate();
              }}
            >
              {createEnrollmentMutation.isPending ? '登録中...' : '登録する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editEnrollment} onOpenChange={(open) => !open && setEditEnrollment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>受講履歴を編集</DialogTitle>
            <DialogDescription>開始日・終了日・受講状況を更新します。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-enroll-start">受講開始日</Label>
              <Input
                id="edit-enroll-start"
                type="date"
                value={editEnrollmentForm.startDate}
                onChange={(e) => setEditEnrollmentForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-enroll-end">受講終了日（任意）</Label>
              <Input
                id="edit-enroll-end"
                type="date"
                value={editEnrollmentForm.endDate}
                onChange={(e) => setEditEnrollmentForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>受講状況</Label>
              <Select
                value={editEnrollmentForm.status}
                onValueChange={(v) =>
                  setEditEnrollmentForm((f) => ({ ...f, status: v as EnrollmentStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['ENROLLED', 'COMPLETED', 'WITHDRAWN'] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {ENROLLMENT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditEnrollment(null)}>
              キャンセル
            </Button>
            <Button
              type="button"
              disabled={updateEnrollmentMutation.isPending}
              onClick={() => updateEnrollmentMutation.mutate()}
            >
              {updateEnrollmentMutation.isPending ? '更新中...' : '保存する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmPayment} onOpenChange={(open) => !open && setConfirmPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>入金を確認しますか？</DialogTitle>
            <DialogDescription>
              {confirmPayment
                ? `${confirmPayment.courseName}（${confirmPayment.amount.toLocaleString()}円）を入金済みにします。受講生が仮登録の場合はヒアリング前へ進みます。`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmPayment(null)}>
              キャンセル
            </Button>
            <Button
              type="button"
              disabled={confirmPaymentMutation.isPending}
              onClick={() => confirmPayment && confirmPaymentMutation.mutate(confirmPayment)}
            >
              {confirmPaymentMutation.isPending ? '処理中...' : '入金済みにする'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
