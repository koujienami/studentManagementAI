import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDashboardStats } from '@/lib/api/dashboard';
import { ROUTES } from '@/constants';

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
  });

  const cards = [
    {
      title: '受講生数',
      value: stats?.studentCount,
      to: ROUTES.STUDENTS,
      description: '登録されている受講生の総数',
    },
    {
      title: '受講中',
      value: stats?.activeEnrollmentCount,
      to: ROUTES.ENROLLMENTS,
      description: '現在受講中の件数',
    },
    {
      title: '未払い件数',
      value: stats?.unpaidPaymentCount,
      to: ROUTES.PAYMENTS,
      description: '入金待ちの決済件数',
    },
    {
      title: 'コース数',
      value: stats?.courseCount,
      to: ROUTES.COURSES,
      description: '提供中のコース数',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} to={card.to} className="block">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : (card.value ?? '-')}
                </div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
