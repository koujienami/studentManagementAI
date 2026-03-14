import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { createStudent, fetchStudent, updateStudent } from '@/lib/api/students';
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api/errors';
import { fetchReferralSourceOptions } from '@/lib/api/masterData';
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from '@/constants';
import type { Gender, ReferralSourceOption, StudentDetail, StudentInput, StudentStatus } from '@/types';

const EMPTY_VALUE = '__EMPTY__';
const BIRTHDATE_START_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();
const BIRTHDATE_YEARS = Array.from(
  { length: CURRENT_YEAR - BIRTHDATE_START_YEAR + 1 },
  (_, index) => String(CURRENT_YEAR - index),
);
const BIRTHDATE_MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1));

const initialFormState: StudentInput = {
  name: '',
  email: '',
  phone: '',
  address: '',
  birthdate: '',
  gender: '',
  status: 'PROVISIONAL',
  chatUsername: '',
  referralSourceId: null,
};

interface BirthdateInput {
  year: string;
  month: string;
  day: string;
}

export function StudentEditPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const canManageStudents = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const studentId = id ? Number(id) : null;
  const isNew = studentId === null;

  const studentQuery = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchStudent(studentId as number),
    enabled: !isNew && Number.isFinite(studentId),
  });

  const referralSourceQuery = useQuery({
    queryKey: ['referral-source-options'],
    queryFn: fetchReferralSourceOptions,
    enabled: canManageStudents,
  });

  if (!canManageStudents) {
    return <Navigate to="/students" replace />;
  }

  if (!isNew && !Number.isFinite(studentId)) {
    return <Navigate to="/students" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{isNew ? '受講生登録' : '受講生編集'}</h2>
          <p className="text-muted-foreground">受講生情報を登録・更新します。</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={isNew ? '/students' : `/students/${studentId}`}>戻る</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? '受講生登録' : '受講生編集'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!isNew && studentQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : !isNew && studentQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(studentQuery.error, '受講生情報の取得に失敗しました')}
            </p>
          ) : (
            <StudentEditForm
              key={isNew ? 'new-student' : `edit-student-${studentQuery.data?.id ?? studentId}`}
              isNew={isNew}
              studentId={studentId}
              initialForm={toInitialForm(studentQuery.data)}
              referralSources={referralSourceQuery.data ?? []}
              referralSourcesLoading={referralSourceQuery.isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StudentEditFormProps {
  isNew: boolean;
  studentId: number | null;
  initialForm: StudentInput;
  referralSources: ReferralSourceOption[];
  referralSourcesLoading: boolean;
}

function StudentEditForm({
  isNew,
  studentId,
  initialForm,
  referralSources,
  referralSourcesLoading,
}: StudentEditFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StudentInput>(initialForm);
  const [birthdateInput, setBirthdateInput] = useState<BirthdateInput>(() => toBirthdateInput(initialForm.birthdate));
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: (input: StudentInput) => {
      if (isNew) {
        return createStudent(input);
      }
      return updateStudent(studentId as number, input);
    },
    onSuccess: async (student) => {
      setFormError('');
      setFieldErrors({});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['student', student.id] }),
      ]);
      navigate(`/students/${student.id}`);
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, '受講生の保存に失敗しました'));
      setFieldErrors(getApiValidationErrors(error));
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    saveMutation.mutate(form);
  };

  const setValue = <K extends keyof StudentInput>(key: K, value: StudentInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const birthdateDays = getBirthdateDays(birthdateInput.year, birthdateInput.month);

  const handleBirthdateChange = (key: keyof BirthdateInput, value: string) => {
    const next = { ...birthdateInput, [key]: value };
    const maxDay = getDaysInMonth(next.year, next.month);

    if (next.day && maxDay > 0 && Number(next.day) > maxDay) {
      next.day = '';
    }

    setBirthdateInput(next);
    setValue('birthdate', toBirthdateValue(next));
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">氏名</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => setValue('name', event.target.value)}
            maxLength={100}
            required
          />
          {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setValue('email', event.target.value)}
            maxLength={255}
            required
          />
          {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">電話番号</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(event) => setValue('phone', event.target.value)}
            maxLength={20}
          />
          {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label>生年月日</Label>
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={birthdateInput.year || EMPTY_VALUE}
              onValueChange={(value) => handleBirthdateChange('year', value === EMPTY_VALUE ? '' : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="年" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_VALUE}>年</SelectItem>
                {BIRTHDATE_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={birthdateInput.month || EMPTY_VALUE}
              onValueChange={(value) => handleBirthdateChange('month', value === EMPTY_VALUE ? '' : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="月" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_VALUE}>月</SelectItem>
                {BIRTHDATE_MONTHS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={birthdateInput.day || EMPTY_VALUE}
              onValueChange={(value) => handleBirthdateChange('day', value === EMPTY_VALUE ? '' : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="日" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_VALUE}>日</SelectItem>
                {birthdateDays.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}日
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">未入力のままでも保存できます。</p>
          {fieldErrors.birthdate && <p className="text-sm text-destructive">{fieldErrors.birthdate}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">住所</Label>
          <Textarea
            id="address"
            value={form.address}
            onChange={(event) => setValue('address', event.target.value)}
            rows={3}
          />
          {fieldErrors.address && <p className="text-sm text-destructive">{fieldErrors.address}</p>}
        </div>

        <div className="space-y-2">
          <Label>性別</Label>
          <Select
            value={form.gender || EMPTY_VALUE}
            onValueChange={(value) => setValue('gender', value === EMPTY_VALUE ? '' : (value as Gender))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="性別を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>未設定</SelectItem>
              {(Object.keys(GENDER_LABELS) as Gender[]).map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {GENDER_LABELS[gender]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.gender && <p className="text-sm text-destructive">{fieldErrors.gender}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="chatUsername">チャットユーザー名</Label>
          <Input
            id="chatUsername"
            value={form.chatUsername}
            onChange={(event) => setValue('chatUsername', event.target.value)}
            maxLength={100}
          />
          {fieldErrors.chatUsername && (
            <p className="text-sm text-destructive">{fieldErrors.chatUsername}</p>
          )}
        </div>

        {isNew && (
          <div className="space-y-2">
            <Label>初期状態</Label>
            <Select value={form.status} onValueChange={(value) => setValue('status', value as StudentStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="初期状態を選択" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STUDENT_STATUS_LABELS) as StudentStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STUDENT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.status && <p className="text-sm text-destructive">{fieldErrors.status}</p>}
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label>申込経路</Label>
          <Select
            value={form.referralSourceId ? String(form.referralSourceId) : EMPTY_VALUE}
            onValueChange={(value) =>
              setValue('referralSourceId', value === EMPTY_VALUE ? null : Number(value))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="申込経路を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>選択してください</SelectItem>
              {referralSources.map((source) => (
                <SelectItem key={source.id} value={String(source.id)}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.referralSourceId && (
            <p className="text-sm text-destructive">{fieldErrors.referralSourceId}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saveMutation.isPending || referralSourcesLoading}>
          {saveMutation.isPending ? '保存中...' : '保存'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to={isNew ? '/students' : `/students/${studentId}`}>キャンセル</Link>
        </Button>
      </div>
    </form>
  );
}

function toInitialForm(student?: StudentDetail): StudentInput {
  if (!student) {
    return initialFormState;
  }

  return {
    name: student.name,
    email: student.email === '非公開' ? '' : student.email,
    phone: student.phone ?? '',
    address: student.address ?? '',
    birthdate: student.birthdate ?? '',
    gender: student.gender ?? '',
    status: student.status,
    chatUsername: student.chatUsername ?? '',
    referralSourceId: student.referralSourceId,
  };
}

function toBirthdateInput(birthdate: string): BirthdateInput {
  if (!birthdate) {
    return { year: '', month: '', day: '' };
  }

  const [year = '', month = '', day = ''] = birthdate.split('-');
  return {
    year,
    month: String(Number(month) || ''),
    day: String(Number(day) || ''),
  };
}

function toBirthdateValue(input: BirthdateInput): string {
  if (!input.year || !input.month || !input.day) {
    return '';
  }

  const month = input.month.padStart(2, '0');
  const day = input.day.padStart(2, '0');
  const maxDay = getDaysInMonth(input.year, input.month);
  if (maxDay === 0 || Number(input.day) > maxDay) {
    return '';
  }

  return `${input.year}-${month}-${day}`;
}

function getBirthdateDays(year: string, month: string) {
  const daysInMonth = getDaysInMonth(year, month) || 31;
  return Array.from({ length: daysInMonth }, (_, index) => String(index + 1));
}

function getDaysInMonth(year: string, month: string) {
  const numericMonth = Number(month);

  if (!numericMonth) {
    return 0;
  }

  const numericYear = Number(year) || 2000;
  return new Date(numericYear, numericMonth, 0).getDate();
}
