import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants';
import { getApiErrorMessage } from '@/lib/api/errors';
import { fetchHearingSession, submitHearingAnswers } from '@/lib/api/hearing';
import type { HearingItem } from '@/types';
import axios from 'axios';

function initialAnswers(items: HearingItem[]) {
  const m: Record<number, string> = {};
  for (const it of items) {
    m[it.id] = '';
  }
  return m;
}

export function HearingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const sessionQuery = useQuery({
    queryKey: ['hearing-session', token],
    queryFn: () => fetchHearingSession(token!),
    enabled: Boolean(token),
    retry: false,
  });

  const items = sessionQuery.data?.items ?? [];

  useEffect(() => {
    if (sessionQuery.data?.items) {
      setAnswers(initialAnswers(sessionQuery.data.items));
    }
  }, [sessionQuery.data?.items]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('トークンがありません');
      }
      const payload = items.map((it) => ({
        hearingItemId: it.id,
        answer: answers[it.id] ?? '',
      }));
      await submitHearingAnswers(token, payload);
    },
    onSuccess: () => {
      navigate(ROUTES.HEARING_COMPLETE);
    },
  });

  const validationError = useMemo(() => {
    if (!sessionQuery.data?.canSubmit) {
      return '';
    }
    for (const it of items) {
      if (!it.required) {
        continue;
      }
      const v = (answers[it.id] ?? '').trim();
      if (!v) {
        return '必須項目に回答してください';
      }
    }
    return '';
  }, [answers, items, sessionQuery.data?.canSubmit]);

  const errorMessage = (() => {
    if (sessionQuery.isError) {
      const err = sessionQuery.error;
      if (axios.isAxiosError(err)) {
        const s = err.response?.status;
        if (s === 404) {
          return 'このURLは無効です。お手数ですが担当者までお問い合わせください。';
        }
        if (s === 410) {
          return err.response?.data?.message ?? 'このURLは使用できません。';
        }
      }
      return getApiErrorMessage(sessionQuery.error, 'ヒアリング情報の取得に失敗しました');
    }
    return '';
  })();

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-destructive">URLが不正です。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background px-4 py-10 md:py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ヒアリングフォーム</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            {sessionQuery.data
              ? `${sessionQuery.data.displayName} の皆さま、以下の項目にご回答ください。`
              : '読み込み中...'}
          </p>
        </div>

        {sessionQuery.isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            読み込み中...
          </div>
        )}

        {errorMessage && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6 text-sm text-destructive">{errorMessage}</CardContent>
          </Card>
        )}

        {sessionQuery.data && !sessionQuery.data.canSubmit && sessionQuery.data.message && (
          <Card>
            <CardContent className="pt-6 text-pretty text-muted-foreground leading-relaxed">
              {sessionQuery.data.message}
            </CardContent>
          </Card>
        )}

        {sessionQuery.data?.canSubmit && items.length > 0 && (
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">ご回答</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((it) => (
                <div key={it.id} className="space-y-2">
                  <Label htmlFor={`h-${it.id}`}>
                    {it.name}
                    {it.required ? (
                      <span className="text-destructive"> *</span>
                    ) : (
                      <span className="text-muted-foreground">（任意）</span>
                    )}
                  </Label>
                  <Textarea
                    id={`h-${it.id}`}
                    rows={4}
                    value={answers[it.id] ?? ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [it.id]: e.target.value,
                      }))
                    }
                    disabled={submitMutation.isPending}
                  />
                </div>
              ))}
              {validationError && (
                <p className="text-sm text-destructive">{validationError}</p>
              )}
              {submitMutation.isError && (
                <p className="text-sm text-destructive">
                  {getApiErrorMessage(submitMutation.error, '送信に失敗しました')}
                </p>
              )}
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={
                  submitMutation.isPending || Boolean(validationError) || items.length === 0
                }
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  '回答を送信する'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
