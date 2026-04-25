import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changeMyPassword } from '@/lib/api/users';
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api/errors';

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialState: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function PasswordChangePage() {
  const [form, setForm] = useState<PasswordFormState>(initialState);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const mutation = useMutation({
    mutationFn: () => changeMyPassword(form.currentPassword, form.newPassword),
    onSuccess: () => {
      setFormError('');
      setFieldErrors({});
      setSuccess('パスワードを変更しました。');
      setForm(initialState);
    },
    onError: (error) => {
      setSuccess('');
      setFormError(getApiErrorMessage(error, 'パスワードの変更に失敗しました'));
      setFieldErrors(getApiValidationErrors(error));
    },
  });

  const setValue = <K extends keyof PasswordFormState>(
    key: K,
    value: PasswordFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setFormError('新しいパスワードと確認用パスワードが一致しません。');
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">パスワード変更</h2>
        <p className="text-muted-foreground">ご自身のパスワードを変更します。</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>パスワード変更</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {formError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">現在のパスワード</Label>
              <Input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={(event) => setValue('currentPassword', event.target.value)}
                autoComplete="current-password"
                required
              />
              {fieldErrors.currentPassword && (
                <p className="text-sm text-destructive">{fieldErrors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(event) => setValue('newPassword', event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
              <p className="text-xs text-muted-foreground">
                8文字以上、英字と数字を含めてください。
              </p>
              {fieldErrors.newPassword && (
                <p className="text-sm text-destructive">{fieldErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setValue('confirmPassword', event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>

            <div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? '変更中...' : 'パスワードを変更'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
