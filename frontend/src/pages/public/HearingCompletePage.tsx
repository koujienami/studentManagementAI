import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HearingCompletePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>ヒアリング完了</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ヒアリングへのご回答ありがとうございます。担当者よりご連絡いたします。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
