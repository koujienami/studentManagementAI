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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { deleteMember, fetchMembers } from '@/lib/api/users';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { MemberListItem, Role } from '@/types';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: '管理者',
  STAFF: 'スタッフ',
  INSTRUCTOR: '講師',
};

const ROLE_ALL = 'ALL';

export function MemberListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [keywordInput, setKeywordInput] = useState('');
  const [roleInput, setRoleInput] = useState<Role | typeof ROLE_ALL>(ROLE_ALL);
  const [filters, setFilters] = useState<{ keyword: string; role: Role | '' }>({
    keyword: '',
    role: '',
  });
  const [actionError, setActionError] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<MemberListItem | null>(null);

  const membersQuery = useQuery({
    queryKey: ['members', filters],
    queryFn: () => fetchMembers(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: async () => {
      setActionError('');
      setMemberToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, '運営メンバーの削除に失敗しました'));
    },
  });

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      keyword: keywordInput.trim(),
      role: roleInput === ROLE_ALL ? '' : roleInput,
    });
  };

  const handleDelete = () => {
    if (!memberToDelete) return;
    deleteMutation.mutate(memberToDelete.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">運営メンバー一覧</h2>
          <p className="text-muted-foreground">
            管理者・スタッフ・講師の登録、編集、削除を行えます。
          </p>
        </div>
        <Button asChild>
          <Link to="/members/new">運営メンバーを登録</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-[1fr_200px_auto]"
            onSubmit={handleSearch}
          >
            <Input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="ユーザー名・メール・氏名で検索"
            />
            <Select
              value={roleInput}
              onValueChange={(value) => setRoleInput(value as Role | typeof ROLE_ALL)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="ロール" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROLE_ALL}>すべてのロール</SelectItem>
                <SelectItem value="ADMIN">管理者</SelectItem>
                <SelectItem value="STAFF">スタッフ</SelectItem>
                <SelectItem value="INSTRUCTOR">講師</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={membersQuery.isFetching}>
              検索
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>運営メンバー一覧</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}

          {membersQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : membersQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(membersQuery.error, '運営メンバー一覧の取得に失敗しました')}
            </p>
          ) : membersQuery.data && membersQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー名</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>ロール</TableHead>
                  <TableHead className="w-[180px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersQuery.data.map((member) => {
                  const isSelf = user?.id === member.id;
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.username}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{ROLE_LABELS[member.role]}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/members/${member.id}/edit`}>編集</Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setMemberToDelete(member)}
                            disabled={deleteMutation.isPending || isSelf}
                            title={isSelf ? '自分自身は削除できません' : undefined}
                          >
                            削除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">条件に一致する運営メンバーはいません。</p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>運営メンバーを削除しますか？</DialogTitle>
            <DialogDescription>
              {memberToDelete
                ? `「${memberToDelete.name}（${memberToDelete.username}）」を削除します。論理削除のため過去データは残りますが、ログインはできなくなります。`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToDelete(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
