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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import {
  deleteReferralSource,
  fetchReferralSourcesAdmin,
} from '@/lib/api/referralSources';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { ReferralSourceAdmin, ReferralSourceCategory } from '@/types';

const CATEGORY_LABELS: Record<ReferralSourceCategory, string> = {
  WEB: 'Web',
  AD: '広告',
  SEARCH: '検索',
  AI: 'AI',
  SNS: 'SNS',
  REFERRAL: '紹介',
  OTHER: 'その他',
};

export function ReferralSourceListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [actionError, setActionError] = useState('');
  const [toDelete, setToDelete] = useState<ReferralSourceAdmin | null>(null);

  const sourcesQuery = useQuery({
    queryKey: ['referral-sources-admin'],
    queryFn: fetchReferralSourcesAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReferralSource,
    onSuccess: async () => {
      setActionError('');
      setToDelete(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['referral-sources-admin'] }),
        queryClient.invalidateQueries({ queryKey: ['referral-source-options'] }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '申込経路の削除に失敗しました'));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">申込経路マスタ</h2>
          <p className="text-muted-foreground">
            受講生の申込経路として選択できる項目を管理します。論理削除した経路は新規申込で選択できなくなります。
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link to="/referral-sources/new">申込経路を登録</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>申込経路一覧</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}

          {sourcesQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : sourcesQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(sourcesQuery.error, '申込経路の取得に失敗しました')}
            </p>
          ) : sourcesQuery.data && sourcesQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">表示順</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-[120px]">カテゴリ</TableHead>
                  <TableHead className="w-[100px]">状態</TableHead>
                  <TableHead className="w-[180px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourcesQuery.data.map((source) => (
                  <TableRow
                    key={source.id}
                    className={source.deleted ? 'text-muted-foreground' : undefined}
                  >
                    <TableCell>{source.displayOrder}</TableCell>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>
                      {CATEGORY_LABELS[source.category] ?? source.category}
                    </TableCell>
                    <TableCell>
                      {source.deleted ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs">削除済</span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          有効
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {isAdmin && !source.deleted && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/referral-sources/${source.id}/edit`}>編集</Link>
                          </Button>
                        )}
                        {isAdmin && !source.deleted && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setToDelete(source)}
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
            <p className="text-muted-foreground">登録された申込経路はありません。</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申込経路を削除しますか？</DialogTitle>
            <DialogDescription>
              {toDelete
                ? `「${toDelete.name}」を削除します。論理削除のため過去の受講生に紐づく経路情報は残りますが、新規申込では選択できなくなります。`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '削除中...' : '削除する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
