import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HearingCompletePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background px-4 py-12 md:py-16">
      <div className="mx-auto max-w-lg">
        <Card className="border-border/80 text-center shadow-sm">
          <CardHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-8" />
            </div>
            <CardTitle className="text-2xl">ヒアリングを受け付けました</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-pretty leading-relaxed">
              ご回答ありがとうございます。受講準備として状態を更新しました。開講・学習のご案内は、別途担当よりご連絡いたします。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
