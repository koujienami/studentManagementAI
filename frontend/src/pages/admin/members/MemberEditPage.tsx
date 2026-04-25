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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import {
  createMember,
  fetchMember,
  resetMemberPassword,
  updateMember,
} from '@/lib/api/users';
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api/errors';
import type { MemberDetail, Role } from '@/types';

interface MemberFormState {
  username: string;
  email: string;
  name: string;
  role: Role;
  password: string;
}

const initialFormState: MemberFormState = {
  username: '',
  email: '',
  name: '',
  role: 'STAFF',
  password: '',
};

export function MemberEditPage() {
  const { id } = useParams();
  const memberId = id ? Number(id) : null;
  const isNew = memberId === null;

  const memberQuery = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => fetchMember(memberId as number),
    enabled: !isNew && Number.isFinite(memberId),
  });

  if (!isNew && !Number.isFinite(memberId)) {
    return <Navigate to="/members" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? '運営メンバー登録' : '運営メンバー編集'}
          </h2>
          <p className="text-muted-foreground">
            運営メンバーの情報を登録・更新します。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/members">戻る</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? '運営メンバー登録' : '運営メンバー編集'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!isNew && memberQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : !isNew && memberQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(memberQuery.error, '運営メンバー情報の取得に失敗しました')}
            </p>
          ) : (
            <MemberEditForm
              key={isNew ? 'new-member' : `edit-member-${memberQuery.data?.id ?? memberId}`}
              isNew={isNew}
              memberId={memberId}
              member={memberQuery.data}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface MemberEditFormProps {
  isNew: boolean;
  memberId: number | null;
  member?: MemberDetail;
}

function MemberEditForm({ isNew, memberId, member }: MemberEditFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const isSelf = !isNew && member?.id === currentUser?.id;

  const [form, setForm] = useState<MemberFormState>(() => {
    if (member) {
      return {
        username: member.username,
        email: member.email,
        name: member.name,
        role: member.role,
        password: '',
      };
    }
    return initialFormState;
  });

  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => {
      if (isNew) {
        return createMember({
          username: form.username.trim(),
          email: form.email.trim(),
          name: form.name.trim(),
          role: form.role,
          password: form.password,
        });
      }
      return updateMember(memberId as number, {
        email: form.email.trim(),
        name: form.name.trim(),
        role: form.role,
      });
    },
    onSuccess: async (saved) => {
      setFormError('');
      setFieldErrors({});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['members'] }),
        queryClient.invalidateQueries({ queryKey: ['member', saved.id] }),
        queryClient.invalidateQueries({ queryKey: ['instructor-options'] }),
      ]);
      navigate('/members');
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, '運営メンバーの保存に失敗しました'));
      setFieldErrors(getApiValidationErrors(error));
    },
  });

  const resetMutation = useMutation({
    mutationFn: (password: string) => resetMemberPassword(memberId as number, password),
    onSuccess: () => {
      setResetError('');
      setResetSuccess('パスワードをリセットしました。');
      setNewPassword('');
      setResetOpen(false);
    },
    onError: (error) => {
      setResetSuccess('');
      setResetError(getApiErrorMessage(error, 'パスワードのリセットに失敗しました'));
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    saveMutation.mutate();
  };

  const setValue = <K extends keyof MemberFormState>(key: K, value: MemberFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}
      {resetSuccess && (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          {resetSuccess}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">ユーザー名</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(event) => setValue('username', event.target.value)}
            maxLength={50}
            required
            disabled={!isNew}
          />
          {!isNew && (
            <p className="text-xs text-muted-foreground">
              ユーザー名は登録後に変更できません。
            </p>
          )}
          {fieldErrors.username && (
            <p className="text-sm text-destructive">{fieldErrors.username}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">氏名</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => setValue('name', event.target.value)}
            maxLength={100}
            required
          />
          {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setValue('email', event.target.value)}
            maxLength={255}
            required
          />
          {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label>ロール</Label>
          <Select
            value={form.role}
            onValueChange={(value) => setValue('role', value as Role)}
            disabled={isSelf}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">管理者</SelectItem>
              <SelectItem value="STAFF">スタッフ</SelectItem>
              <SelectItem value="INSTRUCTOR">講師</SelectItem>
            </SelectContent>
          </Select>
          {isSelf && (
            <p className="text-xs text-muted-foreground">
              自分自身のロールは変更できません。
            </p>
          )}
          {fieldErrors.role && <p className="text-sm text-destructive">{fieldErrors.role}</p>}
        </div>

        {isNew && (
          <div className="space-y-2">
            <Label htmlFor="password">初期パスワード</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => setValue('password', event.target.value)}
              minLength={8}
              maxLength={128}
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              8文字以上、英字と数字を含めてください。
            </p>
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? '保存中...' : '保存'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to="/members">キャンセル</Link>
        </Button>
        {!isNew && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setResetError('');
              setResetSuccess('');
              setNewPassword('');
              setResetOpen(true);
            }}
          >
            パスワードをリセット
          </Button>
        )}
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>パスワードをリセット</DialogTitle>
            <DialogDescription>
              新しいパスワードを直接設定します。設定後、本人にパスワードを伝達してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              8文字以上、英字と数字を含めてください。
            </p>
            {resetError && <p className="text-sm text-destructive">{resetError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={() => resetMutation.mutate(newPassword)}
              disabled={resetMutation.isPending || newPassword.length < 8}
            >
              {resetMutation.isPending ? 'リセット中...' : 'リセットする'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
