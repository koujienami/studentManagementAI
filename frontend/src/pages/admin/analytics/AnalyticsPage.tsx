import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  fetchAnalyticsCourses,
  fetchAnalyticsMonthly,
  fetchAnalyticsOverview,
  fetchAnalyticsReferralSources,
} from '@/lib/api/analytics';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { ReferralSourceCategory } from '@/types';

type Preset = 'thisMonth' | 'last3' | 'last12' | 'custom';

const CATEGORY_COLORS: Record<ReferralSourceCategory, string> = {
  WEB: '#3b82f6',
  AD: '#f97316',
  SEARCH: '#10b981',
  AI: '#a855f7',
  SNS: '#ec4899',
  REFERRAL: '#eab308',
  OTHER: '#94a3b8',
};

const DEFAULT_COLOR = '#64748b';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function presetRange(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const to = formatDate(today);
  if (preset === 'thisMonth') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatDate(first), to };
  }
  if (preset === 'last3') {
    const start = new Date(today);
    start.setMonth(start.getMonth() - 2);
    start.setDate(1);
    return { from: formatDate(start), to };
  }
  // last12
  const start = new Date(today);
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  return { from: formatDate(start), to };
}

function formatYen(value: number): string {
  return `¥${value.toLocaleString('ja-JP')}`;
}

export function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('last12');
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>(() =>
    presetRange('last12'),
  );

  const range = useMemo(() => {
    if (preset === 'custom') return customRange;
    return presetRange(preset);
  }, [preset, customRange]);

  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview', range],
    queryFn: () => fetchAnalyticsOverview(range),
  });
  const referralQuery = useQuery({
    queryKey: ['analytics', 'referral-sources', range],
    queryFn: () => fetchAnalyticsReferralSources(range),
  });
  const courseQuery = useQuery({
    queryKey: ['analytics', 'courses', range],
    queryFn: () => fetchAnalyticsCourses(range),
  });
  const monthlyQuery = useQuery({
    queryKey: ['analytics', 'monthly', 12],
    queryFn: () => fetchAnalyticsMonthly(12),
  });

  const overview = overviewQuery.data;
  const referralData = referralQuery.data ?? [];
  const courseData = courseQuery.data ?? [];
  const monthlyData = monthlyQuery.data ?? [];

  const referralChartData = referralData.map((item) => ({
    name: item.name,
    value: item.studentCount,
    category: item.category,
  }));

  const courseChartData = courseData.map((item) => ({
    name: item.name,
    enrollments: item.enrollmentCount,
    paid: item.revenuePaid,
    unpaid: item.revenueUnpaid,
  }));

  const kpiCards = [
    {
      title: '新規受講生',
      value: overview ? overview.newStudents.toLocaleString('ja-JP') : '-',
      description: '指定期間に登録された受講生数',
    },
    {
      title: '受講中',
      value: overview ? overview.activeEnrollments.toLocaleString('ja-JP') : '-',
      description: '現在受講中の件数 (期間に依存しない)',
    },
    {
      title: '入金額',
      value: overview ? formatYen(overview.payments.totalPaid) : '-',
      description: `入金件数 ${overview?.payments.countPaid ?? 0} 件`,
    },
    {
      title: '未収金額',
      value: overview ? formatYen(overview.payments.totalUnpaid) : '-',
      description: `未収件数 ${overview?.payments.countUnpaid ?? 0} 件`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">集計・分析</h2>
        <p className="text-muted-foreground">
          指定した期間の受講生獲得状況、コース別売上、月次推移を確認できます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>期間</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={preset === 'thisMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreset('thisMonth')}
            >
              今月
            </Button>
            <Button
              variant={preset === 'last3' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreset('last3')}
            >
              直近3ヶ月
            </Button>
            <Button
              variant={preset === 'last12' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreset('last12')}
            >
              直近12ヶ月
            </Button>
            <Button
              variant={preset === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreset('custom')}
            >
              カスタム
            </Button>
          </div>

          {preset === 'custom' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="from">開始日</Label>
                <Input
                  id="from"
                  type="date"
                  value={customRange.from}
                  onChange={(e) =>
                    setCustomRange((prev) => ({ ...prev, from: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to">終了日</Label>
                <Input
                  id="to"
                  type="date"
                  value={customRange.to}
                  onChange={(e) =>
                    setCustomRange((prev) => ({ ...prev, to: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            集計期間: {range.from} 〜 {range.to}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overviewQuery.isLoading ? '...' : card.value}
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>申込経路別 受講生数</CardTitle>
        </CardHeader>
        <CardContent>
          {referralQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : referralQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(referralQuery.error, '集計の取得に失敗しました')}
            </p>
          ) : referralChartData.length === 0 ? (
            <p className="text-muted-foreground">データがありません。</p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referralChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [`${Number(value)} 名`, '受講生']}
                    labelFormatter={(label) => `経路: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="value" name="受講生数">
                    {referralChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CATEGORY_COLORS[entry.category as ReferralSourceCategory] ??
                          DEFAULT_COLOR
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>コース別 受講生数・売上</CardTitle>
        </CardHeader>
        <CardContent>
          {courseQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : courseQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(courseQuery.error, '集計の取得に失敗しました')}
            </p>
          ) : courseChartData.length === 0 ? (
            <p className="text-muted-foreground">データがありません。</p>
          ) : (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    label={{ value: '受講生数', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value: number) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const numericValue = Number(value);
                      if (name === '受講生数') return [`${numericValue} 名`, name];
                      return [formatYen(numericValue), name];
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="enrollments"
                    name="受講生数"
                    fill="#3b82f6"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="paid"
                    name="入金済み"
                    fill="#10b981"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="unpaid"
                    name="未収"
                    fill="#ef4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>月次推移 (直近12ヶ月)</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : monthlyQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(monthlyQuery.error, '月次推移の取得に失敗しました')}
            </p>
          ) : monthlyData.length === 0 ? (
            <p className="text-muted-foreground">データがありません。</p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    label={{ value: '新規受講生', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value: number) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const numericValue = Number(value);
                      if (name === '新規受講生') return [`${numericValue} 名`, name];
                      return [formatYen(numericValue), name];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="newStudents"
                    name="新規受講生"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="paidAmount"
                    name="入金額"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="unpaidAmount"
                    name="未収額"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>コース別 売上明細</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/payments">決済管理へ</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {courseQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : courseData.length === 0 ? (
            <p className="text-muted-foreground">データがありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コース名</TableHead>
                  <TableHead className="text-right">受講生数</TableHead>
                  <TableHead className="text-right">入金済み</TableHead>
                  <TableHead className="text-right">未収</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseData.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="text-right">
                      {course.enrollmentCount.toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatYen(course.revenuePaid)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatYen(course.revenueUnpaid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
