import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentStatusBadge } from '@/components/shared/PaymentStatusBadge';
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
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/api/errors';
import { fetchPayments, updatePayment, type PaymentListParams } from '@/lib/api/payments';
import type { PaymentListItem, PaymentStatus } from '@/types';

const PAGE_SIZE = 20;

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ja-JP');
}

export function PaymentListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManagePayments = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | '' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const [confirmPayment, setConfirmPayment] = useState<PaymentListItem | null>(null);

  const filters: PaymentListParams = {
    status: statusFilter === 'all' ? '' : statusFilter,
    page,
    size: PAGE_SIZE,
  };

  const paymentsQuery = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => fetchPayments(filters),
  });

  const confirmMutation = useMutation({
    mutationFn: (p: PaymentListItem) =>
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
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['student'] }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '入金確認に失敗しました'));
    },
  });

  const data = paymentsQuery.data;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">決済一覧</h2>
        <p className="text-muted-foreground">決済状態の確認と入金確認を行います。</p>
      </div>

      {actionError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{actionError}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-w-[200px] max-w-xs flex-col gap-2">
            <span className="text-sm text-muted-foreground">決済状態</span>
            <Select
              value={statusFilter === '' ? 'all' : statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === 'all' ? 'all' : (v as PaymentStatus));
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="UNPAID">未払いのみ</SelectItem>
                <SelectItem value="PAID">入金済みのみ</SelectItem>
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
          {paymentsQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : paymentsQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(paymentsQuery.error, '一覧の取得に失敗しました')}
            </p>
          ) : data && data.content.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>受講生</TableHead>
                    <TableHead>コース</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>支払期限</TableHead>
                    <TableHead>入金日</TableHead>
                    <TableHead>状態</TableHead>
                    {canManagePayments && <TableHead className="w-[120px]">操作</TableHead>}
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
                      <TableCell>{row.courseName}</TableCell>
                      <TableCell>{row.amount.toLocaleString()}円</TableCell>
                      <TableCell>{formatDate(row.dueDate)}</TableCell>
                      <TableCell>{formatDate(row.paidDate)}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={row.status} />
                      </TableCell>
                      {canManagePayments && (
                        <TableCell>
                          {row.status === 'UNPAID' ? (
                            <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmPayment(row)}>
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
            <p className="text-muted-foreground">該当する決済はありません。</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmPayment} onOpenChange={(open) => !open && setConfirmPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>入金を確認しますか？</DialogTitle>
            <DialogDescription>
              {confirmPayment
                ? `${confirmPayment.studentName} / ${confirmPayment.courseName}（${confirmPayment.amount.toLocaleString()}円）を入金済みにします。受講生が仮登録の場合はヒアリング前へ進みます。`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmPayment(null)}>
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={() => confirmPayment && confirmMutation.mutate(confirmPayment)}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? '処理中...' : '入金済みにする'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
