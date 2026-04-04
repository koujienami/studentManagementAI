import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants';
import { fetchApplyCourses, fetchApplyReferralSources, submitApplication } from '@/lib/api/apply';
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api/errors';
import { cn, formatYen } from '@/lib/utils';
import type { ApplyCompleteState, ApplyCourse } from '@/types';

const EMPTY_REFERRAL = '__EMPTY__';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^$|^[0-9+()\-\s]{8,20}$/;

export function ApplyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralSourceId, setReferralSourceId] = useState<string>(EMPTY_REFERRAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const coursesQuery = useQuery({
    queryKey: ['apply-courses'],
    queryFn: fetchApplyCourses,
  });

  const referralQuery = useQuery({
    queryKey: ['apply-referral-sources'],
    queryFn: fetchApplyReferralSources,
  });

  const selectedCourse = useMemo(
    () => coursesQuery.data?.find((c) => c.id === selectedCourseId) ?? null,
    [coursesQuery.data, selectedCourseId],
  );

  const applyMutation = useMutation({
    mutationFn: submitApplication,
    onSuccess: (data) => {
      navigate(ROUTES.APPLY_COMPLETE, { state: data satisfies ApplyCompleteState });
    },
  });

  /** step とコース選択の不整合を表示上のみ補正（useEffect で setState しない） */
  const displayStep: 1 | 2 = step === 2 && selectedCourseId == null ? 1 : step;

  const validateStep1 = () => {
    if (selectedCourseId == null) {
      setFieldErrors({ courseId: 'コースを選択してください' });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const validateStep2 = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = '氏名は必須です';
    if (!email.trim()) next.email = 'メールアドレスは必須です';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'メールアドレスの形式が不正です';
    if (phone.trim() && !PHONE_RE.test(phone.trim())) next.phone = '電話番号の形式が不正です';
    if (referralSourceId === EMPTY_REFERRAL) next.referralSourceId = '申込経路を選択してください';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      applyMutation.reset();
      setStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (applyMutation.isPending) return;
    if (!validateStep2() || selectedCourseId == null) return;

    applyMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      courseId: selectedCourseId,
      referralSourceId: Number(referralSourceId),
    });
  };

  const apiValidation = applyMutation.isError ? getApiValidationErrors(applyMutation.error) : {};
  const mergedErrors = { ...fieldErrors, ...apiValidation };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 md:py-14">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">受講お申し込み</h1>
          <p className="text-muted-foreground text-pretty">
            コースをお選びいただき、必要事項をご入力ください。
          </p>
        </header>

        <ol className="flex items-center justify-center gap-2 text-sm">
          <StepBadge active={displayStep === 1} done={displayStep > 1} label="コース選択" step={1} />
          <span className="text-muted-foreground">—</span>
          <StepBadge active={displayStep === 2} done={false} label="お客様情報" step={2} />
        </ol>

        {coursesQuery.isLoading || referralQuery.isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              読み込み中...
            </CardContent>
          </Card>
        ) : coursesQuery.isError ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              {getApiErrorMessage(coursesQuery.error, 'コース一覧の取得に失敗しました')}
            </CardContent>
          </Card>
        ) : referralQuery.isError ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              {getApiErrorMessage(referralQuery.error, '申込経路の取得に失敗しました')}
            </CardContent>
          </Card>
        ) : displayStep === 1 ? (
          <section className="space-y-4">
            <CourseGrid
              courses={coursesQuery.data ?? []}
              selectedId={selectedCourseId}
              onSelect={setSelectedCourseId}
            />
            {mergedErrors.courseId && (
              <p className="text-center text-sm text-destructive">{mergedErrors.courseId}</p>
            )}
            <div className="flex justify-end">
              <Button type="button" size="lg" onClick={handleNext} disabled={!coursesQuery.data?.length}>
                次へ
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </section>
        ) : (
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>お客様情報</CardTitle>
              <CardDescription>
                選択中のコース: <span className="font-medium text-foreground">{selectedCourse?.name}</span>
                {selectedCourse != null && (
                  <span className="ml-2">{formatYen(selectedCourse.price)}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {applyMutation.isError && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {getApiErrorMessage(applyMutation.error, '送信に失敗しました')}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="apply-name">氏名</Label>
                  <Input
                    id="apply-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    maxLength={100}
                    aria-invalid={!!mergedErrors.name}
                  />
                  {mergedErrors.name && <p className="text-sm text-destructive">{mergedErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apply-email">メールアドレス</Label>
                  <Input
                    id="apply-email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    maxLength={255}
                    aria-invalid={!!mergedErrors.email}
                  />
                  {mergedErrors.email && <p className="text-sm text-destructive">{mergedErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apply-phone">電話番号（任意）</Label>
                  <Input
                    id="apply-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="例: 090-1234-5678"
                    maxLength={20}
                    aria-invalid={!!mergedErrors.phone}
                  />
                  {mergedErrors.phone && <p className="text-sm text-destructive">{mergedErrors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label>申込経路</Label>
                  <Select value={referralSourceId} onValueChange={setReferralSourceId}>
                    <SelectTrigger aria-invalid={!!mergedErrors.referralSourceId}>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {(referralQuery.data ?? []).map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          <span className="text-muted-foreground mr-2 text-xs">[{r.category}]</span>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mergedErrors.referralSourceId && (
                    <p className="text-sm text-destructive">{mergedErrors.referralSourceId}</p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setFieldErrors({});
                      applyMutation.reset();
                    }}
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    戻る
                  </Button>
                  <Button type="submit" size="lg" disabled={applyMutation.isPending}>
                    {applyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        送信中...
                      </>
                    ) : (
                      '申し込む'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StepBadge({
  step,
  label,
  active,
  done,
}: {
  step: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5',
        active && 'border-primary bg-primary/10 text-primary',
        done && !active && 'border-muted-foreground/30 text-muted-foreground',
        !active && !done && 'border-muted text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
          active && 'bg-primary text-primary-foreground',
          done && 'bg-muted-foreground/20 text-foreground',
          !active && !done && 'bg-muted',
        )}
      >
        {done ? <Check className="size-3.5" /> : step}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

function CourseGrid({
  courses,
  selectedId,
  onSelect,
}: {
  courses: ApplyCourse[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          現在お申し込みいただけるコースがありません。しばらくしてから再度ご確認ください。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((course) => {
        const selected = selectedId === course.id;
        return (
          <button
            key={course.id}
            type="button"
            onClick={() => onSelect(course.id)}
            className={cn(
              'rounded-xl border-2 p-5 text-left transition-colors hover:border-primary/50',
              selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold leading-snug">{course.name}</h2>
              <span className="shrink-0 text-sm font-medium text-primary">{formatYen(course.price)}</span>
            </div>
            {course.description ? (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
