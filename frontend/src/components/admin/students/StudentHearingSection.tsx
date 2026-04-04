import { useState } from 'react';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { HearingAnswerRow } from '@/types';

function hearingPublicUrl(token: string) {
  if (typeof window === 'undefined') {
    return `/hearing/${token}`;
  }
  return `${window.location.origin}/hearing/${token}`;
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('ja-JP');
  } catch {
    return value;
  }
}

type Props = {
  showUrlCard: boolean;
  tokenQuery: UseQueryResult<string | null, Error>;
  answersQuery: UseQueryResult<HearingAnswerRow[], Error>;
  rotateMutation: UseMutationResult<string, Error, void, unknown>;
  setActionError: (message: string) => void;
};

export function StudentHearingSection({
  showUrlCard,
  tokenQuery,
  answersQuery,
  rotateMutation,
  setActionError,
}: Props) {
  const [copyFeedback, setCopyFeedback] = useState('');

  return (
    <>
      {showUrlCard && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle>ヒアリング用URL</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rotateMutation.isPending}
              onClick={() => rotateMutation.mutate()}
            >
              {rotateMutation.isPending ? '発行中...' : 'URLを再発行'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm text-pretty">
              入金確認後に自動発行される場合があります。未発行のときや紛失時は「URLを再発行」で新しいリンクを発行してください。受講生へこのURLを共有し、ヒアリングに回答してもらいます。
            </p>
            {tokenQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">読み込み中...</p>
            ) : tokenQuery.data ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="bg-muted max-w-full flex-1 truncate rounded-md px-3 py-2 text-xs">
                  {hearingPublicUrl(tokenQuery.data)}
                </code>
                <div className="flex shrink-0 flex-col items-stretch gap-1 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(hearingPublicUrl(tokenQuery.data!));
                        setActionError('');
                        setCopyFeedback('コピーしました');
                        window.setTimeout(() => setCopyFeedback(''), 2500);
                      } catch {
                        setActionError('クリップボードへのコピーに失敗しました');
                        setCopyFeedback('');
                      }
                    }}
                  >
                    コピー
                  </Button>
                  {copyFeedback ? (
                    <span className="text-muted-foreground text-xs sm:ml-1">{copyFeedback}</span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                有効なURLがありません。「URLを再発行」で発行してください。
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {answersQuery.data && answersQuery.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ヒアリング回答</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>項目</TableHead>
                  <TableHead>回答</TableHead>
                  <TableHead className="w-[180px]">回答日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {answersQuery.data.map((row) => (
                  <TableRow key={row.hearingItemId}>
                    <TableCell className="align-top font-medium">{row.itemName}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md whitespace-pre-wrap align-top">
                      {row.answer || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground align-top text-sm">
                      {formatDateTime(row.answeredAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
