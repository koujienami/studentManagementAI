import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  createReferralSource,
  fetchReferralSourceAdmin,
  updateReferralSource,
} from '@/lib/api/referralSources';
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api/errors';
import type {
  ReferralSourceAdmin,
  ReferralSourceCategory,
  ReferralSourceInput,
} from '@/types';

const CATEGORY_OPTIONS: Array<{ value: ReferralSourceCategory; label: string }> = [
  { value: 'WEB', label: 'Web' },
  { value: 'AD', label: '広告' },
  { value: 'SEARCH', label: '検索' },
  { value: 'AI', label: 'AI' },
  { value: 'SNS', label: 'SNS' },
  { value: 'REFERRAL', label: '紹介' },
  { value: 'OTHER', label: 'その他' },
];

const initialState: ReferralSourceInput = {
  name: '',
  category: 'WEB',
  displayOrder: 0,
};

export function ReferralSourceEditPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const sourceId = id ? Number(id) : null;
  const isNew = sourceId === null;

  const sourceQuery = useQuery({
    queryKey: ['referral-source-admin', sourceId],
    queryFn: () => fetchReferralSourceAdmin(sourceId as number),
    enabled: !isNew && Number.isFinite(sourceId),
  });

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/referral-sources" replace />;
  }

  if (!isNew && !Number.isFinite(sourceId)) {
    return <Navigate to="/referral-sources" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? '申込経路登録' : '申込経路編集'}
          </h2>
          <p className="text-muted-foreground">申込経路マスタの登録・更新を行います。</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/referral-sources">戻る</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? '申込経路登録' : '申込経路編集'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!isNew && sourceQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : !isNew && sourceQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(sourceQuery.error, '申込経路の取得に失敗しました')}
            </p>
          ) : (
            <ReferralSourceEditForm
              key={isNew ? 'new-source' : `edit-source-${sourceQuery.data?.id ?? sourceId}`}
              isNew={isNew}
              sourceId={sourceId}
              source={sourceQuery.data}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ReferralSourceEditFormProps {
  isNew: boolean;
  sourceId: number | null;
  source?: ReferralSourceAdmin;
}

function ReferralSourceEditForm({
  isNew,
  sourceId,
  source,
}: ReferralSourceEditFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ReferralSourceInput>(() => {
    if (source) {
      return {
        name: source.name,
        category: source.category,
        displayOrder: source.displayOrder,
      };
    }
    return initialState;
  });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: (input: ReferralSourceInput) => {
      if (isNew) {
        return createReferralSource(input);
      }
      return updateReferralSource(sourceId as number, input);
    },
    onSuccess: async () => {
      setFormError('');
      setFieldErrors({});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['referral-sources-admin'] }),
        queryClient.invalidateQueries({ queryKey: ['referral-source-options'] }),
      ]);
      navigate('/referral-sources');
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, '申込経路の保存に失敗しました'));
      setFieldErrors(getApiValidationErrors(error));
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    saveMutation.mutate({
      name: form.name.trim(),
      category: form.category,
      displayOrder: Number.isFinite(form.displayOrder) ? form.displayOrder : 0,
    });
  };

  const setValue = <K extends keyof ReferralSourceInput>(
    key: K,
    value: ReferralSourceInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">経路名</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => setValue('name', event.target.value)}
            maxLength={100}
            required
          />
          {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label>カテゴリ</Label>
          <Select
            value={form.category}
            onValueChange={(value) => setValue('category', value as ReferralSourceCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.category && (
            <p className="text-sm text-destructive">{fieldErrors.category}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayOrder">表示順</Label>
          <Input
            id="displayOrder"
            type="number"
            min={0}
            value={form.displayOrder}
            onChange={(event) =>
              setValue(
                'displayOrder',
                event.target.value === '' ? 0 : Number(event.target.value),
              )
            }
            required
          />
          <p className="text-xs text-muted-foreground">
            数値が小さいほど一覧の上に表示されます。
          </p>
          {fieldErrors.displayOrder && (
            <p className="text-sm text-destructive">{fieldErrors.displayOrder}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? '保存中...' : '保存'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to="/referral-sources">キャンセル</Link>
        </Button>
      </div>
    </form>
  );
}
