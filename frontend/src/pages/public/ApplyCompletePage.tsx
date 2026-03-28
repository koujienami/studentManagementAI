import { useLocation } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApplyCompleteState } from '@/types';

function formatYen(n: number) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(d);
  } catch {
    return iso;
  }
}

function isApplyCompleteState(x: unknown): x is ApplyCompleteState {
  return (
    typeof x === 'object' &&
    x !== null &&
    'courseName' in x &&
    'amount' in x &&
    'paymentDueDate' in x &&
    typeof (x as ApplyCompleteState).courseName === 'string' &&
    typeof (x as ApplyCompleteState).amount === 'number' &&
    typeof (x as ApplyCompleteState).paymentDueDate === 'string'
  );
}

export function ApplyCompletePage() {
  const location = useLocation();
  const state = isApplyCompleteState(location.state) ? location.state : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background px-4 py-12 md:py-16">
      <div className="mx-auto max-w-lg">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-8" />
            </div>
            <CardTitle className="text-2xl">お申し込みを受け付けました</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground text-pretty leading-relaxed">
              この度はお申し込みいただき、ありがとうございます。内容を確認のうえ、ご登録のメールアドレスへご連絡いたします。
            </p>

            {state ? (
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-left text-sm">
                <p className="font-medium text-foreground">お申し込み内容</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>
                    コース: <span className="text-foreground">{state.courseName}</span>
                  </li>
                  <li>
                    お支払い金額: <span className="text-foreground">{formatYen(state.amount)}</span>
                  </li>
                  <li>
                    お支払い期限（目安）:{' '}
                    <span className="text-foreground">{formatDate(state.paymentDueDate)}</span>
                  </li>
                </ul>
              </div>
            ) : null}

            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p className="font-medium text-foreground">今後の流れ</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>ご入金のご案内（メール等でお知らせします）</li>
                <li>入金確認後、ヒアリングのご案内をお送りします</li>
                <li>ヒアリング後、受講開始に向けた準備を進めます</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
