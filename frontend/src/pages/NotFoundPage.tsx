import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">ページが見つかりません</p>
      <Button asChild>
        <Link to="/dashboard">ダッシュボードに戻る</Link>
      </Button>
    </div>
  );
}
