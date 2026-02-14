import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ApplyCompletePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>申し込み完了</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            お申し込みありがとうございます。確認メールをお送りしましたのでご確認ください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
